"use client";
import { createContext, useContext, useState } from "react";

interface WorkspaceContext {
  selectedDatasetVersion: string;
  selectDatasetVersion: (version: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContext | null>(null);


export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [selectedDatasetVersion, selectDatasetVersion] = useState<string>("latest");

  return (
    <WorkspaceContext.Provider value={{
      selectedDatasetVersion,
      selectDatasetVersion
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspaceContext must be used within a WorkspaceProvider');
  }
  return context;
}