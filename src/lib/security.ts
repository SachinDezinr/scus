import { NextResponse } from 'next/server';

/**
 * Strips script tags and escapes HTML special characters to prevent XSS.
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

/**
 * Validates email format strictly.
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Trims sensitive fields (like password_hash) from user objects before returning in API responses.
 */
export function sanitizeUserPayload<T extends Record<string, any>>(user: T): Omit<T, 'password_hash'> {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

interface FileValidationOptions {
  maxSizeMB?: number;
  allowedMimeTypes?: string[];
}

/**
 * Validates uploaded files by size and MIME type.
 */
export function validateUploadedFile(
  file: File | null,
  options: FileValidationOptions = {}
): { valid: boolean; error?: string } {
  if (!file || file.size === 0) return { valid: true };

  const maxSizeMB = options.maxSizeMB || 5;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File size exceeds maximum limit of ${maxSizeMB}MB.` };
  }

  if (options.allowedMimeTypes && options.allowedMimeTypes.length > 0) {
    const isAllowed = options.allowedMimeTypes.some(mime => {
      if (mime.endsWith('/*')) {
        return file.type.startsWith(mime.slice(0, -1));
      }
      return file.type === mime;
    });

    if (!isAllowed) {
      return { valid: false, error: 'File format not supported.' };
    }
  }

  return { valid: true };
}

/**
 * Retrieves client IP address from request headers.
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}