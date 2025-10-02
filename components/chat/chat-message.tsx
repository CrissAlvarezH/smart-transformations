"use client";

import { UIMessage } from "@ai-sdk/react";
import { Markdown } from "../markdown";

import { ChevronDown, Bolt, Wrench, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";


interface ChatMessageProps {
  message: UIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`rounded-2xl px-4 py-3 ${message.role === 'user'
          ? 'bg-zinc-800 text-white ml-12 max-w-[90%]'
          : 'w-full'
          }`}
      >
        {message.parts.map((part, index) => {
          switch (part.type) {
            case 'text':
              return message.role === 'user' ? (
                <p key={index} className="whitespace-pre-wrap break-words">{part.text}</p>
              ) : (
                <div key={index} className="py-2">
                  <Markdown>{part.text}</Markdown>
                </div>
              );
            case 'tool-describe_dataset': {
              return <GenericToolPart key={index} part={part} />;
            }
            case 'tool-get_dataset_sample': {
              return <GenericToolPart key={index} part={part} />;
            }
            case 'tool-generate_transformation_sql': {
              return <GenericToolPart key={index} part={part} />;
            }
            case 'tool-create_transformation': {
              return <GenericToolPart key={index} part={part} />;
            }
            default:
              return null;
          }
        })}
      </div>
    </div>
  )
}

function GenericToolPart({ part }: { part: any }) {
  const { state, input, output } = part;
  const typeSplit = part.type.split('-');
  const toolName = typeSplit.length > 1 ? typeSplit[1] : part.type;

  const [isOpen, setIsOpen] = useState(false);

  const labelTranslator: Record<string, string> = {
    'input-streaming': 'Getting input',
    'input-available': 'Input Available',
    'output-available': 'Getting output',
    'output-error': 'Error',
  }
  const label = labelTranslator[state];
  const toolNameTranslator: Record<string, string> = {
    'describe_dataset': 'Describing dataset',
    'get_dataset_sample': 'Getting dataset sample',
    'generate_transformation_sql': 'Generating tranformation',
    'create_transformation': 'Applying transformation',
  }
  const toolNameTranslated = toolNameTranslator[toolName];

  return (
    <div className="py-2 w-full">
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="flex items-center gap-2">
          <Bolt className="w-4 h-4" />
          <div className="flex gap-2 items-center">
            <span className="font-semibold text-xs text-zinc-100">{toolNameTranslated}</span>

            {state !== 'output-available' && <Loader2 className="w-3 h-3 animate-spin" />}
            {state !== 'output-available' && <span className="text-zinc-400 text-xs">{label}</span>}
          </div>
        </div>


        <button onClick={() => setIsOpen(!isOpen)} className="hover:bg-zinc-700 rounded-full p-1 cursor-pointer">
          <ChevronDown className={`w-4 h-4 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className={`w-full rounded bg-zinc-800 transition-[max-height] ease-in-out duration-500 ${isOpen ? 'max-h-60 overflow-y-auto' : 'max-h-0 overflow-hidden'}`}>
        <p className="text-xs text-zinc-400 p-2">Input:</p>
        <pre className={`whitespace-pre-wrap text-xs break-words p-2`}>
          {JSON.stringify(input, null, 2)}
        </pre>

        <p className="text-xs text-zinc-400 p-2">Output:</p>
        <pre className={`whitespace-pre-wrap text-xs break-words p-2`}>
          {JSON.stringify(output, null, 2)}
        </pre>
      </div>
    </div>
  )
}
