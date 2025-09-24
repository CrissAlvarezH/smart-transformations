"use client";

import { useParams } from "next/navigation";
import { Chat } from "@/components/chat/chat";
import { CSVIcon } from "@/components/Icons";
import { Dataset } from "@/components/dataset";
import { useMessages } from "@/hooks/messages";


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

      <div className="flex-1 h-full flex flex-col overflow-auto bg-gray-100">
        <TableToolbar tableName={tableName} />
        <div className="flex-1 overflow-auto bg-gray-100">
          <Dataset tableName={tableName} />
        </div>
      </div>
    </div>
  )
}

function TableToolbar({ tableName }: { tableName: string }) {
  return (
    <div className="bg-white p-1.5 text-gray-900 flex items-center shadow-sm z-20">
      <CSVIcon className="h-5 w-5 text-gray-700 mx-2" />
      <h1 className="text-gray-700">{tableName}</h1>
    </div>
  )
}