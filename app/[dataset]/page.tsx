"use client";

import CSVTable from "@/components/csv-table";
import { usePGLiteDB } from "@/lib/pglite-context";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Chat } from "@/components/chat/chat";
import { CSVIcon } from "@/components/Icons";


export default function DatasetPage() {
  const params = useParams();
  const { dataset } = params;
  const { db } = usePGLiteDB();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dataset", dataset, page],
    queryFn: () => db.query(`SELECT * FROM ${dataset} LIMIT 50 OFFSET ${page * 100}`),
  });

  const convertToCSVData = (data: any) => {
    return {
      headers: data.fields.map((field: any) => field.name),
      rows: data.rows.map((row: { [key: string]: any }) => Object.values(row)),
    };
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: {isError}</div>;
  }

  if (!data) {
    return <div>No data</div>;
  }

  return (
    <div className="flex h-screen">
      <div className="w-[500px] flex-shrink-0 h-full">
        <Chat />
      </div>

      <div className="flex-1 h-full overflow-auto bg-gray-100">

        <div className="bg-white p-1 text-gray-900 flex items-center">
          <CSVIcon className="h-5 w-5 text-gray-700 mx-2" />
          <h1 className="text-gray-700">{dataset}</h1>
        </div>

        <div>
          <CSVTable
            csvData={convertToCSVData(data)}
          />
        </div>

      </div>
    </div>
  )
}