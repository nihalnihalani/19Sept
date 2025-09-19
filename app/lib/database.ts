import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import type { MediaMetadata } from './types';

// SQLite database implementation using sql.js
let Database: any;
let db: any;
let initialized = false;

async function initializeDatabase() {
  if (initialized) return;
  
  // For now, just use JSON storage which is working perfectly
  // SQLite can be enabled later if needed
  console.log('Using JSON file storage for media database');
  await initializeFallbackDatabase();
  initialized = true;
}

async function createTables() {
  if (!db) return;
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('image', 'video', 'audio', 'other')),
      title TEXT,
      description TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      width INTEGER,
      height INTEGER,
      duration REAL,
      size INTEGER,
      checksum TEXT,
      tags TEXT -- JSON array as string
    );
    
    CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);
    CREATE INDEX IF NOT EXISTS idx_media_created ON media(createdAt);
    CREATE INDEX IF NOT EXISTS idx_media_title ON media(title);
  `;
  
  db.exec(createTableSQL);
}

function saveDatabase() {
  if (!db || typeof window !== 'undefined') return;
  
  try {
    const dbPath = path.join(process.cwd(), 'media.db');
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(dbPath, buffer);
  } catch (e) {
    console.error('Could not save database:', e);
  }
}

// Fallback to JSON storage if SQLite fails
let mediaStore: MediaMetadata[] = [];

async function initializeFallbackDatabase() {
  const dbPath = path.join(process.cwd(), 'media.json');
  if (existsSync(dbPath)) {
    try {
      const data = readFileSync(dbPath, 'utf8');
      mediaStore = JSON.parse(data);
    } catch (e) {
      console.warn('Could not load existing media data:', e);
      mediaStore = [];
    }
  }
}

function saveFallbackDatabase() {
  try {
    const dbPath = path.join(process.cwd(), 'media.json');
    writeFileSync(dbPath, JSON.stringify(mediaStore, null, 2));
  } catch (e) {
    console.error('Could not save media data:', e);
  }
}

export async function insertMedia(media: Omit<MediaMetadata, 'createdAt'>): Promise<MediaMetadata> {
  await initializeDatabase();
  
  const newMedia: MediaMetadata = {
    ...media,
    createdAt: new Date().toISOString()
  };
  
  // Use JSON storage
  const existingIndex = mediaStore.findIndex(m => m.id === media.id);
  if (existingIndex >= 0) {
    mediaStore[existingIndex] = newMedia;
  } else {
    mediaStore.push(newMedia);
  }
  
  saveFallbackDatabase();
  return newMedia;
}

export async function getMediaById(id: string): Promise<MediaMetadata | null> {
  await initializeDatabase();
  
  // Use JSON storage
  const media = mediaStore.find(m => m.id === id);
  return media || null;
}

export async function getAllMedia(limit = 50, offset = 0): Promise<MediaMetadata[]> {
  await initializeDatabase();
  
  // Use JSON storage
  const sorted = [...mediaStore].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });
  
  return sorted.slice(offset, offset + limit);
}

export async function deleteMedia(id: string): Promise<boolean> {
  await initializeDatabase();
  
  // Use JSON storage
  const initialLength = mediaStore.length;
  mediaStore = mediaStore.filter(m => m.id !== id);
  
  if (mediaStore.length < initialLength) {
    saveFallbackDatabase();
    return true;
  }
  
  return false;
}

export async function updateMedia(id: string, updates: Partial<Omit<MediaMetadata, 'id' | 'createdAt'>>): Promise<MediaMetadata | null> {
  await initializeDatabase();
  
  // Use JSON storage
  const index = mediaStore.findIndex(m => m.id === id);
  if (index === -1) return null;
  
  mediaStore[index] = {
    ...mediaStore[index],
    ...updates
  };
  
  saveFallbackDatabase();
  return mediaStore[index];
}

export async function searchMedia(query: string, limit = 20): Promise<MediaMetadata[]> {
  await initializeDatabase();
  
  // Use JSON storage
  const searchTerm = query.toLowerCase();
  const filtered = mediaStore.filter(media => {
    const titleMatch = media.title?.toLowerCase().includes(searchTerm);
    const descMatch = media.description?.toLowerCase().includes(searchTerm);
    return titleMatch || descMatch;
  });
  
  const sorted = filtered.sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });
  
  return sorted.slice(0, limit);
}

export function closeDatabase() {
  saveFallbackDatabase();
}

// Cleanup function for graceful shutdown - only in Node.js environment
if (typeof process !== 'undefined') {
  process.on('exit', closeDatabase);
  process.on('SIGINT', closeDatabase);
  process.on('SIGTERM', closeDatabase);
}
