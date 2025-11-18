"use client";

import { useChartData } from "@/hooks/chart";
import { Loader2 } from "lucide-react";
import { memo } from "react";
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line } from 'recharts';

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff6384', '#36a2eb'];


export const LinesChart = memo(function LinesChart({
  chartTableName, xAxisName, linesNames
}: {
  chartTableName: string,
  xAxisName: string,
  linesNames: string[]
}) {
  const { data, isLoading: isLoadingChart, isError, error } = useChartData(chartTableName);

  if (isLoadingChart) {
    return (
      <div className="w-full h-52 flex items-center justify-center gap-2 border border-zinc-700 rounded-md animate-pulse">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-zinc-400 text-xs">Loading chart...</span>
      </div>
    )
  } else if (isError) {
    return <div>Error: {error?.message ?? 'Unknown error'}</div>;
  }

  return (
    <div className="w-full">
      <LineChart
        style={{ width: '100%', height: '100%', aspectRatio: 1.618 }}
        responsive
        data={data}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisName} />
        <YAxis width="auto" />
        <Tooltip />
        <Legend />

        {linesNames.map((lineName: string, index: number) => (
          <Line key={lineName} type="monotone" dataKey={lineName} stroke={CHART_COLORS[index % CHART_COLORS.length]} activeDot={{ r: 8 }} />
        ))}
      </LineChart>
    </div>
  )
});