import { useApp } from "@/app/providers";
import { ToolCall } from "@ai-sdk/provider-utils";
import { createDatasetVersion, getDatasetDataPaginated } from "@/services/datasets";
import { useQueryClient } from "@tanstack/react-query";


export const useOnToolCall = (tableName: string) => {
  const { db } = useApp();
  const queryClient = useQueryClient();

  const onToolCall = async (toolCall: ToolCall<string, any>) => {
    if (toolCall.dynamic) return;

    switch (toolCall.toolName) {
      case 'get_dataset_sample':
        const data = await getDatasetDataPaginated(db, tableName, 1, 'latest', 10);
        // add the headers to the data
        const headers = data.data.fields.map((field: any) => field.name);

        // the output must be array of arrays of strings, exampel [[1, 2, 3], [4, 5, 6]]
        return {
          headers,
          data: data.data.map((row: any) => Object.values(row)),
        };

      case 'create_transformation':
        try {
          await createDatasetVersion(db, toolCall.input.sql, tableName);
        } catch (error) {
          console.error('Error creating transformation', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create transformation',
          };
        }
        queryClient.invalidateQueries({ queryKey: ["dataset", tableName] });
        queryClient.invalidateQueries({ queryKey: ["dataset-versions", tableName] });
        return { success: true };
    }
  };

  return { onToolCall };
}
