import fs from 'fs/promises';
import path from 'path';
import { DrawSession, RevealData } from './types';

// Base data directory
const DATA_DIR = path.join(process.cwd(), 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// In-memory cache for ultra-fast lookup and zero latency
let memoryCache: Map<string, DrawSession> | null = null;

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Directory already exists or cannot be created
  }
}

async function loadSessions(): Promise<Map<string, DrawSession>> {
  if (memoryCache) {
    return memoryCache;
  }

  await ensureDataDir();
  memoryCache = new Map<string, DrawSession>();

  try {
    const raw = await fs.readFile(SESSIONS_FILE, 'utf-8');
    const list: DrawSession[] = JSON.parse(raw);
    for (const session of list) {
      memoryCache.set(session.id, session);
    }
  } catch (err: unknown) {
    // If file doesn't exist, start with empty map
    const error = err as NodeJS.ErrnoException;
    if (error.code !== 'ENOENT') {
      console.warn('Erreur de lecture du fichier sessions.json:', err);
    }
  }

  return memoryCache;
}

async function persistSessions(): Promise<void> {
  if (!memoryCache) return;
  await ensureDataDir();
  const list = Array.from(memoryCache.values());
  const tempFile = `${SESSIONS_FILE}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(list, null, 2), 'utf-8');
  await fs.rename(tempFile, SESSIONS_FILE);
}

/**
 * Save or update a draw session
 */
export async function saveDrawSession(session: DrawSession): Promise<void> {
  const sessions = await loadSessions();
  sessions.set(session.id, session);
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
 * Find reveal data associated with a secure token
 */
export async function getRevealData(token: string): Promise<RevealData | null> {
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
        revealed: pair.revealed,
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

  return false;
}
