"use client";

import { useDatasets } from "@/hooks/datasets";
import { DatasetTable } from "@/lib/pglite";
import Link from "next/link";
import { FileText, Database, Calendar, HardDrive, Loader2 } from "lucide-react";

export function DatasetList() {
  const { data, isLoading, isError } = useDatasets();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          <span>Loading datasets...</span>
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
    return (
      <div className="text-center p-8 bg-gray-50 border border-gray-200 rounded-lg">
        <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No datasets found</h3>
        <p className="text-gray-600">Upload a CSV file to get started with your first dataset.</p>
      </div>
    );
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

      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {datasets.map((dataset) => (
          <div
            key={dataset.table_name}
            className="group block"
          >
            <div className="bg-white border border-gray-300 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all duration-200 group-hover:scale-[1.01]">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-lg text-gray-900 truncate" title={dataset.filename}>
                    {dataset.filename}
                  </h3>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <HardDrive className="h-4 w-4" />
                  <span>{formatFileSize(dataset.size)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>Created {formatDate(dataset.created_at)}</span>
                </div>

                {dataset.updated_at !== dataset.created_at && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>Updated {formatDate(dataset.updated_at)}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link href={`/${dataset.table_name}`}>
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
