"use client";
import { useRef, useEffect } from "react";
import { UIMessage } from "@ai-sdk/react";

/**
 * Conversation component that handles automatic scrolling to the bottom of the conversation.
 * @param children - The children of the conversation (usually the messages components).
 * @param messages - The messages of the conversation to know when a new message is added to scroll down
 * @returns The conversation component.
 */
export function Conversation({ 
  children, 
  messages 
}: { 
  children: React.ReactNode;
  messages?: UIMessage[];
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const lastMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      // Update shouldAutoScroll based on whether user is near bottom
      const threshold = 100; // pixels from bottom
      const distanceFromBottom = 
        scrollContainer.scrollHeight - 
        scrollContainer.scrollTop - 
        scrollContainer.clientHeight;
      shouldAutoScrollRef.current = distanceFromBottom < threshold;
    };

    // Add scroll event listener to track user scroll position
    scrollContainer.addEventListener('scroll', handleScroll);

    // Cleanup event listener on unmount
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Handle all scroll management based on messages
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const lastMessageId = lastMessage?.id;

    // Check if this is a new message or message update
    if (lastMessageId && lastMessageId !== lastMessageIdRef.current) {
      lastMessageIdRef.current = lastMessageId;
      
      // For new user messages, always force scroll to bottom
      if (lastMessage.role === 'user') {
        setTimeout(() => {
          const scrollContainer = scrollContainerRef.current;
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
            shouldAutoScrollRef.current = true;
          }
        }, 50);
      }
      // For assistant messages, only scroll if user is near bottom
      else if (lastMessage.role === 'assistant') {
        setTimeout(() => {
          const scrollContainer = scrollContainerRef.current;
          if (scrollContainer && shouldAutoScrollRef.current) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        }, 50);
      }
    }
    // Handle message content updates (like streaming)
    else if (lastMessage && lastMessage.role === 'assistant') {
      setTimeout(() => {
        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer && shouldAutoScrollRef.current) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }, 50);
    }
  }, [messages]);

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 min-h-0 overflow-y-scroll px-4 pb-6 custom-scrollbar-dark"
      style={{
        scrollBehavior: 'smooth',
        overscrollBehavior: 'contain'
      }}>
      <div className="max-w-4xl mx-auto space-y-4">
        {children}
        <div ref={messagesEndRef} className="h-4" />
      </div>
    </div>
  )
}