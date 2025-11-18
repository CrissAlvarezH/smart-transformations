import { useDatasetDataPaginated, useRenameDataset } from "@/hooks/datasets";
import { useDatasetVersions, useResetDatasetToVersion } from "@/hooks/versions";
import { useEffect, useState } from "react";
import CSVTable from "@/components/csv-table";
import { CSVIcon } from "@/components/Icons";
import { Edit, FileText, Loader2, RotateCcw, Table, BarChart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "./ui/skeleton";
import { useWorkspace } from "@/app/[slug]/providers";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { DatasetTable } from "@/lib/pglite";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { ChartsDashboard } from "./charts-dashboard/charts-dashboard";
import { DatasetPagination } from "./dataset-pagination";
import { ActiveTab } from "@/app/[slug]/providers";


export function Dataset() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isPending, error } = useDatasetDataPaginated(page);
  const { activeTab, setActiveTab, dataset } = useWorkspace();

  if (error) return <div className="text-red-700">Error: {error.message}</div>;

  const convertToCSVData = (data: any) => {
    return {
      headers: data.fields.map((field: any) => field.name),
      rows: data.rows.map((row: { [key: string]: any }) => Object.values(row)),
    };
  };

  const isBlank = data?.data?.rows.length === 0 && dataset.columns.length === 0;
  return (
    <div className="flex-1 h-full flex flex-col overflow-auto bg-white">
      {data && (
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as ActiveTab)}
          className="flex-1 flex flex-col overflow-hidden gap-0"
        >
          <TableToolbar
            dataset={dataset}
            total={data.total}
            page={page}
            onPageChange={setPage}
            isLoading={isPending || isFetching || isLoading}
          />

          <TabsContent value="spreadsheet" className="flex-1 overflow-auto">
            {isBlank ? (
              <div className="pt-24 text-center flex flex-col gap-2 items-center justify-center">
                <FileText className="w-12 h-12 text-gray-300 mb-2" />
                <p className="text-xl font-bold text-gray-800">This dataset is empty</p>
                <p className="text-gray-400 px-10">You can tell the AI to fill it up for you with the data you want</p>
              </div>
            ) : (
              <CSVTable csvData={convertToCSVData(data.data)} />
            )}
          </TabsContent>

          <TabsContent value="charts" className="flex-1 overflow-auto bg-zinc-100">
            <ChartsDashboard datasetId={dataset.id} />
          </TabsContent>
        </Tabs>
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
          <h1 className="text-gray-700 truncate max-w-20 sm:max-w-none">{dataset.name}</h1>
          <RenameDatasetButton dataset={dataset} />
        </div>

        <div className="flex items-center gap-2">
          <VersionSelector />
        </div>

      </div>

      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="spreadsheet">
            <Table className="h-4 w-4" />
            <span>Data</span>
          </TabsTrigger>
          <TabsTrigger value="charts">
            <BarChart className="h-4 w-4" />
            <span>Charts</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="px-2 flex items-center gap-3">
        {isLoading && <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />}
        <DatasetPagination total={total} page={page} onPageChange={onPageChange} />
      </div>
    </div >
  )
}

function VersionSelector() {
  const {
    data: versions,
    isLoading: isVersionsLoading,
    error: versionsError,
  } = useDatasetVersions();
  const { selectedDatasetVersion, selectDatasetVersion } = useWorkspace();
  const {
    mutateAsync: resetDatasetToVersion, isPending: isResettingPending, error: resetError
  } = useResetDatasetToVersion();

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

  const handleResetDatasetToVersion = async (targetVersion: string) => {
    await resetDatasetToVersion({ targetVersion });
  }

  const isTheLatestVersion = selectedDatasetVersion === versions.rows[0].version.toString();
  return (
    <div className="flex items-center gap-2">
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
              {/* In desktop make it longer */}
              <span className="hidden sm:block">
                Version {version.version}
              </span>
              <span className="block sm:hidden">
                V{version.version}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!isTheLatestVersion && (
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="cursor-pointer"
            onClick={() => handleResetDatasetToVersion(selectedDatasetVersion)}
            disabled={isResettingPending}
          >
            {isResettingPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Reset to this version
          </Button>
          {resetError && <span className="text-red-700 text-xs">{resetError.message}</span>}
        </div>
      )}
    </div>
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

