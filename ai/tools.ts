import "server-only";
import { openai } from "@ai-sdk/openai";
import { tool } from "ai";
import { z } from "zod";
import { generateObject } from "ai";
import { RequestDatasetContext } from "../app/api/chat/route";


export const queryData = (datasetContext: RequestDatasetContext) => tool({
    description: [
      'Query the dataset data, execute a SQL query in pglite and return the result.',
      'Use this tool when you need to get data from the dataset to analyze.',
      'The query must have a limit of 100 rows maximum.'
    ].join('\n'),
    inputSchema: z.object({
      sql: z.string().describe('The SQL query to execute in pglite to query the dataset data.'),
    }),
    outputSchema: z.object({
      data: z.array(z.array(z.string())).describe('The result of the SQL query executed in pglite.'),
    }),
})


export const applyTransformation = (datasetContext: RequestDatasetContext) => tool({
    description: 'Create a transformation in the database.',
    inputSchema: z.object({
      sql: z.string().describe('The SQL query to create the transformation.'),
    }),
    outputSchema: z.object({
      success: z.boolean().describe('Whether the transformation was created successfully.'),
      newTableName: z.string().optional().describe([
        'The name of the new table that was created if the transformation was successful,',
        'this table is the new version of the dataset with the transformation applied.'
      ].join(' ')),
      error: z.string().optional().describe('The error message if the transformation was not created successfully.'),
    }),
})


export const generateTransformationSql = (datasetContext: RequestDatasetContext) => tool({
    description: 'Generate an SQL query to perform the requested transformation.',
    inputSchema: z.object({
      instructions: z.array(z.string()).describe('The instructions to generate the SQL query.'),
    }),
    outputSchema: z.object({
      sql: z.string(),
    }),
    execute: async ({ instructions }) => {
      const systemPrompt = `
        You are an assistant whose role is to generate an SQL query to perform the requested transformation.
        - You will be given a list of instructions and the schema of the dataset.
        - You must generate an SQL (ONLY SELECT) query to perform the requested transformation.
        - The SQL query must be valid and executable by pglite.
        - The SQL query must be concise and to the point.
        - The SQL query must be just a SELECT statement.
        - NEVER add a trailing semicolon to the SQL query

        Examples of valid SQL queries:
        SELECT * FROM table_name (this is valid)
        SELECT * FROM table_name WHERE column_name = "value" (this is valid)
        SELECT * FROM table_name WHERE column_name = "value" AND column_name2 = "value" (this is valid)
        SELECT * FROM table_name WHERE column_name = "value" GROUP BY column_name (this is valid)
        SELECT * FROM table_name; (this is not valid because it has a trailing semicolon)
        UPDATE table_name SET column_name = "value" WHERE column_name = "value" (this is not valid because it is not a SELECT statement)
        INSERT INTO table_name (column_name, column_name2) VALUES ("value", "value"); (this is not valid because it is not a SELECT statement and have trailing semicolon)
        DELETE FROM table_name WHERE column_name = "value"; (this is not valid because it is not a SELECT statement and have trailing semicolon)
        CREATE TABLE table_name (column_name TEXT, column_name2 TEXT) (this is not valid because it is not a SELECT statement)
        DROP TABLE table_name; (this is not valid because it is not a SELECT statement and have trailing semicolon)
        ALTER TABLE table_name ADD COLUMN column_name TEXT (this is not valid because it is not a SELECT)'

        Examples of instructions with the expected SQL query:
        - "Just keep the columns column1, column2, column3" -> SELECT column1, column2, column3 FROM table_name
        - "Delete the columns name, just give me name and description" -> SELECT name, description FROM table_name
        - "Fill the empty data with pokemon name and power" -> SELECT name, power FROM VALUES ('pikachu', 100), ('charmander', 90) ... etc
        - "Add a new column age with 24 as default value" -> SELECT name, power, type, 24 as age FROM table_name (the other columns are name, power and type)
      `

      const userPrompt = `
        Instructions: 
        ${instructions.map((instruction) => `- ${instruction}`).join('\n')}

        Table name: ${datasetContext.versionTableName}
        Columns: 
        ${datasetContext.columns.map((column) => `- ${column.name} (${column.dataType})`).join('\n')}

        The first 10 records of the dataset are:
        ${datasetContext.sample.map((row) => row.join(', ')).join('\n')}

        Please generate the sql query to perform the requested transformation.
      `

      const result = await generateObject({
        model: openai('gpt-4.1'),
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        schema: z.object({
          sql: z.string(),
        }),
      })

      return { sql: result.object.sql };
    },
})


export const generateLinesChart = (datasetContext: RequestDatasetContext) => tool({
    description: [
      'Generate a line chart to visualize the dataset data using Recharts React library.',
      'You will be given a SQL query that returns the data to visualize with the correct column names.',
      'The chart will be a lines chart, it has an X axis and a Y axis and diferent lines representing the data, the Y axis is automatically generated based on the data values.',
    ].join('\n'),
    inputSchema: z.object({
      title: z.string().describe('The title of the chart, create a title that is descriptive and concise with up to 13 words maximum'),
      sql: z.string().describe('The SQL query that returns the data to visualize with the correct column names.'),
      xAxisName: z.string().describe('The name of the X axis, it must be a column name from the SQL query.'),
      linesNames: z.array(z.string()).describe('The names of the lines to visualize, it must be a column name from the SQL query.'),
    }),
    outputSchema: z.object({
      success: z.boolean().describe('Whether the chart was generated successfully.'),
      chart: z.object({
        id: z.number().describe('The ID of the chart that was generated.'),
        tableName: z.string().describe('The name of the table that contains the data to visualize.'),
      }),
      error: z.string().optional().describe('The error message if the chart was not generated successfully.'),
    }),
})