"use client";

import { useDatasets, useDeleteDataset } from "@/hooks/datasets";
import { DatasetTable } from "@/lib/pglite";
import Link from "next/link";
import { FileText, Database, Calendar, HardDrive, Loader2, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { DatasetItem } from "@/services/datasets";


export function DatasetList() {
  const { data: datasets, isLoading, isError } = useDatasets();
  const [datasetIdToDelete, setDatasetIdToDelete] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-zinc-400">
          <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-red-900/20 border border-red-800 rounded-lg">
        <div className="flex items-center gap-2 text-red-400">
          <div className="h-5 w-5 text-red-400">⚠</div>
          <span>Error loading datasets: {isError}</span>
        </div>
      </div>
    );
  }

  if (!datasets || datasets.length === 0) {
    return null;
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Your Datasets</h2>
        <span className="text-sm text-zinc-400">{datasets.length} dataset{datasets.length !== 1 ? 's' : ''}</span>
      </div>

      {datasetIdToDelete && (
        <DeleteDatasetButton datasetToDelete={datasetIdToDelete} setDatasetToDelete={setDatasetIdToDelete} />
      )}

      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {datasets.map((dataset) => (
          <div
            key={dataset.id}
            className="group block"
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-400" />
                    <h3 className="font-medium text-lg text-white truncate" title={dataset.name}>
                      {dataset.name}
                    </h3>
                    <span className="text-sm text-zinc-400 rounded-full bg-zinc-800 px-2 py-1">v{dataset.lastVersion}</span>
                  </div>

                  <button className="text-zinc-500 hover:text-zinc-300 cursor-pointer" onClick={() => setDatasetIdToDelete(dataset.id)}>
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <HardDrive className="h-4 w-4" />
                  <span>{formatFileSize(dataset.size)}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <FileText className="h-4 w-4" />
                  <span>{dataset.filename}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Calendar className="h-4 w-4" />
                  <span>Created {formatDate(dataset.created_at)}</span>
                </div>

                {dataset.updated_at !== dataset.created_at && (
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Calendar className="h-4 w-4" />
                    <span>Updated {formatDate(dataset.updated_at)}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-800">
                <Link href={`/${dataset.slug}`}>
                  <div className="flex items-center justify-between hover:bg-zinc-800 p-2 rounded-md text-blue-400">
                    <span className="text-sm uppercase tracking-wide font-medium">
                      Abrir dataset
                    </span>
                    <div className="text-blue-400 group-hover:text-blue-300">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function DeleteDatasetButton({
  datasetToDelete,
  setDatasetToDelete
}: {
  datasetToDelete: number | null,
  setDatasetToDelete: (datasetToDelete: number | null) => void
}) {
  const { mutateAsync: deleteDataset, isPending, error } = useDeleteDataset();

  const handleClick = async () => {
    if (datasetToDelete) {
      await deleteDataset(datasetToDelete);
      setDatasetToDelete(null);
    }
  };

  return (
    <Dialog open={datasetToDelete !== null} onOpenChange={(open) => setDatasetToDelete(open ? datasetToDelete : null)}>
      <DialogContent className="bg-zinc-900 border-zinc-800">
        <DialogTitle className="text-white">Delete Dataset</DialogTitle>

        <p className="text-zinc-300">Are you sure you want to delete <span className="font-bold text-white">{datasetToDelete}</span> dataset?</p>

        {error && <p className="text-red-400">{error.message}</p>}

        <div className="flex items-center justify-end gap-2">
          <button className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-sm px-4 py-2 rounded-md cursor-pointer transition-colors" onClick={() => setDatasetToDelete(null)}>Cancel</button>

          <button
            className="bg-red-900/50 hover:bg-red-900/70 border border-red-800 flex items-center gap-2 transition-all duration-200 text-red-300 text-sm px-4 py-2 rounded-md cursor-pointer"
            onClick={handleClick}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}