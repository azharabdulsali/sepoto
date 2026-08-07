const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const initDb = require('./src/config/initDb');
const authRoutes = require('./src/routes/auth.routes');
const photosRoutes = require('./src/routes/photos.routes');
const eventsRoutes = require('./src/routes/events.routes');
const transactionsRoutes = require('./src/routes/transactions.routes');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ─── Keamanan: Peringatan JWT Secret lemah ──────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'sepoto_jwt_secret_key_2026') {
  console.warn('⚠️  PERINGATAN KEAMANAN: JWT_SECRET belum dikonfigurasi dengan secret yang kuat!');
  console.warn('   Jalankan: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))" untuk generate secret baru.');
  if (NODE_ENV === 'production') {
    console.error('❌  PRODUKSI: JWT_SECRET wajib dikonfigurasi sebelum server dijalankan!');
    process.exit(1);
  }
}

// ─── CORS: Hanya izinkan origin yang sudah terdaftar ────────────────────
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
];
if (process.env.ADDITIONAL_ORIGINS) {
  ALLOWED_ORIGINS.push(...process.env.ADDITIONAL_ORIGINS.split(',').map((o) => o.trim()));
}

app.use(cors({
  origin: (origin, callback) => {
    // Izinkan request tanpa origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`🚫 CORS ditolak untuk origin: ${origin}`);
    return callback(new Error(`CORS: Origin '${origin}' tidak diizinkan.`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Helmet: HTTP Security Headers ──────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Izinkan gambar dari frontend
}));

// ─── Body Parser: Batasi ukuran request ─────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rate Limiting: Auth endpoints (anti brute-force) ────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 menit
  max: 10,                    // Maks 10 percobaan login per IP per 15 menit
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Silakan coba lagi setelah 15 menit.',
  },
  skip: () => NODE_ENV === 'development', // Skip di development agar tidak mengganggu testing
});

// ─── Rate Limiting: Upload endpoint (anti abuse) ─────────────────────────
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 menit
  max: 30,                   // Maks 30 upload per menit per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak upload. Silakan tunggu sebentar.',
  },
  skip: () => NODE_ENV === 'development',
});

// ─── Health-Check Route ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const isMaintenance = process.env.MAINTENANCE_MODE === 'true';
  res.json({
    status: 'OK',
    app: 'Sepoto Backend API',
    env: NODE_ENV,
    maintenance: isMaintenance,
    timestamp: new Date().toISOString(),
  });
});

// ─── Maintenance Mode Middleware (Role-Aware Bypass) ─────────────────────
const jwt = require('jsonwebtoken');

app.use((req, res, next) => {
  const isMaintenance = process.env.MAINTENANCE_MODE === 'true';
  if (!isMaintenance) return next();

  // 1. Health check & Admin Login bypass
  if (
    req.path.startsWith('/api/health') ||
    req.path.startsWith('/api/auth/login-admin')
  ) {
    return next();
  }

  // 2. Token role-based bypass (Super Admin, Event Admin, Photographer)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      if (
        decoded &&
        ['super_admin', 'admin', 'photographer'].includes(decoded.role)
      ) {
        return next(); // Disetujui bypass maintenance untuk admin/fotografer
      }
    } catch (_err) {
      // Token tidak valid / expired, lanjukan ke blok 503 maintenance
    }
  }

  return res.status(503).json({
    success: false,
    maintenance: true,
    message:
      'Sistem Sepoto sedang dalam pemeliharaan rutin. Akses peserta umum sementara ditutup.',
  });
});

// ─── Modular API Routes (dengan Rate Limiting) ───────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/photos/upload', uploadLimiter); // Extra limit untuk upload (dipasang sebelum photosRoutes)
app.use('/api/photos', photosRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/transactions', transactionsRoutes);

// ─── Global Error Handler ────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ success: false, message: err.message });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ─── Start Server & Init DB ──────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`🚀 Sepoto Backend API Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`🔒 CORS allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
  await initDb();
});
