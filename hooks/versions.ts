import { useApp } from "@/app/providers";
import { useQuery } from "@tanstack/react-query";
import { DATASET_VERSIONS } from "./query-keys";
import { listDatasetVersions } from "@/services/versions";


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
