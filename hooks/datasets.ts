import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/app/providers";
import { mapPgDataTypeIdToName } from "@/services/naming";
import {
  getDatasetBySlug,
  getDatasetDataPaginated,
  listDatasets,
  renameDataset
} from "@/services/datasets";
import { CSVFile } from "@/components/csv-uploader";
import { createBlankDataset, deleteDataset, insertCSVFileIntoDatabase } from "@/services/datasets";
import { useState } from "react";
import { DatasetTable } from "@/lib/pglite";
import { DATASET_BY_SLUG, DATASET_DATA, DATASET_VERSIONS, DATASETS, MESSAGES } from "./query-keys";


export const useDatasetBySlug = (slug: string) => {
  const { db } = useApp();
  const { data, isLoading, isFetching, isPending, error } = useQuery({
    queryKey: [DATASET_BY_SLUG, slug],
    queryFn: async () => await getDatasetBySlug(db, slug),
  });
  return { dataset: data as DatasetTable, isLoading, isFetching, isPending, error };
};


export const useDatasetDataPaginated = (datasetId: number, page: number, version: string = 'latest') => {
  const { db } = useApp();

  const { data, isLoading, isFetching, isPending, error } = useQuery({
    queryKey: [DATASET_DATA, datasetId, page, version],
    queryFn: async () => await getDatasetDataPaginated(db, datasetId, page, version),
    placeholderData: keepPreviousData,
  });

  return { data, isLoading, isFetching, isPending, error };
};


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
    queryKey: [DATASETS],
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
      const slug = await insertCSVFileIntoDatabase(db, csvFile, setProgress);
      setIsProcessing(false);
      queryClient.invalidateQueries({ queryKey: [DATASETS] });
      return slug;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to insert dataset from CSV file');
      setIsProcessing(false);
      return null;
    }
  };

  return { progress, execute, error, isProcessing };
};


export const useCreateBlankDataset = () => {
  const { db } = useApp();
  const queryClient = useQueryClient();
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: async () => await createBlankDataset(db),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DATASETS] });
    }
  });
  return { mutate, mutateAsync, isPending, error };
};


export const useDeleteDataset = () => {
  const { db } = useApp();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: async (datasetId: number) => await deleteDataset(db, datasetId),
    onSuccess: (_, datasetId) => {
      // Remove cached data completely instead of just invalidating
      queryClient.removeQueries({ queryKey: [MESSAGES, datasetId] });
      queryClient.removeQueries({ queryKey: [DATASET_DATA, datasetId] });
      queryClient.removeQueries({ queryKey: [DATASET_VERSIONS, datasetId] });
      queryClient.invalidateQueries({ queryKey: [DATASETS] });
    }
  });
  return { mutate, mutateAsync, isPending, error };
};


export const useRenameDataset = () => {
  const { db } = useApp();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: async ({ datasetId, newName }: { datasetId: number, newName: string }) => await renameDataset(db, datasetId, newName),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [DATASETS] });
    }
  });

  return { mutate, mutateAsync, isPending, error };
};
