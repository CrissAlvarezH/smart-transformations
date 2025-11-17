import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CHART_DATA, SAVED_CHARTS } from "./query-keys";
import { useApp } from "@/app/providers";
import { queryDB } from "@/services/datasets";
import { getSavedCharts, saveChart } from "@/services/charts";
import { useWorkspace } from "@/app/[slug]/providers";
import { ChartTable } from "@/lib/pglite";


export const useChartData = (tableName: string) => {
  const { db } = useApp();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: [CHART_DATA, tableName],
    queryFn: async () => await queryDB(db, `SELECT * FROM ${tableName}`),
  });
  return { data, isLoading, isError, error };
}


export const useGetSavedCharts = (datasetId: number) => {
  const { db } = useApp();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: [SAVED_CHARTS, datasetId],
    queryFn: async () => await getSavedCharts(db, datasetId),
  });
  return { data: data as ChartTable[], isLoading, isError, error };
}


export const useSaveChart = () => {
  const { db } = useApp();
  const { datasetId } = useWorkspace();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (chartId: number) => {
      return await saveChart(db, datasetId, chartId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SAVED_CHARTS, datasetId] });
    }
  });
  return { saveChart: mutateAsync, isPending, isError, error };
}
