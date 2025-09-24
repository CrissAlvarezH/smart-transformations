import { useMutation, useQuery } from "@tanstack/react-query";
import { usePGLiteDB } from "@/lib/pglite-context";
import { getDatasetPaginated } from "@/services/chat";
import { CSVFile } from "@/components/csv-uploader";
import { insertCSVFileIntoDatabase } from "@/services/csv-files";
import { useState } from "react";


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
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const execute = async (csvFile: CSVFile): Promise<string | null> => {
    try {
      setIsProcessing(true);
      const tableName = await insertCSVFileIntoDatabase(db, csvFile, setProgress);
      setIsProcessing(false);
      return tableName;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to insert dataset from CSV file');
      setIsProcessing(false);
      return null;
    }
  };

  return { progress, execute, error, isProcessing };
};
