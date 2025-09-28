import { useDatasetDataPaginated, useDatasetVersions, useRenameDataset } from "@/hooks/datasets";
import { useEffect, useState } from "react";
import CSVTable from "@/components/csv-table";
import { CSVIcon } from "@/components/Icons";
import { ArrowLeftIcon, ArrowRightIcon, Edit, Loader2, Save, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "./ui/skeleton";
import { useApp } from "@/app/providers";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { DatasetTable } from "@/lib/pglite";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

export interface DatasetProps {
  dataset: DatasetTable;
}

export function Dataset({ dataset }: DatasetProps) {
  const [page, setPage] = useState(1);
  const { selectedDatasetVersion } = useApp();
  const { data, isLoading, isFetching, isPending, error } = useDatasetDataPaginated(dataset.id, page, selectedDatasetVersion);

  useEffect(() => {
    console.log('selectedDatasetVersion', selectedDatasetVersion);
  }, [selectedDatasetVersion]);

  if (error) return <div>Error: {error.message}</div>;

  const convertToCSVData = (data: any) => {
    return {
      headers: data.fields.map((field: any) => field.name),
      rows: data.rows.map((row: { [key: string]: any }) => Object.values(row)),
    };
  };

  return (
    <div className="flex-1 h-full flex flex-col overflow-auto bg-white">
      {data && (
        <>
          <TableToolbar
            dataset={dataset}
            total={data.total}
            page={page}
            onPageChange={setPage}
            isLoading={isPending || isFetching || isLoading}
          />

          <div className="flex-1 overflow-auto">
            <CSVTable csvData={convertToCSVData(data.data)} />
          </div>
        </>
      )}
    </div>
  )
}

function TableToolbar({
  dataset,
  total,
  page,
  onPageChange,
  isLoading
}: {
  dataset: DatasetTable,
  total: number,
  page: number,
  onPageChange: (page: number) => void,
  isLoading: boolean
}) {

  return (
    <div className="bg-white p-1.5 text-gray-900 flex items-center shadow-sm z-20 justify-between">
      <div className="flex items-center gap-4">

        <div className="flex items-center gap-2">
          <CSVIcon className="h-5 w-5 text-gray-700 mx-2" />
          <h1 className="text-gray-700">{dataset.name}</h1>
          <RenameDatasetButton dataset={dataset} />
        </div>

        <div className="flex items-center gap-2">
          <VersionSelector datasetId={dataset.id} />
        </div>

      </div>

      <div className="px-2 flex items-center gap-3">
        {isLoading && <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />}
        <Pagination total={total} page={page} onPageChange={onPageChange} />
      </div>
    </div >
  )
}

function VersionSelector({ datasetId }: { datasetId: number }) {
  const {
    data: versions,
    isLoading: isVersionsLoading,
    error: versionsError,
  } = useDatasetVersions(datasetId);
  const { selectedDatasetVersion, selectDatasetVersion } = useApp();

  useEffect(() => {
    if (!versions) return;
    const latest = versions.rows[0].version.toString();
    selectDatasetVersion(latest);
  }, [versions]);

  if (isVersionsLoading) {
    return <Skeleton className="h-9 w-28" />;
  }

  if (versionsError) {
    return <div>Error: {versionsError.message}</div>;
  }
  if (!versions) {
    return <div>No versions found</div>;
  }

  return (
    <Select
      defaultValue={selectedDatasetVersion}
      value={selectedDatasetVersion}
      onValueChange={(value) => selectDatasetVersion(value.toString())}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {versions.rows.map((version) => (
          <SelectItem
            key={version.version}
            value={version.version.toString()}
          >
            Version {version.version}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function RenameDatasetButton({ dataset }: { dataset: DatasetTable }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState(dataset.name);
  const { mutateAsync: renameDataset, isPending, error } = useRenameDataset();

  const handleRename = async () => {
    const { newSlug } = await renameDataset({ datasetId: dataset.id, newName: newName });
    router.replace(`/${newSlug}`);
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogTitle>Rename Dataset</DialogTitle>
          <DialogDescription>
            <Input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} />
            {error && <span className="text-red-700">{error.message}</span>}
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex items-center gap-2" disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleRename} className="flex items-center gap-2" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <button onClick={() => setIsOpen(true)}>
        <Edit className="w-4 h-4 text-gray-400/80 cursor-pointer hover:text-gray-800" />
      </button>
    </>
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