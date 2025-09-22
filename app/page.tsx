'use client';

import { useState } from 'react';
import CSVPreview from './components/CSVPreview';
import CSVUploader, { CSVFile } from './components/CSVUploader';
import { ArrowRightIcon } from 'lucide-react';


export default function Home() {
  const [csvFile, setCsvFile] = useState<CSVFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUploaded = (data: CSVFile) => {
    setCsvFile(data);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setCsvFile(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {!csvFile && (
          <CSVUploader
            onFileUploaded={handleFileUploaded}
            onError={handleError}
          />
        )}

        {error && (
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
        )}

        {csvFile && (
          <div className="my-4 p-4 border bg-white border-gray-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{csvFile.filename}</p>
                  <p className="text-sm text-gray-600">
                    {(csvFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCsvFile(null)}
                  className="text-gray-600 hover:bg-red-50 px-4 py-2 rounded-md cursor-pointer hover:text-red-500 transition-colors duration-200 font-medium text-sm"
                >
                  Discard
                </button>
                <button
                  className="flex items-center cursor-pointer border border-green-300 gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-md hover:text-green-700 text-sm font-medium "
                >
                  Use this file
                  <ArrowRightIcon className="h-5 w-5 text-green-500 " />
                </button>
              </div>
            </div>
          </div>
        )}

        {csvFile && <CSVPreview csvData={csvFile.data} />}
      </div>
    </div>
  );
}
