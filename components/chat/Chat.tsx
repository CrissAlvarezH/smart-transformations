"use client";

import { useChat, UIMessage } from '@ai-sdk/react';
import { generateId, lastAssistantMessageIsCompleteWithToolCalls, DefaultChatTransport } from 'ai';
import { useState, useRef, useEffect } from 'react';
import { ArrowUpIcon, Loader2 } from 'lucide-react';
import { EmptyState } from './empty-state';
import { ChatMessage } from './chat-message';
import { useSaveMessage } from '@/hooks/messages';
import { useOnToolCall } from '@/hooks/tools';
import { useDataset, useDatasetContext } from '@/hooks/datasets';


export function Chat({ tableName, initialMessages }: { tableName: string, initialMessages: UIMessage[] }) {
  const { mutateAsync: saveMessage } = useSaveMessage(tableName);
  const { getDatasetContext } = useDatasetContext(tableName);
  const { onToolCall } = useOnToolCall(tableName);

  const { messages, sendMessage, status, addToolResult } = useChat({
    id: tableName,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: async () => {
        try {
          const context = await getDatasetContext();

          console.log('chat body context', context);

          const columns = context?.columns.map((field: any) => ({ name: field.name, dataType: field.dataType }));

          let parsedSample = context?.sample.map((row: any) => Object.values(row));
          const headers = columns.map((column: any) => column.name);
          parsedSample = [headers, ...parsedSample];

          return {
            datasetContext: {
              tableName: context?.tableName,
              versionTableName: context?.versionTableName,
              columns: columns,
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
    <div className="flex flex-col h-full bg-black text-white" style={{ overscrollBehavior: 'contain' }}>
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0">
        {messages.length === 0 ? (
          <EmptyState onSelectPrompt={setInput} />
        ) : (
          <div
            ref={scrollContainerRef}
            className="flex-1 min-h-0 overflow-y-scroll px-4 py-6 custom-scrollbar-dark"
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
      <div className="flex-shrink-0 p-6 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="relative flex items-end bg-gray-900 rounded-xl border border-gray-700 focus-within:border-gray-600">
            {/* Text input */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleMessageChange}
              placeholder="Describe what you want to do with the data"
              rows={3}
              className="flex-1 bg-transparent px-3 py-3 text-white placeholder-gray-500 focus:outline-none min-h-[56px] max-h-48 resize-none overflow-y-auto custom-scrollbar-dark"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />

            {/* Send button */}
            {status !== 'ready' ? (
              <div className="p-2 m-2 bg-gray-600 text-gray-300 rounded-full">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2 m-2 bg-white text-black rounded-full hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400 transition-colors"
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
