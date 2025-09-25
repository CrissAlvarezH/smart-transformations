import { useDataset } from "@/hooks/datasets";
import { useState } from "react";
import CSVTable from "@/components/csv-table";
import { CSVIcon } from "@/components/Icons";
import { ArrowLeftIcon, ArrowRightIcon, Loader2 } from "lucide-react";


export function Dataset({ tableName }: { tableName: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isPending, error } = useDataset(tableName, page);

  if (error) return <div>Error: {error.message}</div>;

  const convertToCSVData = (data: any) => {
    return {
      headers: data.fields.map((field: any) => field.name),
      rows: data.rows.map((row: { [key: string]: any }) => Object.values(row)),
    };
  };


  return (
    <div className="flex-1 h-full flex flex-col overflow-auto bg-gray-100">
      {data && (
        <>
          <TableToolbar 
            tableName={tableName} 
            total={data.total} 
            page={page} 
            onPageChange={setPage} 
            isLoading={isPending || isFetching || isLoading} 
          />

          <div className="flex-1 overflow-auto bg-gray-100">
            <CSVTable csvData={convertToCSVData(data.data)} />
          </div>
        </>
      )}
    </div>
  )
}

function TableToolbar({ 
  tableName, 
  total, 
  page, 
  onPageChange, 
  isLoading 
}: { 
  tableName: string, 
  total: number, 
  page: number, 
  onPageChange: (page: number) => void, 
  isLoading: boolean 
}) {
  return (
    <div className="bg-white p-1.5 text-gray-900 flex items-center shadow-sm z-20 justify-between">
      <div className="flex items-center gap-2">
        <CSVIcon className="h-5 w-5 text-gray-700 mx-2" />
        <h1 className="text-gray-700">{tableName}</h1>
      </div>

      <div className="px-2 flex items-center gap-3">
        {isLoading && <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />}
        <Pagination total={total} page={page} onPageChange={onPageChange} />
      </div>
    </div >
  )
}

function Pagination({ 
  total, 
  page, 
  onPageChange, 
}: { 
  total: number, 
  page: number, 
  onPageChange: (page: number) => void, 
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-gray-500">{page} of {total} pages</span>
      <button
        className="text-sm text-gray-500 disabled:opacity-60 flex items-center enabled:hover:bg-gray-100 rounded-md p-1 gap-2 enabled:cursor-pointer"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >
        <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
      </button>
      <button
        className="text-sm text-gray-500 disabled:opacity-60 flex items-center enabled:hover:bg-gray-100 rounded-md p-1 gap-2 enabled:cursor-pointer"
        onClick={() => onPageChange(page + 1)}
        disabled={page === total}
      >
        <ArrowRightIcon className="h-5 w-5 text-gray-500" />
      </button>
    </div>
  )
}