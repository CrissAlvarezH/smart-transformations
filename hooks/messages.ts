import { getMessages, saveMessage } from "@/services/chat";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UIMessage } from "ai";
import { useApp } from "@/app/providers";


function mapToUIMessage(message: any): UIMessage {
  return {
    id: message.id,
    role: message.role,
    metadata: message.metadata,
    parts: message.parts,
  };
}

export const useMessages = (datasetId: number) => {
  const { db } = useApp();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["messages", datasetId],
    queryFn: async () => {
      const messages = await getMessages(db, datasetId);
      return messages.rows.map(mapToUIMessage);
    }
  });

  return { data, isLoading, isError };
}

export const useSaveMessage = (datasetId: number) => {
  const { db } = useApp();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync } = useMutation({
    mutationFn: async (message: UIMessage) => await saveMessage(db, datasetId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", datasetId] });
    }
  });

  return { mutate, mutateAsync };
}