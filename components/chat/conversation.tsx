"use client";
import { useRef, useEffect, useLayoutEffect } from "react";
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
  const lastContentHeightRef = useRef(0);
  const hasInitiallyPositionedRef = useRef(false);

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

  // Add ResizeObserver for initial loading period (first 5 seconds)
  useEffect(() => {
    const contentElement = contentRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (!contentElement || !scrollContainer) return;

    // Observer for initial loading period - always scroll to bottom on resize
    const initialLoadObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      });
    });

    // Observer for after initial loading - respects user scroll position
    const normalObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newHeight = entry.contentRect.height;
        const previousHeight = lastContentHeightRef.current;
        
        // Only scroll if content has grown and user was near bottom
        if (newHeight > previousHeight && shouldAutoScrollRef.current) {
          requestAnimationFrame(() => {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          });
        }
        
        lastContentHeightRef.current = newHeight;
      }
    });

    // Start with initial load observer
    initialLoadObserver.observe(contentElement);
    
    // Switch to normal observer after 5 seconds
    const switchTimeout = setTimeout(() => {
      initialLoadObserver.disconnect();
      lastContentHeightRef.current = contentElement.scrollHeight; // Set baseline
      normalObserver.observe(contentElement);
    }, 5000);

    // Cleanup observers on unmount
    return () => {
      clearTimeout(switchTimeout);
      initialLoadObserver.disconnect();
      normalObserver.disconnect();
    };
  }, []);

  // Set initial scroll position to bottom immediately when content is ready (before paint)
  useLayoutEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer && messages && messages.length > 0 && !hasInitiallyPositionedRef.current) {
      // Temporarily disable smooth scrolling for instant positioning
      const originalScrollBehavior = scrollContainer.style.scrollBehavior;
      scrollContainer.style.scrollBehavior = 'auto';
      
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
      hasInitiallyPositionedRef.current = true;
      
      // Restore smooth scrolling
      scrollContainer.style.scrollBehavior = originalScrollBehavior;
    }
  }, [messages]); // Run when messages change until initial positioning is done

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
      <div ref={contentRef} className="max-w-4xl mx-auto space-y-4">
        {children}
        <div ref={messagesEndRef} className="h-4" />
      </div>
    </div>
  )
}