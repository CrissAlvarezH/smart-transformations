import { UIMessage } from "@ai-sdk/react";
import { Markdown } from "../markdown";


interface ChatMessageProps {
  message: UIMessage;
}

export function ChatMessage({message}: ChatMessageProps) {
  return (
    <div
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`rounded-2xl px-4 py-3 ${message.role === 'user'
          ? 'bg-gray-800 text-white ml-12 max-w-[90%]'
          : ''
          }`}
      >
        {message.parts.map((part, index) => (
          part.type === 'text' ? (
            message.role === 'user' ? (
              <p key={index} className="whitespace-pre-wrap break-words">{part.text}</p>
            ) : (
              <Markdown key={index}>{part.text}</Markdown>
            )
          ) : null
        ))}
      </div>
    </div>
  )
}