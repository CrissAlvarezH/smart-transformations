import { useQuery } from "@tanstack/react-query";
import { usePGLiteDB } from "@/lib/pglite-context";
import { getDatasetPaginated } from "@/services/chat";


export const useDataset = (tableName: string, page: number) => {
  const { db } = usePGLiteDB();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dataset", tableName],
    queryFn: async () => await getDatasetPaginated(db, tableName, page),
  });

  return { data, isLoading, isError };
};