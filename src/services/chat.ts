import API from "./api";
import type { ChatMessageItem } from "@/types";

export type ConversationModel = "Appointment" | "ConsultationRequest";

export const getMessages = async (
  conversationModel: ConversationModel,
  conversationId: string
): Promise<ChatMessageItem[]> => {
  const { data } = await API.get(`/chat/${conversationModel}/${conversationId}/messages`);
  return data.messages;
};

export const sendMessage = async (
  conversationModel: ConversationModel,
  conversationId: string,
  input: { text?: string; attachmentUrl?: string }
): Promise<ChatMessageItem> => {
  const { data } = await API.post(`/chat/${conversationModel}/${conversationId}/messages`, input);
  return data.message;
};
