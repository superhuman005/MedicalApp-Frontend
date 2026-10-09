import API from "./api";

// Doctor-only clinical co-pilot (POST /api/ai-chat/doctor-assist). The
// patient-facing AI assistant was removed from this service - AI now only
// talks to patients as a stand-in doctor inside the normal consultation
// chat when no human doctor is online (handled entirely server-side, see
// ChatConsultation's "ai" senderRole messages), not as a general chatbot.
export interface AiChatHistoryEntry {
  role: "user" | "ai";
  content: string;
}

export const getDoctorAssistReply = async (
  message: string,
  history: AiChatHistoryEntry[] = []
): Promise<string> => {
  const { data } = await API.post("/ai-chat/doctor-assist", { message, history });
  return data.reply;
};
