import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePGLiteDB } from "@/lib/pglite-context";
import { getDatasetDataPaginated, listDatasets } from "@/services/chat";
import { CSVFile } from "@/components/csv-uploader";
import { deleteDataset, insertCSVFileIntoDatabase, validateTableNameExists } from "@/services/csv-files";
import { useState } from "react";


export const useDataset = (tableName: string, page: number) => {
  const { db } = usePGLiteDB();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dataset", tableName],
    queryFn: async () => await getDatasetDataPaginated(db, tableName, page),
  });

  return { data, isLoading, isError };
};


export const useDatasets = () => {
  const { db } = usePGLiteDB();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["datasets"],
    queryFn: async () => await listDatasets(db),
  });

  return { data, isLoading, isError };
}


export const useInsertDatasetFromCSVFile = () => {
  const queryClient = useQueryClient();
  const { db } = usePGLiteDB();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const execute = async (csvFile: CSVFile): Promise<string | null> => {
    try {
      setIsProcessing(true);
      const tableName = await insertCSVFileIntoDatabase(db, csvFile, setProgress);
      setIsProcessing(false);
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      return tableName;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to insert dataset from CSV file');
      setIsProcessing(false);
      return null;
    }
  };

  return { progress, execute, error, isProcessing };
};


export const useValidateTableNameExists = () => {
  const { db } = usePGLiteDB();
  const execute = async (tableName: string): Promise<boolean> => {
    return await validateTableNameExists(db, tableName);
  };
  return { execute };
};

export const useDeleteDataset = () => {
  const { db } = usePGLiteDB();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: async (tableName: string) => await deleteDataset(db, tableName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
    }
  });
  return { mutate, mutateAsync, isPending, error };
};