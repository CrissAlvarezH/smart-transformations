'use client';

import { useState } from 'react';
import CSVPreview from '@/components/csv-preview';
import CSVUploader, { CSVFile } from '@/components/csv-uploader';
import { DatasetList } from '@/components/dataset-list';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlusIcon, Upload, FileText, Sparkles, Loader2 } from 'lucide-react';
import { useCreateBlankDataset } from '@/hooks/datasets';
import { useRouter } from 'next/navigation';


export default function Home() {
  const [csvFile, setCsvFile] = useState<CSVFile | null>(null);

  const handleFileUploaded = (data: CSVFile) => {
    setCsvFile(data);
  };

  return (
    <div className="min-h-screen bg-black py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {!csvFile && (
          <div className="space-y-8 pb-96">
            {/* Main Action Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
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

      <div className="relative p-8">
        <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-200">
          <Sparkles className="w-8 h-8 text-blue-500" />
        </div>

        <h3 className="text-2xl font-bold text-white mb-3">
          Create Blank Dataset
        </h3>

        <p className="text-zinc-400 mb-6 leading-relaxed">
          Start with an empty dataset and build your data structure from scratch. Perfect for manual data entry or creating custom schemas.
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-900/20 border border-red-800 rounded-md">
            <p className="text-red-400">{error.message}</p>
          </div>
        )}

        <Button
          className="w-full h-12 text-base font-semibold bg-white text-black hover:bg-zinc-100 group-hover:scale-101 transition-all duration-200 cursor-pointer"
          size="lg"
          onClick={handleClick}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <PlusIcon className="w-5 h-5 mr-2" />}
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

      <div className="relative p-8">
        <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-200">
          <Upload className="w-8 h-8 text-green-600" />
        </div>

        <h3 className="text-2xl font-bold text-white mb-3">
          Upload CSV File
        </h3>

        <div className="space-y-4">
          <CSVUploader onFileUploaded={onFileUploaded} />

          <div className="flex items-center text-sm text-zinc-400">
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
    <div className="mb-8 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
      <div className="p-6 border-b border-zinc-800">
        <h3 className="text-xl font-semibold text-white">See It In Action</h3>
      </div>
      <div className="relative">
        <Image
          src="/trailer.gif"
          alt="Smart Data Transformations Demo"
          width={896}
          height={504}
          className="w-full h-auto"
        />
      </div>
    </div>
  );
}

