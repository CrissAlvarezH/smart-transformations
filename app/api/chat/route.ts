import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, UIMessage, tool, stepCountIs, generateObject } from "ai";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;


const createTools = (datasetContext: RequestDatasetContext) => ({
  generate_transformation_sql: tool({
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
        Examples:
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
  }),
  create_transformation: tool({
    description: 'Create a transformation in the database.',
    inputSchema: z.object({
      sql: z.string().describe('The SQL query to create the transformation.'),
    }),
    outputSchema: z.object({
      success: z.boolean().describe('Whether the transformation was created successfully.'),
      error: z.string().optional().describe('The error message if the transformation was not created successfully.'),
    }),
  }),
});

interface RequestDatasetContext {
  tableName: string;
  versionTableName: string;
  columns: { name: string, dataType: string }[];
  sample: string[][];
}
interface ChatRequest {
  messages: UIMessage[];
  datasetContext: RequestDatasetContext;
}

export async function POST(req: Request) {
  const { messages, datasetContext }: ChatRequest = await req.json();

  const systemPrompt = `
    You are an assistant whose role is to UNDERSTAND the user\'s intent regarding applying transformations to a table in pglite.
    - Before starting check the dataset structure describe here:
    ${datasetContext.versionTableName} (${datasetContext.columns.map((column) => `${column.name} ${column.dataType}`).join(', ')})
    - Also check this sample of the first 10 records of the dataset:
    ${datasetContext.sample.map((row) => row.join(', ')).join('\n')}
    - You can ask questions until you fully understand the transformation the user is describing.
    - Once you understand the user\'s intent, use the\`generate_transformation_sql\` tool and provide it with a clear and concise instruction.This tool will generate an SQL query to perform the requested transformation.
    - After calling \`generate_transformation_sql\`, you must call the \`create_transformation\` tool and pass it the generated SQL query in the previeous step.
    - DO NOT SHOW THE SQL QUERY TO THE USER.
  `;

  const result = streamText({
    model: openai('gpt-4.1'),
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    tools: createTools(datasetContext),
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse();
}