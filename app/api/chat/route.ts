import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, UIMessage, tool, stepCountIs, generateObject } from "ai";
import { z } from "zod";
import { generateTransformationSql, applyTransformation } from "./tools";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;



export interface RequestDatasetContext {
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
    - If the table is empty (just with __index__ column and without rows) the intent of the user surely is to fill it up with data, remember that the query will be a SELECT statement.
    - The __index__ column is used to maintain an incremental index; the user refers to this column as "index" or "position".
    - You can ask questions until you fully understand the transformation the user is describing.
    - The SQL will always have only one SELECT statement, so have that in mind when you pass the instructions to the \`generate_transformation_sql\` tool.
    - Once you understand the user\'s intent, use the\`generate_transformation_sql\` tool and provide it with a clear and concise instruction.This tool will generate an SQL query to perform the requested transformation.
    - After calling \`generate_transformation_sql\`, you must call the \`create_transformation\` tool and pass it the generated SQL query in the previeous step.
    - Sometimes the generated SQL query cand fail, when that happens try to identify the error and generate a new SQL query, if you don't have any idea how to fix the error, try to ask the user for clarification.
    - DO NOT SHOW THE SQL QUERY TO THE USER.
  `;

  const result = streamText({
    model: openai('gpt-4.1'),
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    tools: {
      generate_transformation_sql: generateTransformationSql(datasetContext),
      create_transformation: applyTransformation(datasetContext),
    },
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse();
}