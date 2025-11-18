"use client";
import { DatasetTable } from "@/lib/pglite";
import { createContext, useContext, useState } from "react";

export const SAVED_CHARTS_LIMIT = 6; 

export type ActiveTab = 'spreadsheet' | 'charts';

interface WorkspaceContext {
  dataset: DatasetTable;
  selectedDatasetVersion: string;
  selectDatasetVersion: (version: string) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const WorkspaceContext = createContext<WorkspaceContext | null>(null);


export function WorkspaceProvider({ children, dataset }: { children: React.ReactNode, dataset: DatasetTable }) {
  const [selectedDatasetVersion, selectDatasetVersion] = useState<string>("latest");
  const [activeTab, setActiveTab] = useState<ActiveTab>('spreadsheet');

  return (
    <WorkspaceContext.Provider value={{
      activeTab,
      setActiveTab,
      dataset,
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