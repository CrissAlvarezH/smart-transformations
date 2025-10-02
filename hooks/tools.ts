import { useApp } from "@/app/providers";
import { ToolCall } from "@ai-sdk/provider-utils";
import { getDatasetDataPaginated } from "@/services/datasets";
import { createDatasetVersion } from "@/services/versions";
import { useQueryClient } from "@tanstack/react-query";
import { DATASET_DATA, DATASET_VERSIONS } from "./query-keys";


export const useOnToolCall = (datasetId: number) => {
  const { db } = useApp();
  const queryClient = useQueryClient();

  const onToolCall = async (toolCall: ToolCall<string, any>) => {
    if (toolCall.dynamic) return;

    switch (toolCall.toolName) {
      case 'get_dataset_sample':
        const data = await getDatasetDataPaginated(db, datasetId, 1, 'latest', 10);
        // add the headers to the data
        const headers = data.data.fields.map((field: any) => field.name);

        // the output must be array of arrays of strings, exampel [[1, 2, 3], [4, 5, 6]]
        return {
          headers,
          data: data.data.map((row: any) => Object.values(row)),
        };

      case 'create_transformation':
        try {
          await createDatasetVersion(db, datasetId, toolCall.input.sql);
        } catch (error) {
          console.error('Error creating transformation', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create transformation',
          };
        }
        queryClient.invalidateQueries({ queryKey: [DATASET_DATA, datasetId] });
        queryClient.invalidateQueries({ queryKey: [DATASET_VERSIONS, datasetId] });
        return { success: true };
    }
  };

  return { onToolCall };
}
