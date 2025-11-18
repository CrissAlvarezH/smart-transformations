import { useApp } from "@/app/providers";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DATASET_VERSIONS, DATASETS } from "./query-keys";
import { listDatasetVersions, resetDatasetToVersion } from "@/services/versions";
import { useWorkspace } from "@/app/[slug]/providers";


export const useDatasetVersions = () => {
  const { dataset } = useWorkspace();
  const { db } = useApp();

  const { data, isLoading, isFetching, isPending, error } = useQuery({
    queryKey: [DATASET_VERSIONS, dataset.id],
    queryFn: async () => {
      return await listDatasetVersions(db, dataset.id);
    }
  });

  return { data, isLoading, isFetching, isPending, error };
}


export const useResetDatasetToVersion = () => {
  const { db } = useApp();
  const { dataset } = useWorkspace();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: async ({ targetVersion }: { targetVersion: string }) => {
      await resetDatasetToVersion(db, dataset.id, targetVersion);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DATASET_VERSIONS, dataset.id] });
      queryClient.invalidateQueries({ queryKey: [DATASETS] });
    }
  });

  return { mutate, mutateAsync, isPending, error };
}