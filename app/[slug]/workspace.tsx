"use client";

import { Chat } from "@/components/chat/chat";
import { Dataset } from "@/components/dataset";
import { useMessages } from "@/hooks/messages";
import { DatasetTable } from "@/lib/pglite";
import { Loader2 } from "lucide-react";


export function Workspace({ dataset }: { dataset: DatasetTable }) {
  const { data: storedMessages, isLoading: isLoadingMessages, isError: isErrorMessages } = useMessages(dataset.id);

  if (isErrorMessages) {
    return <div>Error loading messages: {isErrorMessages}</div>;
  }

  return (
    <div className="flex h-screen">
      <div className="w-[500px] flex-shrink-0 h-full bg-black">
        {isLoadingMessages ? (
          <div className="flex flex-col items-center gap-2 bg-black h-full justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            <span className="text-gray-500">Loading...</span>
          </div>
        ) : (
          <Chat datasetId={dataset.id} initialMessages={storedMessages || []} />
        )}
      </div>

      <Dataset dataset={dataset} />
    </div>
  )
}