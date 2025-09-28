"use client";

import { useDatasets, useDeleteDataset } from "@/hooks/datasets";
import { DatasetTable } from "@/lib/pglite";
import Link from "next/link";
import { FileText, Database, Calendar, HardDrive, Loader2, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";


export function DatasetList() {
  const { data, isLoading, isError } = useDatasets();
  const [datasetIdToDelete, setDatasetIdToDelete] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-700">
          <div className="h-5 w-5 text-red-500">⚠</div>
          <span>Error loading datasets: {isError}</span>
        </div>
      </div>
    );
  }

  if (!data || data.rows.length === 0) {
    // TODO give the option to a uset to use a predefine dataset
    return null;
  }

  const datasets = data.rows as DatasetTable[];

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
        <h2 className="text-xl font-semibold text-gray-900">Your Datasets</h2>
        <span className="text-sm text-gray-500">{datasets.length} dataset{datasets.length !== 1 ? 's' : ''}</span>
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
            <div className="bg-white border border-gray-300 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium text-lg text-gray-900 truncate" title={dataset.name}>
                      {dataset.name}
                    </h3>
                  </div>

                  <button className="text-gray-400 hover:text-gray-900 cursor-pointer" onClick={() => setDatasetIdToDelete(dataset.id)}>
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <HardDrive className="h-4 w-4" />
                  <span>{formatFileSize(dataset.size)}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FileText className="h-4 w-4" />
                  <span>{dataset.filename}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>Created {formatDate(dataset.created_at)}</span>
                </div>

                {dataset.updated_at !== dataset.created_at && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>Updated {formatDate(dataset.updated_at)}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link href={`/${dataset.slug}`}>
                  <div className="flex items-center justify-between hover:bg-blue-50 p-2 rounded-md text-blue-600">
                    <span className="text-sm uppercase tracking-wide font-medium">
                      Abrir dataset
                    </span>
                    <div className="text-blue-600 group-hover:text-blue-700">
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
      <DialogContent className="bg-white">
        <DialogTitle>Delete Dataset</DialogTitle>

        <p className="text-gray-900">Are you sure you want to delete <span className="font-bold">{datasetToDelete}</span> dataset?</p>

        {error && <p className="text-red-700">{error.message}</p>}

        <div className="flex items-center justify-end gap-2">
          <button className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-md cursor-pointer" onClick={() => setDatasetToDelete(null)}>Cancel</button>

          <button
            className="bg-red-100 hover:bg-red-200 flex items-center gap-2 transition-all duration-200 text-red-700 text-sm px-4 py-2 rounded-md cursor-pointer"
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