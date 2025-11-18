"use client";

import { Chat } from "@/components/chat/chat";
import { Dataset } from "@/components/dataset";
import { useMessages } from "@/hooks/messages";
import { UIMessage } from "@ai-sdk/react";
import { HomeIcon, Loader2, MessageSquare, Database } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";


export function Workspace() {
  const { data: storedMessages, isLoading: isLoadingMessages, isError: isErrorMessages } = useMessages();

  if (isErrorMessages) {
    return <div>Error loading messages: {isErrorMessages}</div>;
  }

  return (
    <>
      <div className="hidden sm:block">
        <WorkspaceDesktop isLoadingMessages={isLoadingMessages} storedMessages={storedMessages || []} />
      </div>
      <div className="block sm:hidden border-t border-gray-800 h-screen">
        <WorkspaceMobile isLoadingMessages={isLoadingMessages} storedMessages={storedMessages || []} />
      </div>
    </>
  )
}


function WorkspaceDesktop({
  isLoadingMessages, storedMessages
}: {
  isLoadingMessages: boolean,
  storedMessages: UIMessage[]
}) {
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

            <div className="flex-1 min-h-0">
              <Chat initialMessages={storedMessages || []} />
            </div>
          </div>
        )}
      </div>

      <Dataset />
    </div>
  )
}


function WorkspaceMobile({
  isLoadingMessages, storedMessages
}: {
  isLoadingMessages: boolean,
  storedMessages: UIMessage[]
}) {
  if (isLoadingMessages) {
    return (
      <div className="flex flex-col items-center gap-2 bg-black h-screen justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Tabs */}
      <Tabs defaultValue="chat" className="flex-1 flex flex-col h-full">
        {/* Header with Home link and Tab buttons - Fixed at top */}
        <div className="sticky top-0 z-40 flex-shrink-0 border-b border-gray-800 bg-black">
          <div className="p-2 flex justify-between items-center">
            <Link href="/" className="flex py-1 px-2 items-center gap-2 text-gray-500 hover:text-gray-300">
              <HomeIcon className="w-4 h-4" /> Home
            </Link>

            <TabsList className="bg-gray-900 h-auto p-1">
              <TabsTrigger value="chat" className="flex items-center gap-2 data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-400 px-3 py-1.5">
                <MessageSquare className="w-4 h-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="dataset" className="flex items-center gap-2 data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-400 px-3 py-1.5">
                <Database className="w-4 h-4" />
                Dataset
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="chat" className="flex-1 min-h-0">
          <Chat initialMessages={storedMessages || []} />
        </TabsContent>

        <TabsContent value="dataset" className="flex-1 min-h-0">
          <Dataset />
        </TabsContent>
      </Tabs>
    </div>
  );
}
