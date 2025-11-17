"use client";

import { UIMessage } from "@ai-sdk/react";
import { Markdown } from "../markdown";

import { ChevronDown, Bolt, Wrench, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo, memo } from "react";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useChartData } from "@/hooks/chart";

// Move colors outside component to prevent recreation on every render
const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff6384', '#36a2eb'];

interface ChatMessageProps {
  isChatReady: boolean
  message: UIMessage;
}

export function ChatMessage({ message, isChatReady }: ChatMessageProps) {
  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`rounded-2xl px-4 py-3 ${message.role === 'user'
          ? 'bg-zinc-800 text-white ml-12 max-w-[90%]'
          : 'w-full'
          }`}
      >
        {message.parts.map((part, index) => {
          if (part.type === "text") { // it is the message part
            return message.role === 'user' ? (
              <p key={index} className="whitespace-pre-wrap break-words">{part.text}</p>
            ) : (
              <div key={index} className="py-2">
                <Markdown>{part.text}</Markdown>
              </div>
            );
          }
          // It is a tool part

          const isTheLastPart = index === message.parts.length - 1;
          const isLoading = isTheLastPart && !isChatReady;

          switch (part.type) {
            case 'tool-query_data': {
              return <GenericToolPart key={index} part={part} isLoading={isLoading} />;
            }
            case 'tool-generate_transformation_sql': {
              return <GenericToolPart key={index} part={part} isLoading={isLoading} />;
            }
            case 'tool-create_transformation': {
              return <GenericToolPart key={index} part={part} isLoading={isLoading} />;
            }
            case 'tool-generate_lines_chart': {
              return <LinesChartTool key={index} part={part} isLoading={isLoading} />;
            }
            default:
              return null;
          }
        })}
      </div>
    </div>
  )
}


function GenericToolPart({ part, isLoading }: { part: any, isLoading: boolean }) {
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
    'query_data': 'Querying dataset data',
    'generate_transformation_sql': 'Generating tranformation',
    'create_transformation': 'Applying transformation',
    'generate_lines_chart': 'Generating lines chart',
  }
  const toolNameTranslated = toolNameTranslator[toolName];

  return (
    <div className="py-2 w-full">
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="flex items-center gap-2">
          <Bolt className={cn("w-4 h-4", isLoading && "animate-spin")} />
          <div className="flex gap-2 items-center">
            <span className="font-semibold text-xs text-zinc-100">{toolNameTranslated}</span>

            {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
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


function LinesChartTool({ part, isLoading }: { part: any, isLoading: boolean }) {
  const { state, input, output } = part;

  if (isLoading) {
    return <GenericToolPart part={part} isLoading />;
  }

  if (state !== 'output-available') {
    return <div>Warning: not loaded yet</div>;
  }

  if (input.sql === undefined || input.xAxisName === undefined || input.linesNames === undefined) {
    return <div>Error: missing input</div>;
  }

  // Memoize props to prevent unnecessary re-renders
  const chartProps = useMemo(() => ({
    chartTableName: output.chart.tableName,
    xAxisName: input.xAxisName,
    linesNames: input.linesNames
  }), [output.chart.tableName, input.xAxisName, JSON.stringify(input.linesNames)]);

  return <LinesChart 
    chartTableName={chartProps.chartTableName} 
    xAxisName={chartProps.xAxisName} 
    linesNames={chartProps.linesNames} 
  />;
}


const LinesChart = memo(function LinesChart({ 
  chartTableName, xAxisName, linesNames 
}: { 
  chartTableName: string, 
  xAxisName: string, 
  linesNames: string[] 
}) {
  // Memoize the linesNames array to prevent recreation on every render
  const memoizedLinesNames = useMemo(() => linesNames, [linesNames.join(',')]);
  
  const { data, isLoading: isLoadingChart, isError, error } = useChartData(chartTableName);
  if (isLoadingChart) {
    return <div>Loading...</div>;
  } else if (isError) {
    return <div>Error: {error?.message ?? 'Unknown error'}</div>;
  }

  return (
    <div className="w-full overflow-auto">
      <LineChart
        style={{ width: '100%', maxWidth: '700px', height: '100%', maxHeight: '70vh', aspectRatio: 1.618 }}
        responsive
        data={data}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisName} />
        <YAxis width="auto" />
        <Tooltip />
        <Legend />

        {memoizedLinesNames.map((lineName: string, index: number) => (
          <Line key={lineName} type="monotone" dataKey={lineName} stroke={CHART_COLORS[index % CHART_COLORS.length]} activeDot={{ r: 8 }} />
        ))}
      </LineChart>
    </div>

  )
});