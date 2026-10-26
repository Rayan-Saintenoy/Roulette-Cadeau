import crypto from 'crypto';

// Secret key for AES-256-GCM encryption
// Uses APP_SECRET or NEXTAUTH_SECRET or falls back to a deterministic application key
const SECRET_SEED =
  process.env.APP_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'roulette-cadeau-secret-santa-production-seed-2026';

const ENCRYPTION_KEY = crypto.createHash('sha256').update(SECRET_SEED).digest();

export interface TokenPayload {
  sessionTitle: string;
  budget?: string;
  message?: string;
  giverName: string;
  receiverName: string;
  pairId?: string;
}

/**
 * Encrypts Secret Santa reveal data into a URL-safe tamper-proof token (AES-256-GCM)
 */
export function encodeRevealToken(payload: TokenPayload): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);

  const compact = {
    t: payload.sessionTitle,
    b: payload.budget || '',
    m: payload.message || '',
    g: payload.giverName,
    r: payload.receiverName,
    id: payload.pairId || '',
  };

  const json = JSON.stringify(compact);
  let encrypted = cipher.update(json, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const tag = cipher.getAuthTag();

  // Combine IV (12 bytes) + AuthTag (16 bytes) + Encrypted ciphertext
  const combined = Buffer.concat([iv, tag, encrypted]);
  return combined.toString('base64url');
}

/**
 * Decrypts and authenticates a reveal token.
 * Returns null if the token is invalid, corrupted, or tampered with.
 */
export function decodeRevealToken(token: string): TokenPayload | null {
  try {
    const combined = Buffer.from(token, 'base64url');
    // Minimum size: 12 (iv) + 16 (tag) + 1 (data) = 29 bytes
    if (combined.length < 29) {
      return null;
    }

    const iv = combined.subarray(0, 12);
    const tag = combined.subarray(12, 28);
    const encrypted = combined.subarray(28);

    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    const parsed = JSON.parse(decrypted.toString('utf8'));

    return {
      sessionTitle: parsed.t || 'Secret Santa',
      budget: parsed.b || undefined,
      message: parsed.m || undefined,
      giverName: parsed.g,
      receiverName: parsed.r,
      pairId: parsed.id || undefined,
    };
  } catch {
    return null;
  }
}
