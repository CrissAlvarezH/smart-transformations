"use client";
import { Workspace } from "./workspace";
import { useParams } from "next/navigation";
import { useDatasetBySlug } from "@/hooks/datasets";
import { Button } from "@/components/ui/button";
import { FileX, Home, Loader2 } from "lucide-react";
import Link from "next/link";
import { WorkspaceProvider } from "./providers";


export const dynamic = "force-dynamic";


export default function DatasetPage() {
  const params = useParams();
  const { dataset, isLoading, error } = useDatasetBySlug(params.slug as string);

  if (isLoading) return <Loading />;

  if (error) {
    if (error.message.includes('not found')) return <DatasetNotFound />
    else return <div>Error: {error.message}</div>
  }

  if (!dataset) return <DatasetNotFound />

  return (
    <WorkspaceProvider dataset={dataset}>
      <Workspace />
    </WorkspaceProvider>
  )
}

function Loading() {
  return (
    <div>
      {/* mobile */}
      <div className="flex sm:hidden flex-col items-center gap-2 bg-black h-screen justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
        <span className="text-gray-500">Loading...</span>
      </div>

      {/* desktop */}
      <div className="hidden sm:flex h-screen">
        {/* the chat part */}
        <div className="w-[500px] flex-shrink-0 h-full">
          <div className="flex flex-col items-center gap-2 bg-black h-full justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            <span className="text-gray-500">Loading...</span>
          </div>
        </div>

        {/* the dataset part */}
        <div className="flex-1 h-full flex flex-col overflow-auto bg-white">
          <div className="flex flex-col items-center gap-2 bg-white h-full justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            <span className="text-gray-500">Loading...</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function DatasetNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <FileX className="w-12 h-12 text-gray-400" />
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mb-3">
            Dataset not found
          </h1>

          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            The dataset you're looking for doesn't exist or may have been deleted.
            Please check the URL or go back to browse available datasets.
          </p>

          <Link href="/">
            <Button variant="outline" className="inline-flex items-center">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}