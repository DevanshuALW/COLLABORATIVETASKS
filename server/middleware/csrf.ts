import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// CSRF token secret
const CSRF_SECRET = process.env.CSRF_SECRET || crypto.randomBytes(64).toString('hex');

// Generate a CSRF token
export function generateCsrfToken(req: Request): string {
  // Create a unique token based on IP address or other unique identifier
  // Since we don't have express-session set up, we'll use IP + user agent
  const clientIp = req.ip || req.socket.remoteAddress || '';
  const userAgent = req.headers['user-agent'] || '';
  const sessionId = `${clientIp}-${userAgent}` || crypto.randomBytes(16).toString('hex');
  const hmac = crypto.createHmac('sha256', CSRF_SECRET);
  hmac.update(sessionId);
  return hmac.digest('hex');
}

// CSRF protection middleware
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF check for GET, HEAD, OPTIONS requests as they should be idempotent
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Get the CSRF token from the request header or body
  const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
  const expectedToken = generateCsrfToken(req);

  // Verify the token
  if (!csrfToken || csrfToken !== expectedToken) {
    return res.status(403).json({
      message: 'CSRF token validation failed'
    });
  }

  next();
}

// Middleware to set CSRF token in response
export function setCsrfToken(req: Request, res: Response, next: NextFunction) {
  const token = generateCsrfToken(req);
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false, // Client-side JavaScript needs to read this
    secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
    sameSite: 'strict'
  });
  next();
}
