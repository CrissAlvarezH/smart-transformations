'use client';

import { useState } from 'react';
import CSVPreview from '@/components/csv-preview';
import { DatasetList } from '@/components/dataset-list';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlusIcon, Upload, FileText, Sparkles, Loader2 } from 'lucide-react';
import { useCreateBlankDataset } from '@/hooks/datasets';
import { useRouter } from 'next/navigation';
import CSVUploader, { CSVFile } from '@/components/csv-uploader';


export default function Home() {
  const [csvFile, setCsvFile] = useState<CSVFile | null>(null);

  const handleFileUploaded = (data: CSVFile) => {
    setCsvFile(data);
  };

  return (
    <div className="min-h-screen bg-black py-4 px-4 sm:py-8 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {!csvFile && (
          <div className="space-y-6 sm:space-y-8 pb-24 sm:pb-96">
            {/* Main Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <CreateBlankDatasetCard />
              <UploadCSVCard onFileUploaded={handleFileUploaded} />
            </div>

            <GifTrailer />
            <DatasetList />
          </div>
        )}

        {csvFile && <CSVPreview csvFile={csvFile} onCancel={() => setCsvFile(null)} />}
      </div>
    </div>
  );
}

function CreateBlankDatasetCard() {
  const { mutateAsync: createBlankDataset, isPending, error } = useCreateBlankDataset();
  const router = useRouter();

  const handleClick = async () => {
    const slug = await createBlankDataset();
    if (!slug) {
      return;
    }
    router.push(`/${slug}`);
  };

  return (
    <div className="group relative bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all duration-200 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      <div className="relative p-6 sm:p-8">
        <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-200 mx-auto sm:mx-0">
          <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 text-center sm:text-left">
          Create Blank Dataset
        </h3>

        <p className="text-zinc-400 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base text-center sm:text-left">
          Start with an empty dataset and build your data structure from scratch. Perfect for manual data entry or creating custom schemas.
        </p>

        {error && (
          <div className="mb-4 sm:mb-6 p-3 bg-red-900/20 border border-red-800 rounded-md">
            <p className="text-red-400 text-sm">{error.message}</p>
          </div>
        )}

        <Button
          className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold bg-white text-black hover:bg-zinc-100 group-hover:scale-101 transition-all duration-200 cursor-pointer"
          size="lg"
          onClick={handleClick}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" /> : <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />}
          Create Blank Dataset
        </Button>
      </div>
    </div>
  );
}

function UploadCSVCard({ onFileUploaded }: { onFileUploaded: (data: CSVFile) => void }) {
  return (
    <div className="group relative bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all duration-200 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      <div className="relative p-6 sm:p-8">

        <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-200 mx-auto sm:mx-0">
          <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-3 text-center sm:text-left">
          Upload CSV File
        </h3>

        <div className="space-y-3 sm:space-y-4">
          <CSVUploader onFileUploaded={onFileUploaded} />

          <div className="flex items-center text-sm text-zinc-400 justify-center sm:justify-start">
            <FileText className="w-4 h-4 mr-1" />
            <span>Supports .csv files up to 1,000 rows</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function GifTrailer() {
  return (
    <div className="mb-6 sm:mb-8 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
      <div className="p-4 sm:p-6 border-b border-zinc-800">
        <h3 className="text-lg sm:text-xl font-semibold text-white text-center sm:text-left">See It In Action</h3>
      </div>
      <div className="relative">
        <Image
          src="/trailer.gif"
          alt="Smart Data Transformations Demo"
          width={896}
          height={504}
          className="w-full h-auto"
          priority={false}
        />
      </div>
    </div>
  );
}

