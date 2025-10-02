'use client';

import { useState, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { CSVIcon } from '@/components/Icons';
import { validateCSVFileData } from '@/services/datasets';

export interface CSVFile {
  filename: string;
  size: number;
  data: CSVData;
}

export interface CSVData {
  headers: string[];
  rows: string[][];
}

interface CSVUploaderProps {
  onFileUploaded: (data: CSVFile) => void;
}

export default function CSVUploader({ onFileUploaded }: CSVUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): CSVData => {
    if (!text.trim()) {
      throw new Error('CSV file is empty');
    }

    const result = Papa.parse<string[]>(text, {
      header: false,
      skipEmptyLines: true,
      transform: (value: string) => value.trim()
    });

    if (result.errors.length > 0) {
      throw new Error(`CSV parsing error: ${result.errors[0].message}`);
    }

    const data = result.data;
    if (data.length === 0) {
      throw new Error('CSV file contains no data');
    }

    const headers = data[0];
    const rows = data.slice(1);

    return { headers, rows };
  };

  const handleFile = useCallback(async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setIsLoading(true);

    try {
      const text = await selectedFile.text();
      const data = parseCSV(text);
      const error = validateCSVFileData(data);
      if (error) {
        setError(error);
        return;
      }

      setError(null);
      onFileUploaded({
        filename: selectedFile.name,
        size: selectedFile.size,
        data
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
    } finally {
      setIsLoading(false);
    }
  }, [onFileUploaded, setError]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <div>
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        {!isLoading && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
            />

            <div className="space-y-4">
              <CSVIcon className="h-12 w-12 text-gray-400 mx-auto" />

              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isDragActive ? 'Drop your CSV file here' : 'Upload CSV file'}
                </p>
                <p className="text-gray-500 mt-1">
                  Drag and drop or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-500 font-medium cursor-pointer"
                  >
                    browse files
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="m-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="ml-3 text-sm text-blue-700">Processing CSV file...</p>
            </div>
          </div>
        )}
      </div >

      {error && <ErrorState error={error} />}
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4z" stroke="currentColor" strokeWidth="1" fill="none" />
            <path d="M2 7h16M7 3v14M13 3v14" stroke="currentColor" strokeWidth="1" />
            <text x="4.5" y="5.5" fontSize="2" fill="currentColor">CSV</text>
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    </div>
  )
}

