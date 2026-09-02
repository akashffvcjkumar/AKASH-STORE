import crypto from 'crypto';

/**
 * Modern secure password hashing using Node.js crypto.scrypt
 * Memory-hard, resistant to GPU/ASIC attacks, equivalent in security to Argon2id
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return {
    hash: derivedKey.toString('hex'),
    salt,
  };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(hash, 'hex');
    if (derivedKey.length !== keyBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(derivedKey, keyBuffer);
  } catch {
    return false;
  }
}

/**
 * Generates an unguessable 12-character temporary password
 */
export function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let result = '';
  const bytes = crypto.randomBytes(12);
  for (let i = 0; i < 12; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

/**
 * Generates a high-entropy 64-character session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generates official AKASH STORE Order ID format: AKS-YYYYMMDD-000123
 */
export function generateOrderId(sequenceNumber: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const seq = String(sequenceNumber).padStart(6, '0');
  return `AKS-${year}${month}${day}-${seq}`;
}
