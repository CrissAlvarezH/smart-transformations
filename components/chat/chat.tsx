"use client";

import { useChat, UIMessage } from '@ai-sdk/react';
import { generateId, lastAssistantMessageIsCompleteWithToolCalls, DefaultChatTransport } from 'ai';
import { useState, useRef, useEffect } from 'react';
import { ArrowUpIcon, Loader2 } from 'lucide-react';
import { EmptyState } from './empty-state';
import { ChatMessage } from './chat-message';
import { useSaveMessage } from '@/hooks/messages';
import { useOnToolCall } from '@/hooks/tools';
import { useDatasetContext } from '@/hooks/datasets';


export function Chat({ datasetId, initialMessages }: { datasetId: number, initialMessages: UIMessage[] }) {
  const { mutateAsync: saveMessage } = useSaveMessage(datasetId);
  const { getDatasetContext } = useDatasetContext(datasetId);
  const { onToolCall } = useOnToolCall(datasetId);

  const { messages, sendMessage, status, addToolResult } = useChat({
    id: datasetId.toString(),
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

  const [input, setInput] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input.trim() });
      saveMessage({
        id: generateId(),
        role: 'user',
        parts: [{ type: 'text', text: input.trim() }],
      });
      setInput('');
    }
  };

  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  useEffect(() => {
    autoResize();
  }, [input]);

  useEffect(() => {
    // Scroll to bottom when messages change
    const scrollToBottom = () => {
      if (messagesEndRef.current && scrollContainerRef.current) {
        // Use scrollTop for immediate scroll, then smooth scroll to end
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    };

    // Small delay to ensure DOM is updated
    setTimeout(scrollToBottom, 50);
  }, [messages]);

  return (
    <div className="flex h-full flex-col bg-black text-white" style={{ overscrollBehavior: 'contain' }}>
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0">
        {messages.length === 0 ? (
          <EmptyState onSelectPrompt={setInput} />
        ) : (
          <div
            ref={scrollContainerRef}
            className="flex-1 min-h-0 overflow-y-scroll px-4 pb-6 custom-scrollbar-dark"
            style={{
              scrollBehavior: 'smooth',
              overscrollBehavior: 'contain'
            }}>
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.map((msg: UIMessage) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 p-6 border-t border-zinc-800">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="relative flex items-end bg-zinc-900 rounded-xl border border-zinc-800 focus-within:border-zinc-700">
            {/* Text input */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleMessageChange}
              placeholder="Describe what you want to do with the data"
              rows={3}
              className="flex-1 bg-transparent px-3 py-3 text-white placeholder-zinc-500 focus:outline-none min-h-[56px] max-h-48 resize-none overflow-y-auto custom-scrollbar-dark"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />

            {/* Send button */}
            {status !== 'ready' ? (
              <div className="p-2 m-2 bg-zinc-600 text-zinc-300 rounded-full">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2 m-2 bg-white text-black rounded-full hover:bg-zinc-100 disabled:bg-zinc-600 disabled:text-zinc-400 transition-colors"
              >
                <ArrowUpIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
