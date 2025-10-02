'use client';

import { useState } from 'react';
import CSVPreview from '@/components/csv-preview';
import CSVUploader, { CSVFile } from '@/components/csv-uploader';
import { DatasetList } from '@/components/dataset-list';
import Image from 'next/image';


export default function Home() {
  const [csvFile, setCsvFile] = useState<CSVFile | null>(null);

  const handleFileUploaded = (data: CSVFile) => {
    setCsvFile(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {!csvFile && (
          <>
            <CSVUploader onFileUploaded={handleFileUploaded} />
            <GifTrailer />
            <DatasetList />
          </>
        )}

        {csvFile && <CSVPreview csvFile={csvFile} onCancel={() => setCsvFile(null)} />}
      </div>
    </div>
  );
}


function GifTrailer() {
  return (
    <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
      <Image src="/trailer.gif" alt="Trailer" width={896} height={504} />
    </div>
  )
}

