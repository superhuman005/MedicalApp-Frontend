import { useEffect, useRef, useState } from "react";
import { Card, SectionTitle, RefButton } from "@/components/ui-ref";
import { Icon } from "@/components/Icon";
import { getDoctorAssistReply, type AiChatHistoryEntry } from "@/services/aiChat";
import { getErrorMessage } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface DisplayMessage {
  role: "user" | "ai";
  content: string;
}

const SUGGESTIONS = [
  "What are red-flag symptoms for chest pain?",
  "Suggest a differential for a 3-day fever with rash",
  "Typical dosing for amoxicillin in adults",
  "How should I document a suspected drug interaction?",
];

// A doctor-only clinical co-pilot: a free-form chat the doctor can use for
// drafting help, quick lookups, and second opinions while working, backed by
// Groq (see POST /api/ai-chat/doctor-assist). This is a standalone tool, not
// tied to any specific patient or live conversation - it never sends
// anything to a patient on the doctor's behalf.
const DoctorAIAssistant = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const history: AiChatHistoryEntry[] = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setIsSending(true);
    try {
      const reply = await getDoctorAssistReply(trimmed, history);
      setMessages((prev) => [...prev, { role: "ai", content: reply }]);
    } catch (error) {
      toast({ title: "Assistant unavailable", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <Card pad={false} className="flex h-[min(720px,calc(100vh-220px))] flex-col overflow-hidden">
      <div className="border-b border-[var(--c-line)] p-5">
        <SectionTitle
          title="AI Clinical Assistant"
          sub="A drafting aid for your own reference - never sends anything to a patient."
        />
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[var(--c-surface2)]/40">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--c-accentsoft)]">
              <Icon name="sparkle" className="h-6 w-6 text-[var(--c-brand)]" />
            </div>
            <p className="text-[13px] text-[var(--c-muted)] max-w-sm">
              Ask about differentials, dosing references, or how to phrase something for a patient. This never
              messages a patient on its own - it's just for you.
            </p>
            <div className="mt-5 grid w-full gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  className="rounded-xl border border-[var(--c-line)] bg-[var(--c-surface)] px-3 py-2 text-left text-[12.5px] text-[var(--c-ink)] hover:bg-[var(--c-surface2)]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap shadow-sm ${
                  m.role === "user"
                    ? "bg-[var(--c-brand)] text-white rounded-br-sm"
                    : "bg-[var(--c-surface)] border border-[var(--c-line)] text-[var(--c-ink)] rounded-bl-sm"
                }`}
              >
                {m.role === "ai" && (
                  <div className="mb-1 flex items-center gap-1 text-[11px] font-medium text-[var(--c-muted)]">
                    <Icon name="sparkle" className="h-3 w-3" /> AI Assistant
                  </div>
                )}
                {m.content}
              </div>
            </div>
          ))
        )}
        {isSending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm border border-[var(--c-line)] bg-[var(--c-surface)] px-4 py-2.5 text-[13.5px] text-[var(--c-muted)]">
              Thinking…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-[var(--c-line)] p-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the assistant anything clinical…"
          className="flex-1 rounded-full border border-[var(--c-line)] bg-[var(--c-surface)] px-4 py-2.5 text-[13.5px] text-[var(--c-ink)] outline-none focus:border-[var(--c-brand)]"
        />
        <RefButton type="submit" size="icon" disabled={!input.trim() || isSending} className="rounded-full">
          <Icon name="send" className="h-4 w-4" />
        </RefButton>
      </form>
    </Card>
  );
};

export default DoctorAIAssistant;
