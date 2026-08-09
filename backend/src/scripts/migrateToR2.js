const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const isR2Configured = Boolean(
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  !process.env.R2_ACCESS_KEY_ID.includes('YOUR_')
);

if (!isR2Configured) {
  console.error('❌ Error: Cloudflare R2 belum dikonfigurasi di file .env!');
  console.error('Pastikan R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY sudah diisi.');
  process.exit(1);
}

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'sepoto-photos';
const uploadsDir = path.join(__dirname, '../../uploads');

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

async function fileExistsInR2(key) {
  try {
    await r2Client.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
    return true;
  } catch (err) {
    return false;
  }
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.svg') return 'image/svg+xml';
  return 'image/jpeg';
}

async function startMigration() {
  console.log('🚀 Memulai Proses Migrasi Foto dari Disk Lokal VPS ke Cloudflare R2...');
  console.log(`📁 Folder Sumber: ${uploadsDir}`);
  console.log(`☁️ Bucket R2 Target: ${BUCKET_NAME}`);
  console.log('---------------------------------------------------------');

  if (!fs.existsSync(uploadsDir)) {
    console.log('⚠️ Folder uploads/ tidak ditemukan. Tidak ada data yang perlu dimigrasi.');
    return;
  }

  const allFiles = getAllFiles(uploadsDir);
  console.log(`📊 Ditemukan total ${allFiles.length} file di folder uploads/.\n`);

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < allFiles.length; i++) {
    const filePath = allFiles[i];
    const relativePath = path.relative(uploadsDir, filePath);
    // Standardize to unix-style forward slashes for R2 key
    const r2Key = relativePath.replace(/\\/g, '/');

    try {
      const alreadyExists = await fileExistsInR2(r2Key);
      if (alreadyExists) {
        console.log(`[${i + 1}/${allFiles.length}] ⏭️ Dilewati (sudah ada di R2): ${r2Key}`);
        skippedCount++;
        continue;
      }

      const fileBuffer = fs.readFileSync(filePath);
      const contentType = getContentType(filePath);

      await r2Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: r2Key,
          Body: fileBuffer,
          ContentType: contentType,
        })
      );

      console.log(`[${i + 1}/${allFiles.length}] ✅ Berhasil di-upload ke R2: ${r2Key}`);
      successCount++;
    } catch (err) {
      console.error(`[${i + 1}/${allFiles.length}] ❌ Gagal meng-upload ${r2Key}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n=========================================================');
  console.log('🎉 MIGRASI SELESAI!');
  console.log(`- Berhasil di-upload ke R2 : ${successCount} file`);
  console.log(`- Sudah ada di R2 (skipped): ${skippedCount} file`);
  console.log(`- Gagal                   : ${errorCount} file`);
  console.log('=========================================================');
  console.log('\n💡 PETUNJUK KEAMANAN DATA:');
  console.log('1. Jangan langsung menghapus folder uploads/.');
  console.log('2. Uji coba buka aplikasi & foto-foto di web untuk memastikan foto tampil sempurna.');
  console.log('3. Jika semua foto tampil aman, Anda bisa memindahkan folder uploads/ ke backup:');
  console.log('   mv /var/www/sepoto/backend/uploads /var/www/sepoto/backend/uploads_backup');
  console.log('4. Jika dalam beberapa hari aplikasi tetap lancar, Anda bisa menghapus uploads_backup.');
}

startMigration();
