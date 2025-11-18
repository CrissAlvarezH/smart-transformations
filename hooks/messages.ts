import { getMessages, saveMessage } from "@/services/chat";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UIMessage } from "ai";
import { useApp } from "@/app/providers";
import { MESSAGES } from "./query-keys";
import { useWorkspace } from "@/app/[slug]/providers";


function mapToUIMessage(message: any): UIMessage {
  return {
    id: message.id,
    role: message.role,
    metadata: message.metadata,
    parts: message.parts,
  };
}

export const useMessages = () => {
  const { db } = useApp();
  const { dataset } = useWorkspace();

  const { data, isLoading, isError } = useQuery({
    queryKey: [MESSAGES, dataset.id],
    queryFn: async () => {
      const messages = await getMessages(db, dataset.id);
      return messages.rows.map(mapToUIMessage);
    }
  });

  return { data, isLoading, isError };
}

export const useSaveMessage = () => {
  const { db } = useApp();
  const { dataset } = useWorkspace();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync } = useMutation({
    mutationFn: async (message: UIMessage) => await saveMessage(db, dataset.id, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MESSAGES, dataset.id] });
    }
  });

  return { mutate, mutateAsync };
}