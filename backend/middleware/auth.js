const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key');
    req.user = decoded;
  } catch (err) {
    req.user = null;
  }
  next();
};

const requireRole = (roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Non authentifié' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Accès refusé' });
  next();
};

module.exports = { authenticate, requireRole };