import CSVTable from '@/components/csv-table';

interface CSVData {
  headers: string[];
  rows: string[][];
}

interface CSVPreviewProps {
  csvData: CSVData;
}

const maxRows = 10;

export default function CSVPreview({ csvData }: CSVPreviewProps) {
  const displayRows = csvData.rows.slice(0, maxRows);
  const hasMoreRows = csvData.rows.length > maxRows;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Preview
        </h2>
        <p className="text-sm text-gray-500">
          {csvData.rows.length} rows × {csvData.headers.length} columns
        </p>
      </div>

      <div className="overflow-auto border border-gray-300 shadow-sm">
        <CSVTable csvData={{ headers: csvData.headers, rows: displayRows }} />
      </div>

      {hasMoreRows && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Showing first {maxRows} rows of {csvData.rows.length} total rows
        </div>
      )}
    </div>
  );
}
