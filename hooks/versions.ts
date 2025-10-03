import { useApp } from "@/app/providers";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DATASET_VERSIONS, DATASETS } from "./query-keys";
import { listDatasetVersions, resetDatasetToVersion } from "@/services/versions";


export const useDatasetVersions = (datasetId: number) => {
  const { db } = useApp();

  const { data, isLoading, isFetching, isPending, error } = useQuery({
    queryKey: [DATASET_VERSIONS, datasetId],
    queryFn: async () => {
      return await listDatasetVersions(db, datasetId);
    }
  });

  return { data, isLoading, isFetching, isPending, error };
}


export const useResetDatasetToVersion = () => {
  const { db } = useApp();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: async ({ datasetId, targetVersion }: { datasetId: number, targetVersion: string }) => {
      await resetDatasetToVersion(db, datasetId, targetVersion);
    },
    onSuccess: (_, vars) => {
      const { datasetId } = vars;
      queryClient.invalidateQueries({ queryKey: [DATASET_VERSIONS, datasetId] });
      queryClient.invalidateQueries({ queryKey: [DATASETS] });
    }
  });

  return { mutate, mutateAsync, isPending, error };
}