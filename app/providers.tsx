"use client";
import { createContext, useContext, useState } from "react";
import PGLiteManager from "@/lib/pglite";

interface AppContext {
  db: PGLiteManager;
  selectedDatasetVersion: string;
  selectDatasetVersion: (version: string) => void;
}

const AppContext = createContext<AppContext | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [db] = useState(() => PGLiteManager.getInstance("smart-transformations-db"));
  const [selectedDatasetVersion, selectDatasetVersion] = useState<string>("latest");

  return (
    <AppContext.Provider value={{
      db,
      selectedDatasetVersion,
      selectDatasetVersion
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