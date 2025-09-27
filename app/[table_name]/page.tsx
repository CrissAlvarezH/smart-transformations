"use client";

import { useParams } from "next/navigation";
import { Dataset } from "@/components/dataset";
import { useMessages } from "@/hooks/messages";
import { Chat } from "@/components/chat/chat";

export const dynamic = "force-dynamic";

export default function DatasetPage() {
  const params = useParams();
  const { table_name: tableName } = params as { table_name: string };
  const { data: storedMessages, isLoading: isLoadingMessages, isError: isErrorMessages } = useMessages(tableName);

  if (isLoadingMessages) {
    return <div>Loading messages...</div>;
  }
  if (isErrorMessages) {
    return <div>Error loading messages: {isErrorMessages}</div>;
  }

  return (
    <div className="flex h-screen">
      <div className="w-[500px] flex-shrink-0 h-full">
        <Chat tableName={tableName} initialMessages={storedMessages || []} />
      </div>

      <Dataset tableName={tableName} />
    </div>
  )
}
