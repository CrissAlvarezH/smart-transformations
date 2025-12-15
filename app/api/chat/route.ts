import { UIMessage } from "ai";
import { entryPointAgent } from "@/ai/agents/entry-point-agent";

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

  const result = entryPointAgent(datasetContext, messages);

  return result.toUIMessageStreamResponse();
}