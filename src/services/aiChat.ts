import API from "./api";

export interface AiChatHistoryEntry {
  role: "user" | "ai";
  content: string;
}

export const sendAiChatMessage = async (
  message: string,
  history: AiChatHistoryEntry[] = []
): Promise<string> => {
  const { data } = await API.post("/ai-chat", { message, history });
  return data.reply;
};
