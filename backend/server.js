const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const initDb = require('./src/config/initDb');
const authRoutes = require('./src/routes/auth.routes');
const photosRoutes = require('./src/routes/photos.routes');
const eventsRoutes = require('./src/routes/events.routes');
const transactionsRoutes = require('./src/routes/transactions.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ──────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health-Check Route ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'Sepoto Backend API',
    timestamp: new Date().toISOString(),
  });
});

// ─── Modular API Routes ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/photos', photosRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/transactions', transactionsRoutes);

// ─── Start Server & Init DB ──────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`🚀 Sepoto Backend API Server running on http://localhost:${PORT}`);
  await initDb();
});
