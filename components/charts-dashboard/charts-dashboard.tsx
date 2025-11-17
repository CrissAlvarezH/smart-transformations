"use client";

import { useGetSavedCharts } from "@/hooks/chart";
import { ChartTable } from "@/lib/pglite";
import { LinesChart } from "./line-chart";
import { Button } from "../ui/button";
import { MoreVertical } from "lucide-react";

export function ChartsDashboard({ datasetId }: { datasetId: number }) {
  const { data: savedCharts, isLoading: isLoadingSavedCharts, isError: isErrorSavedCharts } = useGetSavedCharts(datasetId);

  if (isErrorSavedCharts) {
    return <div>Error loading saved charts: {isErrorSavedCharts}</div>;
  }

  if (isLoadingSavedCharts) {
    return <div>Loading saved charts...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
      {savedCharts?.map((chart: ChartTable) => (
        <div key={chart.id} className="shadow-sm rounded-md border border-zinc-200 px-4 py-2 bg-white">
          <div className="flex items-center justify-between pb-1 gap-2">
            <span className="text-gray-500 text-sm pr-2 font-medium">#{chart.id}</span>
            <p className="flex-1 text-center text-medium font-semibold text-gray-700 self-center">
              {chart.title}
            </p>
            <Button variant="ghost" size="icon" className="rounded-full cursor-pointer">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
          {chart.chart_type === 'lines' && (
            <div className="">
              <LinesChart
                chartTableName={chart.table_name}
                xAxisName={chart.chart_arguments.xAxisName}
                linesNames={chart.chart_arguments.linesNames}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}