import { useMutation, useQuery } from "@tanstack/react-query";
import { usePGLiteDB } from "@/lib/pglite-context";
import { getDatasetPaginated } from "@/services/chat";
import { CSVFile } from "@/components/csv-uploader";
import { insertCSVFileIntoDatabase } from "@/services/csv-files";


export const useDataset = (tableName: string, page: number) => {
  const { db } = usePGLiteDB();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dataset", tableName],
    queryFn: async () => await getDatasetPaginated(db, tableName, page),
  });

  return { data, isLoading, isError };
};

export const useInsertDatasetFromCSVFile = () => {
  const { db } = usePGLiteDB();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: async (csvFile: CSVFile) => await insertCSVFileIntoDatabase(db, csvFile),
  });

  return { mutate, mutateAsync, isPending, error };
};