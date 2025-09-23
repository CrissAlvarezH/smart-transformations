"use client";

import { useState, useRef, useEffect } from 'react';
import { ArrowUpIcon } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export function Chat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        text: message.trim(),
        sender: 'user',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
      setMessage('');
      
      // Reset textarea height after clearing message
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Simulate assistant response (you can replace this with actual API call)
      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "I understand you want to apply transformations to your data. Could you provide more specific details about what you'd like to do?",
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }, 1000);
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
    setMessage(e.target.value);
  };

  // Auto-resize on component mount and when message changes
  useEffect(() => {
    autoResize();
  }, [message]);

  // Scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current && scrollContainerRef.current) {
        // Use scrollTop for immediate scroll, then smooth scroll to end
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    };
    
    // Small delay to ensure DOM is updated
    setTimeout(scrollToBottom, 50);
  }, [messages]);

  const examplePrompts = [
    "Create a new column",
    "Filter the data",
    "Sort by a specific column"
  ];

  return (
    <div className="flex flex-col h-full bg-black text-white" style={{ overscrollBehavior: 'contain' }}>
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0">
        {messages.length === 0 ? (
          // Welcome screen when no messages
          <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
            <div className="max-w-2xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <h1 className="text-3xl font-semibold text-white">
                  What transformations would you like to apply to the data?
                </h1>
                <p className="text-lg text-gray-400">
                  Describe what you want to apply to the data.
                </p>
              </div>

              {/* Example buttons */}
              <div className="flex flex-wrap gap-3 justify-center">
                {examplePrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setMessage(prompt);
                    }}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-full transition-colors duration-200 border border-gray-700 hover:border-gray-600"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Messages area when messages exist
          <div 
            ref={scrollContainerRef}
            className="flex-1 min-h-0 overflow-y-scroll px-4 py-6"
            style={{ 
              scrollBehavior: 'smooth',
              overscrollBehavior: 'contain'
            }}>
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      msg.sender === 'user'
                        ? 'bg-gray-800 text-white ml-12 max-w-[80%]'
                        : ''
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  </div>
                </div>
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
              value={message}
              onChange={handleMessageChange}
              placeholder="Describe what you want to do with the data"
              rows={3}
              className="flex-1 bg-transparent px-3 py-3 text-white placeholder-gray-500 focus:outline-none min-h-[56px] max-h-48 resize-none overflow-y-auto"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />

            {/* Send button */}
            <button
              type="submit"
              disabled={!message.trim()}
              className="p-2 m-2 bg-white text-black rounded-full hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400 transition-colors"
            >
              <ArrowUpIcon className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}