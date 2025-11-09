"use client";
import { Loader2, ArrowUpIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function ChatInput({
  onSubmit, isReady, input, setInput
}: {
  onSubmit: (input: string) => void;
  input: string;
  setInput: (input: string) => void;
  isReady: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    autoResize();
  }, [input]);

  const handleSubmit = (e: React.FormEvent<HTMLTextAreaElement | HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input.trim());
      setInput('');
    }
  };
   
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  return (
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
              if (!isReady) return;
              handleSubmit(e);
            }
          }}
        />

        {/* Send button */}
        {!isReady ? (
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
  )
}