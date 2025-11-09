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
  const contentRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const lastMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const isNearBottom = () => {
      if (!scrollContainer) return true;
      const threshold = 100; // pixels from bottom
      const distanceFromBottom = 
        scrollContainer.scrollHeight - 
        scrollContainer.scrollTop - 
        scrollContainer.clientHeight;
      return distanceFromBottom < threshold;
    };

    const handleScroll = () => {
      // Update shouldAutoScroll based on whether user is near bottom
      shouldAutoScrollRef.current = isNearBottom();
    };

    const scrollToBottom = (force = false) => {
      if (scrollContainer) {
        if (force || shouldAutoScrollRef.current) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
          // If forced, also update shouldAutoScrollRef to true
          if (force) {
            shouldAutoScrollRef.current = true;
          }
        }
      }
    };

    // Add scroll event listener
    scrollContainer.addEventListener('scroll', handleScroll);

    // Create a MutationObserver to watch for changes in the content
    const observer = new MutationObserver(() => {
      // Small delay to ensure DOM is updated
      setTimeout(scrollToBottom, 50);
    });

    // Start observing the content container
    if (contentRef.current) {
      observer.observe(contentRef.current, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }

    // Initial scroll
    setTimeout(() => scrollToBottom(false), 50);

    // Cleanup observer and event listener on unmount
    return () => {
      observer.disconnect();
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Detect when user sends a new message and force scroll to bottom
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const lastMessageId = lastMessage?.id;

    // Check if this is a new message and if it's from the user
    if (lastMessageId && lastMessageId !== lastMessageIdRef.current) {
      lastMessageIdRef.current = lastMessageId;
      
      // If the last message is from the user, force scroll to bottom
      if (lastMessage.role === 'user') {
        setTimeout(() => {
          const scrollContainer = scrollContainerRef.current;
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
            shouldAutoScrollRef.current = true;
          }
        }, 50);
      }
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
      <div ref={contentRef} className="max-w-4xl mx-auto space-y-4">
        {children}
        <div ref={messagesEndRef} className="h-4" />
      </div>
    </div>
  )
}