import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/app/providers";

import { getDatasetDataPaginated, listDatasets, listDatasetVersions, mapPgDataTypeIdToName } from "@/services/datasets";
import { CSVFile } from "@/components/csv-uploader";
import { deleteDataset, insertCSVFileIntoDatabase, validateTableNameExists } from "@/services/datasets";
import { useState } from "react";


export const useDataset = (tableName: string, page: number, version: string = 'latest') => {
  const { db } = useApp();

  const { data, isLoading, isFetching, isPending, error } = useQuery({
    queryKey: ["dataset", tableName, page, version],
    queryFn: async () => await getDatasetDataPaginated(db, tableName, page, version),
    placeholderData: keepPreviousData,
  });

  return { data, isLoading, isFetching, isPending, error };
};


export const useDatasetVersions = (tableName: string) => {
  const { db } = useApp();

  const { data, isLoading, isFetching, isPending, error } = useQuery({
    queryKey: ["dataset-versions", tableName],
    queryFn: async () => {
      return await listDatasetVersions(db, tableName);
    }
  });

  return { data, isLoading, isFetching, isPending, error };
}


export interface DatasetContext {
  tableName: string;
  versionTableName: string;
  columns: { name: string, dataType: string }[];
  sample: string[][];
}

export const useDatasetContext = (tableName: string) => {
  const { db } = useApp();

  const getDatasetContext = async (): Promise<DatasetContext> => {
    // get the dataset context for prompts, get dataset last version table name, columns and sample records
    const data = await getDatasetDataPaginated(db, tableName, 1, 'latest', 10);

    data.data.fields = data.data.fields.map((field: any) => ({
      name: field.name,
      dataType: mapPgDataTypeIdToName(field.dataTypeID)
    }));

    return {
      tableName: data.data.table_name,
      versionTableName: data.version.tableName,
      columns: data.data.fields,
      sample: data.data.rows,
    };
  }
  return { getDatasetContext };
};


export const useDatasets = () => {
  const { db } = useApp();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["datasets"],
    queryFn: async () => {
      return await listDatasets(db);
    }
  });

  return { data, isLoading, isError };
}


export const useInsertDatasetFromCSVFile = () => {
  const queryClient = useQueryClient();
  const { db } = useApp();
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
  const { db } = useApp();
  const execute = async (tableName: string): Promise<boolean> => {
    return await validateTableNameExists(db, tableName);
  };
  return { execute };
};

export const useDeleteDataset = () => {
  const { db, selectDatasetVersion } = useApp();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: async (tableName: string) => await deleteDataset(db, tableName),
    onSuccess: (_, tableName) => {
      // Remove cached data completely instead of just invalidating
      queryClient.removeQueries({ queryKey: ["messages", tableName] });
      queryClient.removeQueries({ queryKey: ["dataset", tableName] });
      queryClient.removeQueries({ queryKey: ["dataset-versions", tableName] });
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      selectDatasetVersion('latest');
    }
  });
  return { mutate, mutateAsync, isPending, error };
};