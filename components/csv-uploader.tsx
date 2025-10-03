'use client';

import { useState, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { CSVIcon } from '@/components/Icons';
import { validateCSVFileData } from '@/services/datasets';
import { Button } from '@/components/ui/button';
import { Upload, FileText } from 'lucide-react';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
      setSelectedFile(files[0]);
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileInput}
        className="hidden"
      />
      
      {/* Desktop: Drag & Drop Interface */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`hidden sm:block relative border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer group ${
          isDragActive
            ? 'border-green-400 bg-green-400/10'
            : 'border-zinc-700 hover:border-green-400 hover:bg-green-400/5'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        {!isLoading && (
          <div className="space-y-3">
            <div className="flex items-center justify-center w-12 h-12 bg-zinc-800 rounded-xl mx-auto group-hover:bg-green-500/20 transition-colors">
              <CSVIcon className="h-6 w-6 text-green-400" />
            </div>
            
            <div>
              <p className="text-base font-medium text-white">
                {isDragActive ? 'Drop your CSV file here' : 'Choose CSV File'}
              </p>
              <p className="text-sm text-zinc-400 mt-1">
                Drag & drop or click to browse
              </p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center space-x-3 py-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-400"></div>
            <p className="text-sm text-green-400">Processing...</p>
          </div>
        )}
      </div>

      {/* Mobile: Button Interface */}
      <div className="block sm:hidden space-y-4">
        <div className="text-center space-y-4">
          {selectedFile && !isLoading && (
            <div className="bg-zinc-800 rounded-lg p-3 text-sm">
              <div className="flex items-center justify-center space-x-2 text-green-400">
                <FileText className="w-4 h-4" />
                <span className="truncate max-w-[200px]">{selectedFile.name}</span>
              </div>
              <p className="text-zinc-400 text-xs mt-1">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          )}

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
            size="lg"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>{selectedFile ? 'Select Different File' : 'Select CSV File'}</span>
              </div>
            )}
          </Button>
        </div>
      </div>

      {error && <ErrorState error={error} />}
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-md">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4z" stroke="currentColor" strokeWidth="1" fill="none" />
            <path d="M2 7h16M7 3v14M13 3v14" stroke="currentColor" strokeWidth="1" />
            <text x="4.5" y="5.5" fontSize="2" fill="currentColor">CSV</text>
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    </div>
  )
}

