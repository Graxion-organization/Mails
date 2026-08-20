import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Compose/Send rate limiter (stricter)
 */
export const composeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    message: 'Sending too many emails. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Search rate limiter
 */
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    message: 'Too many search requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Upload rate limiter
 */
export const uploadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: 'Too many upload requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default { apiLimiter, composeLimiter, searchLimiter, uploadLimiter };
