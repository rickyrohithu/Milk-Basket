const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Verifies the JWT from the Authorization header.
 * Attaches { id, role } to req.user on success.
 *
 * Usage:  router.get('/protected', authenticate, handler)
 */
const authenticate = (req, res , next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/**
 * Restricts access to specific roles.
 * Must come AFTER authenticate.
 *
 * Usage:  router.get('/admin-only', authenticate, authorize('ADMIN'), handler)
 *         router.get('/sellers',    authenticate, authorize('SELLER', 'ADMIN'), handler)
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role(s): ${roles.join(', ')}`,
    });
  }
  next();
};

/**
 * Ensures the logged-in user can only access their OWN record.
 * Compares req.user.id (from JWT) with req.params.id (from URL).
 * Must come AFTER authenticate.
 *
 * Usage:  router.put('/:id', authenticate, requireSelf, handler)
 */
const requireSelf = (req, res, next) => {
  if (req.user?.id !== Number(req.params.id)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only modify your own account.',
    });
  }
  next();
};

module.exports = { authenticate, authorize, requireSelf };
