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

export const useMessages = (tableName: string) => {
  const { db } = useApp();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["messages", tableName],
    queryFn: async () => {
      const messages = await getMessages(db, tableName);
      return messages.rows.map(mapToUIMessage);
    }
  });

  return { data, isLoading, isError };
}

export const useSaveMessage = (tableName: string) => {
  const { db } = useApp();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync } = useMutation({
    mutationFn: async (message: UIMessage) => await saveMessage(db, tableName, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", tableName] });
    }
  });

  return { mutate, mutateAsync };
}