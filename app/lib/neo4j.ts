// Legacy Neo4j compatibility layer - now using SQLite
// This file maintains the same interface for backward compatibility

import { 
  insertMedia, 
  getMediaById, 
  getAllMedia, 
  deleteMedia, 
  updateMedia, 
  searchMedia,
  closeDatabase 
} from './database';

// Mock session object for compatibility
export function getSession(database?: string) {
  return {
    // Mock session methods that were used in the original code
    run: async (query: string, params?: any) => {
      // This is a compatibility shim - the actual database operations
      // are now handled by the specific functions in database.ts
      console.warn('Legacy Neo4j session.run() called - consider migrating to direct database functions');
      return { records: [] };
    },
    close: async () => {
      // No-op for SQLite
    }
  };
}

// Mock driver functions for compatibility
export function getNeo4jDriver() {
  return {
    session: getSession,
    close: closeDatabase
  };
}

export async function closeDriver() {
  closeDatabase();
}
