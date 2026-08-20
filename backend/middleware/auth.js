import jwt from 'jsonwebtoken';

const AUTH_SECRET = process.env.GRAXION_AUTH_JWT_SECRET || process.env.JWT_SECRET;

/**
 * Verify Graxion Auth JWT token — protects Mail API routes
 * Reads token from Authorization header or graxion_access_token cookie
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check cookies
    else if (req.cookies?.graxion_access_token) {
      token = req.cookies.graxion_access_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required — please login to Graxion',
      });
    }

    if (!AUTH_SECRET) {
      console.error('❌ GRAXION_AUTH_JWT_SECRET not set');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, AUTH_SECRET);
    req.account = { id: decoded.id, type: decoded.type };
    req.accountId = decoded.id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Session expired. Please refresh your token.',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

/**
 * Optional auth — attach account if token exists, but don't block
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.graxion_access_token) {
      token = req.cookies.graxion_access_token;
    }

    if (token && AUTH_SECRET) {
      const decoded = jwt.verify(token, AUTH_SECRET);
      req.account = { id: decoded.id, type: decoded.type };
      req.accountId = decoded.id;
    }
  } catch {
    // Silently fail — optional auth
  }
  next();
};

export default { protect, optionalAuth };
