"use client";
import { useDataset } from "@/hooks/datasets";
import CSVTable from "@/components/csv-table";
import { useState } from "react";


export function Dataset({ tableName }: { tableName: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useDataset(tableName, page);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: {isError}</div>;
  }

  if (!data) {
    return <div>No data</div>;
  }

  const convertToCSVData = (data: any) => {
    return {
      headers: data.fields.map((field: any) => field.name),
      rows: data.rows.map((row: { [key: string]: any }) => Object.values(row)),
    };
  };

  return (
    <CSVTable
      csvData={convertToCSVData(data)}
    />
  );
}