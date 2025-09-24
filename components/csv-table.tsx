import { useState } from 'react';

interface CSVData {
  headers: string[];
  rows: string[][];
}

interface CSVTableProps {
  csvData: CSVData;
}

export default function CSVTable({ csvData}: CSVTableProps) {
  const [columnWidths, setColumnWidths] = useState<number[]>(
    csvData.headers.map(() => 120) // Default width of 120px for each column
  );
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<number | null>(null);

  const handleMouseDown = (columnIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizingColumn(columnIndex);
    
    const startX = e.clientX;
    const startWidth = columnWidths[columnIndex];

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const diff = e.clientX - startX;
      const newWidth = Math.max(60, startWidth + diff); // Minimum width of 60px
      
      setColumnWidths(prev => 
        prev.map((width, index) => 
          index === columnIndex ? newWidth : width
        )
      );
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizingColumn(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div 
      className={`bg-white ${
        isResizing ? 'cursor-col-resize select-none' : ''
      }`}
    >
      <table className="border-collapse" style={{ 
        tableLayout: 'fixed', 
        width: columnWidths.reduce((sum, width) => sum + width, 48) // 48px for row numbers column
      }}>
        <thead>
          <tr>
            {/* Empty cell for row numbers column */}
            <th className="h-8 bg-gray-50 border border-gray-300 sticky left-0 z-10" style={{ width: 48 }}>
              
            </th>
            {csvData.headers.slice(1).map((header, index) => ( // slice(1) to skip the row number column (column ___index___)
              <th
                key={index}
                className="h-8 bg-gray-50 border border-gray-300 text-xs font-medium text-gray-700 text-left px-2 py-1 relative"
                style={{ width: columnWidths[index] }}
              >
                <div className="truncate">
                  {header}
                </div>
                {/* Resize handle */}
                <div
                  className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-400/50 z-20 bg-transparent border-r border-transparent hover:border-blue-400"
                  onMouseDown={(e) => handleMouseDown(index, e)}
                  title="Drag to resize column"
                  style={{ 
                    right: '-1.5px',
                    backgroundColor: resizingColumn === index ? '#3b82f6' : undefined,
                    borderRightColor: resizingColumn === index ? '#3b82f6' : undefined
                  }}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {csvData.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/30"}>
              {/* Row number */}
              <td className="h-6 bg-gray-100 border border-gray-300 text-xs font-medium text-gray-600 text-center sticky left-0 z-10" style={{ width: 48 }}>
                {row[0]} {/* row[0] is the row number (column ___index___) */}
              </td>
              {row.slice(1).map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="h-6 border border-gray-300 text-xs text-gray-900 px-2 py-1 hover:bg-blue-50 focus:bg-blue-100 cursor-cell"
                  style={{ width: columnWidths[cellIndex] }}
                  title={cell} // Show full content on hover
                >
                  <div className="truncate">
                    {cell}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
