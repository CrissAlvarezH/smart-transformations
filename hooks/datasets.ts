import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/app/providers";

import { 
  getDatasetBySlug, 
  getDatasetDataPaginated, 
  listDatasets, 
  listDatasetVersions, 
  mapPgDataTypeIdToName, 
  renameDataset 
} from "@/services/datasets";
import { CSVFile } from "@/components/csv-uploader";
import { deleteDataset, insertCSVFileIntoDatabase, validateTableNameExists } from "@/services/datasets";
import { useState } from "react";
import { DatasetTable } from "@/lib/pglite";
import { RenameDatasetResult } from "@/services/datasets";


export const useDatasetBySlug = (slug: string) => {
  const { db } = useApp();
  const { data, isLoading, isFetching, isPending, error } = useQuery({
    queryKey: ["dataset-by-slug", slug],
    queryFn: async () => await getDatasetBySlug(db, slug),
  });
  return { dataset: data as DatasetTable, isLoading, isFetching, isPending, error };
};


export const useDatasetDataPaginated = (datasetId: number, page: number, version: string = 'latest') => {
  const { db } = useApp();

  const { data, isLoading, isFetching, isPending, error } = useQuery({
    queryKey: ["dataset-data", datasetId, page, version],
    queryFn: async () => await getDatasetDataPaginated(db, datasetId, page, version),
    placeholderData: keepPreviousData,
  });

  return { data, isLoading, isFetching, isPending, error };
};


export const useDatasetVersions = (datasetId: number) => {
  const { db } = useApp();

  const { data, isLoading, isFetching, isPending, error } = useQuery({
    queryKey: ["dataset-versions", datasetId],
    queryFn: async () => {
      return await listDatasetVersions(db, datasetId);
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

export const useDatasetContext = (datasetId: number) => {
  const { db } = useApp();

  const getDatasetContext = async (): Promise<DatasetContext> => {
    // get the dataset context for prompts, get dataset last version table name, columns and sample records
    const data = await getDatasetDataPaginated(db, datasetId, 1, 'latest', 10);

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
    mutationFn: async (datasetId: number) => await deleteDataset(db, datasetId),
    onSuccess: (_, datasetId) => {
      // Remove cached data completely instead of just invalidating
      queryClient.removeQueries({ queryKey: ["messages", datasetId] });
      queryClient.removeQueries({ queryKey: ["dataset-data", datasetId] });
      queryClient.removeQueries({ queryKey: ["dataset-versions", datasetId] });
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      selectDatasetVersion('latest');
    }
  });
  return { mutate, mutateAsync, isPending, error };
};


export const useRenameDataset = () => {
  const { db } = useApp();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: async ({datasetId, newName}: {datasetId: number, newName: string}) => await renameDataset(db, datasetId, newName),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
    }
  });

  return { mutate, mutateAsync, isPending, error };
};