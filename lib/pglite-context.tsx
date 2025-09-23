'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import PGLiteManager from '@/lib/pglite';

interface PGLiteContextValue {
  db: PGLiteManager;
  isReady: boolean;
  error: string | null;
  reconnect: () => Promise<void>;
}

const PGLiteContext = createContext<PGLiteContextValue | null>(null);

interface PGLiteProviderProps {
  children: ReactNode;
  dbName?: string;
}

export function PGLiteProvider({ children, dbName }: PGLiteProviderProps) {
  const [db] = useState(() => PGLiteManager.getInstance(dbName));
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = async () => {
    try {
      setError(null);
      const ready = await db.isReady();
      setIsReady(ready);
      
      if (!ready) {
        // Try to initialize the database
        await db.getDb();
        const retryReady = await db.isReady();
        setIsReady(retryReady);
      }
    } catch (err) {
      console.error('PGLite connection error:', err);
      setError(err instanceof Error ? err.message : 'Database connection failed');
      setIsReady(false);
    }
  };

  const reconnect = async () => {
    setError(null);
    setIsReady(false);
    await checkConnection();
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const contextValue: PGLiteContextValue = {
    db,
    isReady,
    error,
    reconnect,
  };

  return (
    <PGLiteContext.Provider value={contextValue}>
      {children}
    </PGLiteContext.Provider>
  );
}

export function usePGLiteDB(): PGLiteContextValue {
  const context = useContext(PGLiteContext);
  
  if (!context) {
    throw new Error('usePGLiteDB must be used within a PGLiteProvider');
  }
  
  return context;
}
