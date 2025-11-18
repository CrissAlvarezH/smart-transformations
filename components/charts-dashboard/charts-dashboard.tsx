"use client";

import { useDeleteChart, useGetSavedCharts } from "@/hooks/chart";
import { ChartTable } from "@/lib/pglite";
import { LinesChart } from "./line-chart";
import { Button } from "../ui/button";
import { Loader2, Maximize2, Trash, X, BarChart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { useChartTableDataPaginated } from "@/hooks/chart";
import CSVTable from "../csv-table";
import { useState } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DatasetPagination } from "../dataset-pagination";
import { motion } from "framer-motion";


export function ChartsDashboard({ datasetId }: { datasetId: number }) {
  const { data: savedCharts, isLoading: isLoadingSavedCharts, isError: isErrorSavedCharts } = useGetSavedCharts();

  if (isErrorSavedCharts) {
    return <div>Error loading saved charts: {isErrorSavedCharts}</div>;
  }

  if (isLoadingSavedCharts) {
    return null; // loading is too fast to be visible
  }

  if (savedCharts?.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex justify-center pt-24">
        <EmptyState />
      </motion.div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
      {savedCharts?.map((chart: ChartTable) => (
        <motion.div 
          initial={{ opacity: 0}} animate={{ opacity: 1 }} transition={{ duration: 0.2, ease: "easeInOut" }}
          key={chart.id} 
          className="shadow-sm rounded-md border border-zinc-200 bg-white">

          <div className="flex items-center justify-between gap-2 pr-1 pl-3 pt-1">
            <span className="text-gray-500 text-sm pr-2 font-medium">#{chart.id}</span>
            <p className="flex-1 text-center text-medium font-semibold text-gray-700 self-center">
              {chart.title}
            </p>

            <ChartDialogTrigger chart={chart} />
          </div>

          {chart.chart_type === 'lines' && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
              className="px-4 pb-2 overflow-hidden"
            >
              <LinesChart
                chartTableName={chart.table_name}
                xAxisName={chart.chart_arguments.xAxisName}
                linesNames={chart.chart_arguments.linesNames}
              />
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  )
}


function ChartDialogTrigger({ chart }: { chart: ChartTable }) {
  const [page, setPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const { data, isLoading, isError } = useChartTableDataPaginated(chart.id, page, 50);
  const { deleteChart, isPending, isError: isErrorDeleteChart, error: errorDeleteChart } = useDeleteChart();

  if (isLoading) {
    return <Loader2 className="w-4 h-4 animate-spin" />
  }

  if (isError) {
    return <div>Error loading chart table data: {isError}</div>;
  }

  const convertToCSVData = (data: any) => {
    return {
      headers: data.fields.map((field: any) => field.name),
      rows: data.rows.map((row: { [key: string]: any }) => Object.values(row)),
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full cursor-pointer">
          <Maximize2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl max-h-[80vh] overflow-auto" showCloseButton={false}>
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>
              {chart.title}
            </DialogTitle>
          </DialogHeader>
        </VisuallyHidden>

        <div className="">

          <div className="flex items-center justify-between gap-2 pb-2">
            <div className="flex items-center gap-2">
              <p className="text-lg font-medium">{chart.title}</p>

              {showDeleteConfirmation ? (
                <div className="flex items-center gap-2">
                  <Button variant="destructive" size="sm" onClick={() => deleteChart(chart.id)} disabled={isPending}>
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Delete
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirmation(false)} disabled={isPending}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="icon" className="rounded-full cursor-pointer" onClick={() => setShowDeleteConfirmation(true)}>
                  <Trash className="w-4 h-4" />
                </Button>
              )}
            </div>

            <button className="cursor-pointer rounded-full p-1 hover:bg-zinc-100" onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5 text-zinc-600" />
            </button>
          </div>

          <div className="w-full">
            {chart.chart_type === 'lines' && (
              <LinesChart
                chartTableName={chart.table_name}
                xAxisName={chart.chart_arguments.xAxisName}
                linesNames={chart.chart_arguments.linesNames}
              />
            )}
          </div>

          <div className="flex justify-between items-center pb-2 pt-4">
            <p className="text-medium font-medium">Data used to generate the chart</p>
            <DatasetPagination total={data.total || 0} page={page} onPageChange={setPage} />
          </div>
          <CSVTable csvData={convertToCSVData(data.data)} />
        </div>
      </DialogContent>
    </Dialog >
  )
}


function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <BarChart className="w-12 h-12 text-gray-400 mb-2" />
      <p className="text-xl font-bold">No saved charts found</p>
      <p className="text-gray-400 px-10">Yout need to first create a chart in the AI Chat and save it</p>
    </div>
  )
}