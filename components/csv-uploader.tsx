'use client';

import { useState, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { CSVIcon } from '@/components/Icons';
import { generateTableNameFromCSVFile, validateCSVFileData, validateTableNameExists } from '@/services/datasets';
import { useValidateTableNameExists } from '@/hooks/datasets';

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
  onError: (error: string) => void;
}

export default function CSVUploader({ onFileUploaded, onError }: CSVUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { execute: validateTableNameExists } = useValidateTableNameExists();

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
      onError('Please select a CSV file');
      return;
    }

    setIsLoading(true);

    try {
      const tableName = generateTableNameFromCSVFile(selectedFile.name);
      const exists = await validateTableNameExists(tableName);
      if (exists) {
        onError('Table name already exists, change the file name and try again');
        return;
      }

      const text = await selectedFile.text();
      const data = parseCSV(text);
      const error = validateCSVFileData(data);
      if (error) {
        onError(error);
        return;
      }
      onFileUploaded({
        filename: selectedFile.name,
        size: selectedFile.size,
        data
      });

    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to parse CSV file');
    } finally {
      setIsLoading(false);
    }
  }, [onFileUploaded, onError]);

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
  );
}
