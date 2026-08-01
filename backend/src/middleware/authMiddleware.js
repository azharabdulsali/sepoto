const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sepoto_jwt_secret_key_2026';

/**
 * Middleware: Verifikasi JWT token dari header Authorization
 * Decode payload dan set req.user = { id, role, name }
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token tidak ditemukan.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Set user data dari token payload ke request object
    req.user = {
      id: decoded.id,
      role: decoded.role,
      name: decoded.name,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token sudah kadaluarsa. Silakan login kembali.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid.',
    });
  }
};

/**
 * Middleware Factory: Memeriksa apakah role user termasuk dalam daftar role yang diizinkan
 * @param  {...string} allowedRoles - Daftar role yang diizinkan (misal: 'super_admin', 'photographer')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Autentikasi diperlukan.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak. Hanya role [${allowedRoles.join(', ')}] yang diizinkan.`,
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  requireRole,
};
