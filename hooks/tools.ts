import { usePGLiteDB } from "@/lib/pglite-context";
import { ToolCall } from "@ai-sdk/provider-utils";
import { createDatasetVersion, describeDatasetColumns, getDatasetDataPaginated } from "@/services/datasets";
import { useQueryClient } from "@tanstack/react-query";


export const useOnToolCall = (tableName: string) => {
  const { db } = usePGLiteDB();
  const queryClient = useQueryClient();

  const onToolCall = async (toolCall: ToolCall<string, any>) => {
    if (toolCall.dynamic) return;

    switch (toolCall.toolName) {
      case 'describe_dataset':
        const columns = await describeDatasetColumns(db, tableName);
        return {
          tableName,
          columns,
        };

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
        await createDatasetVersion(db, toolCall.input.sql, tableName);
        queryClient.invalidateQueries({ queryKey: ["dataset", tableName] });
        break;
    }
  };

  return { onToolCall };
}
