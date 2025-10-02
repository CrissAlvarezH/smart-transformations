import CSVTable from '@/components/csv-table';
import { CSVFile } from '@/components/csv-uploader';
import { useInsertDatasetFromCSVFile } from '@/hooks/datasets';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ArrowRightIcon } from 'lucide-react';

interface CSVPreviewProps {
  csvFile: CSVFile;
  onCancel: () => void;
}

const maxRows = 10;

export default function CSVPreview({ csvFile, onCancel }: CSVPreviewProps) {
  let displayRows = csvFile.data.rows.slice(0, maxRows);
  const hasMoreRows = csvFile.data.rows.length > maxRows;

  // add __index__ to the first column and add row number values
  const headers = ['___index___', ...csvFile.data.headers];
  displayRows = displayRows.map((row, index) => [(index + 1).toString(), ...row]);

  return (
    <div>
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

          <UseCSVFileButton csvFile={csvFile} onCancel={onCancel} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Preview
          </h2>
          <p className="text-sm text-gray-500">
            {csvFile.data.rows.length} rows × {csvFile.data.headers.length} columns
          </p>
        </div>

        <div className="overflow-auto border border-gray-300 shadow-sm">
          <CSVTable csvData={{ headers, rows: displayRows }} />
        </div>

        {hasMoreRows && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing first {maxRows} rows of {csvFile.data.rows.length} total rows
          </div>
        )}
      </div>
    </div>
  );
}


function UseCSVFileButton({ csvFile, onCancel }: { csvFile: CSVFile, onCancel: () => void }) {
  const { isProcessing, progress, execute: insertCSVFileIntoDatabase, error } = useInsertDatasetFromCSVFile();
  const router = useRouter();

  const handleClick = async () => {
    const slug = await insertCSVFileIntoDatabase(csvFile);
    if (!slug) {
      return;
    }
    router.push(`/${slug}`);
  }

  if (isProcessing) {
    return <div className="flex items-center gap-2">
      <p className="text-sm text-green-700">{progress}%</p>
      <Loader2 className="h-5 w-5 text-green-700 animate-spin" />
      <p className="text-sm text-green-700">Processing file...</p>
    </div>;
  }

  if (error) return <ErrorState error={error} />

  if (progress === 100) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-sm text-green-700">File processed successfully</p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onCancel}
        className="text-gray-600 hover:bg-red-50 px-4 py-2 rounded-md cursor-pointer hover:text-red-500 transition-colors duration-200 font-medium text-sm"
      >
        Discard
      </button>

      <button
        className="flex items-center cursor-pointer border border-green-300 gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-md hover:text-green-700 text-sm font-medium "
        onClick={handleClick}
      >
        Use this file
        <ArrowRightIcon className="h-5 w-5 text-green-500 " />
      </button>
    </div>
  )
}


function ErrorState({ error }: { error: string }) {
  return (
    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
      <p className="text-sm text-red-700">{error}</p>
    </div>
  )
}
