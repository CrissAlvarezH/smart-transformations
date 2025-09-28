"use client";
import { createContext, useContext, useState } from "react";
import PGLiteManager from "@/lib/pglite";

interface AppContext {
  db: PGLiteManager;
}

const AppContext = createContext<AppContext | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [db] = useState(() => PGLiteManager.getInstance("smart-transformations-db"));

  return (
    <AppContext.Provider value={{
      db,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within a AppProvider');
  }
  return context;
}