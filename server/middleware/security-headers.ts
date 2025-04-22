import { Request, Response, NextFunction } from 'express';

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Set security headers
  
  // Helps prevent XSS attacks
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevents MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Controls how much information the browser includes with referrers
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Prevents clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // Content Security Policy - customize based on your needs
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'"
    );
  }
  
  next();
}
