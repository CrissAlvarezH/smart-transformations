"use client";

import { Chat } from "@/components/chat/chat";
import { Dataset } from "@/components/dataset";
import { useMessages } from "@/hooks/messages";
import { DatasetTable } from "@/lib/pglite";
import { HomeIcon, Loader2 } from "lucide-react";
import Link from "next/link";


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
          <div className="h-full flex flex-col">
            <div className="p-2 flex">
              <Link href="/" className="flex py-1 px-2 items-center gap-2 text-gray-500 hover:text-gray-300">
                <HomeIcon className="w-4 h-4" /> Home
              </Link>
            </div>

            <div className="flex-1">
              <Chat datasetId={dataset.id} initialMessages={storedMessages || []} />
            </div>
          </div>
        )}
      </div>

      <Dataset dataset={dataset} />
    </div>
  )
}