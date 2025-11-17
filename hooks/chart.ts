import { useQuery } from "@tanstack/react-query";
import { CHART_DATA } from "./query-keys";
import { useApp } from "@/app/providers";
import { queryDB } from "@/services/datasets";


export const useChartData = (tableName: string) => {
    const { db } = useApp();
    const { data, isLoading, isError, error } = useQuery({
        queryKey: [CHART_DATA, tableName],
        queryFn: async () => await queryDB(db, `SELECT * FROM ${tableName}`),
    });
    return { data, isLoading, isError, error };
}
