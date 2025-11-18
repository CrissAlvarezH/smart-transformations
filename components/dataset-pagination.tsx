import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

export function DatasetPagination({
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

      {/* In mobile make it shorter */}
      <span className="text-sm text-gray-500 block sm:hidden">{page} of {total}</span>
      <span className="text-sm text-gray-500 hidden sm:block">{page} of {total} pages</span>

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