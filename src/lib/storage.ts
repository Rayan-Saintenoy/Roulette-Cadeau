import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { DrawSession, RevealData } from './types';
import { decodeRevealToken } from './token';

// On Vercel and serverless platforms, the root /var/task is read-only.
// We use os.tmpdir() when running on Vercel or in production serverless environments.
const isServerless =
  Boolean(process.env.VERCEL) ||
  Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
  process.env.NODE_ENV === 'production';

const DATA_DIR = isServerless
  ? path.join(os.tmpdir(), 'roulette-cadeau-data')
  : path.join(process.cwd(), 'data');

const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// In-memory cache for ultra-fast lookup and fallback
const memoryCache = new Map<string, DrawSession>();
const revealedTokens = new Set<string>();

async function ensureDataDir(): Promise<boolean> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    return true;
  } catch (err) {
    console.warn('[Storage] Impossible de créer DATA_DIR (environnement restreint):', err);
    return false;
  }
}

async function loadSessions(): Promise<Map<string, DrawSession>> {
  if (memoryCache.size > 0) {
    return memoryCache;
  }

  const dirOk = await ensureDataDir();
  if (!dirOk) return memoryCache;

  try {
    const raw = await fs.readFile(SESSIONS_FILE, 'utf-8');
    const list: DrawSession[] = JSON.parse(raw);
    for (const session of list) {
      memoryCache.set(session.id, session);
    }
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException;
    if (error.code !== 'ENOENT') {
      console.warn('[Storage] Lecture sessions.json ignorée:', err);
    }
  }

  return memoryCache;
}

async function persistSessions(): Promise<void> {
  try {
    const dirOk = await ensureDataDir();
    if (!dirOk) return;

    const list = Array.from(memoryCache.values());
    const tempFile = path.join(DATA_DIR, `sessions-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.tmp`);

    await fs.writeFile(tempFile, JSON.stringify(list, null, 2), 'utf-8');
    await fs.rename(tempFile, SESSIONS_FILE);
  } catch (err) {
    // On serverless environments like Vercel, filesystem writes may fail silently
    // Tokens are also statelessly encrypted, so failure to write disk cache is non-blocking!
    console.warn('[Storage] Écriture disque ignorée (mode serverless / read-only):', err);
  }
}

/**
 * Save or update a draw session
 */
export async function saveDrawSession(session: DrawSession): Promise<void> {
  memoryCache.set(session.id, session);
  await persistSessions();
}

/**
 * Retrieve a session by its ID
 */
export async function getDrawSession(id: string): Promise<DrawSession | null> {
  const sessions = await loadSessions();
  return sessions.get(id) || null;
}

/**
 * Find reveal data associated with a secure token.
 * 1. Attempts to decrypt stateless token (100% resilient across all serverless instances).
 * 2. Falls back to database/file storage lookup.
 */
export async function getRevealData(token: string): Promise<RevealData | null> {
  // 1. Try stateless decrypt first (works on Vercel across multiple lambdas with zero disk needed!)
  const decoded = decodeRevealToken(token);
  if (decoded && decoded.giverName && decoded.receiverName) {
    const isRevealed = revealedTokens.has(token);
    return {
      sessionTitle: decoded.sessionTitle,
      budget: decoded.budget,
      message: decoded.message,
      giverName: decoded.giverName,
      receiverName: decoded.receiverName,
      revealed: isRevealed,
      revealedAt: isRevealed ? new Date().toISOString() : undefined,
    };
  }

  // 2. Fallback to sessions storage for legacy UUID tokens
  const sessions = await loadSessions();
  for (const session of sessions.values()) {
    const pair = session.pairs.find((p) => p.token === token);
    if (pair) {
      return {
        sessionTitle: session.title,
        budget: session.budget,
        message: session.message,
        giverName: pair.giverName,
        receiverName: pair.receiverName,
        revealed: pair.revealed || revealedTokens.has(token),
        revealedAt: pair.revealedAt,
      };
    }
  }

  return null;
}

/**
 * Mark a token as revealed
 */
export async function markAsRevealed(token: string): Promise<boolean> {
  revealedTokens.add(token);

  // Also update session if present
  const sessions = await loadSessions();
  for (const session of sessions.values()) {
    const pair = session.pairs.find((p) => p.token === token);
    if (pair) {
      pair.revealed = true;
      pair.revealedAt = new Date().toISOString();
      await persistSessions();
      return true;
    }
  }

  return true;
}
