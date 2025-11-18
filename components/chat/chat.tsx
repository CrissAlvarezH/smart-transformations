"use client";

import { useChat, UIMessage } from '@ai-sdk/react';
import { generateId, lastAssistantMessageIsCompleteWithToolCalls, DefaultChatTransport } from 'ai';
import { EmptyState } from './empty-state';
import { ChatMessage } from './chat-message';
import { useSaveMessage } from '@/hooks/messages';
import { useOnToolCall } from '@/hooks/tools';
import { useDatasetContext } from '@/hooks/datasets';
import { ChatInput } from './chat-input';
import { Conversation } from './conversation';
import { useState } from 'react';
import { useWorkspace } from '@/app/[slug]/providers';


export function Chat({ initialMessages }: { initialMessages: UIMessage[] }) {
  const { mutateAsync: saveMessage } = useSaveMessage();
  const { dataset } = useWorkspace();
  const { getDatasetContext } = useDatasetContext();
  const { onToolCall } = useOnToolCall()
  const [ input, setInput ] = useState('');

  const { messages, sendMessage, status, addToolResult } = useChat({
    id: dataset.id.toString(),
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: async () => {
        try {
          const context = await getDatasetContext();

          let parsedSample = context.sample.map((row: any) => Object.values(row));
          const headers = context.columns.map((column: any) => column.name);
          parsedSample = [headers, ...parsedSample];

          return {
            datasetContext: {
              tableName: context?.tableName,
              versionTableName: context?.versionTableName,
              columns: context.columns,
              sample: parsedSample,
            }
          }
        } catch (error) {
          console.error('Error getting dataset sample', error);
          throw error;
        }
      }
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    messages: initialMessages,
    onError: async (error: Error) => {
      console.error('Error sending message', error);
    },
    onFinish: async ({ message }) => {
      await saveMessage(message);
    },
    onToolCall: async ({ toolCall }) => {
      const result = await onToolCall(toolCall);
      addToolResult({
        tool: toolCall.toolName,
        toolCallId: toolCall.toolCallId,
        output: result,
      });
    }
  })

  const handleSubmit = (input: string) => {
    sendMessage({ text: input.trim() });
    saveMessage({
      id: generateId(),
      role: 'user',
      parts: [{ type: 'text', text: input.trim() }],
    });
  };

  return (
    <div className="flex h-full flex-col bg-black text-white" style={{ overscrollBehavior: 'contain' }}>
      <div className="flex-1 flex flex-col min-h-0">
        {messages.length === 0 ? (
          <EmptyState onSelectPrompt={setInput} />
        ) : (
          <Conversation messages={messages}>
            {messages.map((msg: UIMessage, index: number) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isChatReady={status === "ready"}
              />
            ))}
          </Conversation>
        )}
      </div>

      <div className="flex-shrink-0 p-6 border-t border-zinc-800">
        <ChatInput
          onSubmit={handleSubmit}
          isReady={status === 'ready'}
          input={input}
          setInput={setInput}
        />
      </div>
    </div>
  );
}
