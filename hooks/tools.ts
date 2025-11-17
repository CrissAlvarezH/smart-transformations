import { useApp } from "@/app/providers";
import { ToolCall } from "@ai-sdk/provider-utils";
import { getDatasetDataPaginated, queryDB } from "@/services/datasets";
import { createDatasetVersion } from "@/services/versions";
import { useQueryClient } from "@tanstack/react-query";
import { CHART_DATA, DATASET_DATA, DATASET_VERSIONS, DATASETS } from "./query-keys";
import { createChart } from "@/services/charts";


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
        queryClient.invalidateQueries({ queryKey: [DATASETS] });
        queryClient.invalidateQueries({ queryKey: [DATASET_DATA, datasetId] });
        queryClient.invalidateQueries({ queryKey: [DATASET_VERSIONS, datasetId] });
        return { success: true };

      case 'query_data':
        try {
          const result = await queryDB(db, toolCall.input.sql, 100);

          // the output must be array of arrays of strings, exampel [[1, 2, 3], [4, 5, 6]]
          return {
            data: result.map((row: any) => Object.values(row)),
            columns: Object.keys(result[0]),
          };

        } catch (error) {
          console.error('Error querying dataset data', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to query dataset data',
          };
        }

      case 'generate_lines_chart':
        // - validate the query executing it and putting the result in a new table 
        // - if the query is valid, insert the query into the dataset_charts table with 'saved' in false
        // - set the react-query cache for the query of the chart table to be used in the Chart component later
        try {
          const { id, tableName } = await createChart(
            db, datasetId, toolCall.input.title, toolCall.input.sql, 'lines', toolCall.input
          );

          const result = await queryDB(db, `SELECT * FROM ${tableName}`, -1);

          queryClient.setQueryData([CHART_DATA, tableName], result);

          return {
            success: true,
            chart: {
              id: id,
              tableName: tableName,
            },
          };
        } catch (error) {
          console.error('Error executing query to generate chart', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed executing query to generate chart',
          }
        }
    }
  };

  return { onToolCall };
}
