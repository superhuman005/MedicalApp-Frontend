
import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Send, Loader2, ArrowLeft, Video, MessageSquare, FileText, PhoneOff, Bot } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { getMessages, sendMessage, ConversationModel } from "@/services/chat";
import { getSocket } from "@/services/socket";
import { getErrorMessage } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { createDoctorReport, getMyDoctorReports } from "@/services/doctorReports";
import { updateAppointmentStatus } from "@/services/appointments";
import RateDoctorDialog from "@/components/RateDoctorDialog";
import type { ChatMessageItem, DoctorReportItem } from "@/types";

interface ChatConsultationProps {
  conversationId: string;
  conversationModel: ConversationModel;
  otherPartyName: string;
  otherPartySubtitle?: string;
  otherPartyAvatar?: string;
  backTo?: string;
  videoCallHref?: string;
  // When set, both an "End Consultation" action and (doctor-only) a
  // "Description" tab become available - both need a real appointment to act
  // on. The Description tab lets the doctor write up the consultation and
  // send it to the admin team (doctors have no way to send this straight to
  // the patient - see DoctorReport on the backend). Ending marks the
  // appointment completed and, for the patient, offers a chance to rate the
  // doctor while they wait for a prescription (if any) to clear admin review.
  appointmentId?: string;
  // Needed only for the patient's post-end rating prompt.
  doctorId?: string;
  doctorName?: string;
  // Shown just below the header - e.g. the patient-side "AI is assisting
  // you until a doctor joins" notice on a pending consultation request.
  banner?: ReactNode;
}

const URGENCY_OPTIONS: { value: "low" | "medium" | "high"; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const ChatConsultation = ({
  conversationId,
  conversationModel,
  otherPartyName,
  otherPartySubtitle,
  otherPartyAvatar = "/placeholder.svg",
  backTo = "/patient-dashboard",
  videoCallHref,
  appointmentId,
  doctorId,
  doctorName,
  banner,
}: ChatConsultationProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isDoctor = user?.role === "doctor";
  const showDescriptionTab = isDoctor && !!appointmentId;

  const [activeView, setActiveView] = useState<"chat" | "description">("chat");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // End-consultation state - available to both roles whenever this chat is
  // tied to a real appointment.
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  // True once *this* tab learns the consultation is over - either because
  // the local user just ended it (set right before the request goes out) or
  // because the other party ended it and the backend's live
  // "appointment:updated" event told us so (see the effect below). Either
  // way, the chat is read-only from this point on.
  const [remotelyEnded, setRemotelyEnded] = useState(false);
  const endedLocallyRef = useRef(false);

  // Description tab state
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<"low" | "medium" | "high">("low");
  const [isSubmittingDescription, setIsSubmittingDescription] = useState(false);
  const [pastDescriptions, setPastDescriptions] = useState<DoctorReportItem[]>([]);
  const [isLoadingDescriptions, setIsLoadingDescriptions] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMessages(conversationModel, conversationId);
        setMessages(data);
      } catch (error) {
        toast({
          title: "Couldn't load messages",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [conversationId, conversationModel, toast]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit("chat:join", { conversationId });

    const handleIncoming = (msg: ChatMessageItem) => {
      if (msg.conversation !== conversationId) return;
      setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
    };

    socket.on("chat:message", handleIncoming);
    return () => {
      socket.emit("chat:leave", { conversationId });
      socket.off("chat:message", handleIncoming);
    };
  }, [conversationId]);

  // Live hand-off when the OTHER party ends the consultation: the backend
  // emits "appointment:updated" straight to both participants' personal
  // socket rooms whenever an appointment's status changes (see
  // updateAppointmentStatus on the backend). If this tab didn't just trigger
  // the end itself, close out the chat here too instead of leaving it open
  // with no sign anything happened.
  useEffect(() => {
    if (!appointmentId) return;
    const socket = getSocket();
    if (!socket) return;

    const handleAppointmentUpdated = (updated: { _id: string; status: string }) => {
      if (updated._id !== appointmentId || updated.status !== "completed" || endedLocallyRef.current) return;

      setRemotelyEnded(true);
      toast({
        title: "Consultation ended",
        description: `${otherPartyName} ended this consultation.`,
      });

      if (!isDoctor && doctorId && doctorName) {
        // Offer the same rating prompt the patient would see if they'd ended
        // it themselves, while any prescription clears admin review.
        setIsRateDialogOpen(true);
      } else {
        navigate(backTo);
      }
    };

    socket.on("appointment:updated", handleAppointmentUpdated);
    return () => {
      socket.off("appointment:updated", handleAppointmentUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId, isDoctor, doctorId, doctorName, otherPartyName, backTo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load this doctor's past descriptions for this appointment the first time
  // they open the Description tab, so they can see what's already been sent.
  useEffect(() => {
    if (!showDescriptionTab || activeView !== "description") return;
    setIsLoadingDescriptions(true);
    getMyDoctorReports()
      .then((reports) => setPastDescriptions(reports.filter((r) => r.appointment._id === appointmentId)))
      .catch((error) => {
        toast({ title: "Couldn't load past descriptions", description: getErrorMessage(error), variant: "destructive" });
      })
      .finally(() => setIsLoadingDescriptions(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, showDescriptionTab, appointmentId]);

  const handleSubmitDescription = async () => {
    if (!appointmentId || !description.trim()) return;
    setIsSubmittingDescription(true);
    try {
      const report = await createDoctorReport({ appointmentId, recommendation: description.trim(), urgency });
      setPastDescriptions((prev) => [report, ...prev]);
      setDescription("");
      setUrgency("low");
      toast({ title: "Sent to admin", description: "Your description of this consultation was sent to the admin team." });
    } catch (error) {
      toast({ title: "Couldn't send description", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsSubmittingDescription(false);
    }
  };

  const handleEndConsultation = async () => {
    if (!appointmentId) return;
    setIsEnding(true);
    endedLocallyRef.current = true;
    try {
      await updateAppointmentStatus(appointmentId, "completed");
      setIsEndDialogOpen(false);
      setRemotelyEnded(true);
      if (isDoctor) {
        toast({ title: "Consultation ended" });
        navigate(backTo);
      } else {
        // Offer a chance to rate the doctor while any prescription they send
        // clears admin review - RateDoctorDialog's onDone handles navigating away.
        setIsRateDialogOpen(true);
      }
    } catch (error) {
      endedLocallyRef.current = false;
      toast({ title: "Couldn't end consultation", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsEnding(false);
    }
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleSendMessage = useCallback(async () => {
    const text = message.trim();
    if (!text) return;

    setMessage("");
    setIsSending(true);

    const socket = getSocket();
    try {
      if (socket && socket.connected) {
        socket.emit("chat:send", { conversationId, conversationModel, text });
      } else {
        const sent = await sendMessage(conversationModel, conversationId, { text });
        setMessages((prev) => [...prev, sent]);
      }
    } catch (error) {
      toast({
        title: "Message not sent",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  }, [message, conversationId, conversationModel, toast]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link to={backTo}>
              <Button variant="ghost" size="sm" className="text-white hover:bg-green-700 p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Avatar className="w-10 h-10">
              <AvatarImage src={otherPartyAvatar} />
              <AvatarFallback className="bg-green-400 text-white">
                {otherPartyName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{otherPartyName}</h2>
              {otherPartySubtitle && <p className="text-sm text-green-100">{otherPartySubtitle}</p>}
            </div>
          </div>
          {videoCallHref && (
            <Link to={videoCallHref}>
              <Button variant="ghost" size="sm" className="text-white hover:bg-green-700 p-2">
                <Video className="w-5 h-5" />
              </Button>
            </Link>
          )}
          {appointmentId && !remotelyEnded && (
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-red-600 p-2"
              onClick={() => setIsEndDialogOpen(true)}
              aria-label="End consultation"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          )}
        </div>

        {showDescriptionTab && (
          <div className="flex gap-1 mt-3 bg-green-700/50 rounded-lg p-1 w-fit">
            <button
              type="button"
              onClick={() => setActiveView("chat")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeView === "chat" ? "bg-white text-green-700" : "text-white hover:bg-green-700"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveView("description")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeView === "description" ? "bg-white text-green-700" : "text-white hover:bg-green-700"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Description
            </button>
          </div>
        )}
      </div>

      {banner && activeView === "chat" && <div className="px-4 pt-3 bg-gray-100">{banner}</div>}

      {remotelyEnded && activeView === "chat" && (
        <div className="px-4 pt-3 bg-gray-100">
          <div className="flex items-center gap-2 bg-gray-200 text-gray-700 rounded-lg px-3 py-2 text-xs">
            <PhoneOff className="w-3.5 h-3.5 shrink-0" />
            This consultation has ended. You can still read back through the messages, but nothing new can be sent.
          </div>
        </div>
      )}

      {activeView === "description" ? (
        <div className="flex-1 overflow-y-auto p-4 bg-gray-100 space-y-4">
          <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
            <div>
              <Label htmlFor="consult-description">Describe this consultation</Label>
              <p className="text-xs text-gray-500 mb-2">
                Sent to the admin team for review - not visible to the patient.
              </p>
              <Textarea
                id="consult-description"
                className="min-h-[100px]"
                placeholder="Symptoms discussed, assessment, recommendation..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
              />
            </div>
            <div>
              <Label>Urgency</Label>
              <RadioGroup
                className="flex gap-4 mt-2"
                value={urgency}
                onValueChange={(v) => setUrgency(v as "low" | "medium" | "high")}
              >
                {URGENCY_OPTIONS.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt.value} id={`urgency-${opt.value}`} />
                    <Label htmlFor={`urgency-${opt.value}`} className="font-normal cursor-pointer">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <Button
              onClick={handleSubmitDescription}
              disabled={!description.trim() || isSubmittingDescription}
              className="w-full"
            >
              {isSubmittingDescription && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send to Admin
            </Button>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Previously sent for this consultation</p>
            {isLoadingDescriptions ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : pastDescriptions.length === 0 ? (
              <p className="text-sm text-gray-500">Nothing sent yet.</p>
            ) : (
              <div className="space-y-2">
                {pastDescriptions.map((report) => (
                  <div key={report._id} className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <Badge
                        variant="outline"
                        className={
                          report.urgency === "high"
                            ? "text-red-600 border-red-600"
                            : report.urgency === "medium"
                            ? "text-yellow-600 border-yellow-600"
                            : "text-gray-600 border-gray-400"
                        }
                      >
                        {report.urgency} urgency
                      </Badge>
                      <span className="text-xs text-gray-500">{new Date(report.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{report.recommendation}</p>
                    <Badge variant="outline" className="mt-2 capitalize">
                      {report.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
      <>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-8">
            No messages yet. Say hello to get the conversation started.
          </p>
        ) : (
          messages.map((msg) => {
            const isAi = msg.senderRole === "ai";
            const isMine = !isAi && msg.sender?._id === user?._id;
            return (
              <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-xs lg:max-w-md">
                  {isAi && (
                    <div className="flex items-center gap-1 mb-1 px-1 text-xs font-medium text-gray-500">
                      <Bot className="w-3.5 h-3.5" /> TeleMed AI
                    </div>
                  )}
                  <div
                    className={`px-4 py-3 rounded-lg shadow-sm ${
                      isMine
                        ? 'bg-green-500 text-white rounded-br-none'
                        : isAi
                        ? 'bg-accent/10 text-gray-800 border border-accent/30 rounded-bl-none'
                        : 'bg-white text-gray-800 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <div className="flex items-center justify-end mt-2 space-x-1">
                      <span className={`text-xs ${isMine ? 'text-green-100' : 'text-gray-500'}`}>
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={remotelyEnded ? "This consultation has ended" : "Type a message..."}
              disabled={remotelyEnded}
              className="w-full rounded-full border-gray-300 py-3"
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending || remotelyEnded}
            className="bg-green-600 hover:bg-green-700 rounded-full p-3"
          >
            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
      </div>
      </>
      )}

      <Dialog open={isEndDialogOpen} onOpenChange={(open) => !isEnding && setIsEndDialogOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End this consultation?</DialogTitle>
            <DialogDescription>
              This will end your chat with {otherPartyName} and mark the consultation as completed. You can still
              view the message history afterward.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsEndDialogOpen(false)} disabled={isEnding}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleEndConsultation} disabled={isEnding}>
              {isEnding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              End Consultation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {!isDoctor && appointmentId && doctorId && doctorName && (
        <RateDoctorDialog
          open={isRateDialogOpen}
          onOpenChange={setIsRateDialogOpen}
          doctorId={doctorId}
          doctorName={doctorName}
          appointmentId={appointmentId}
          onDone={() => navigate(backTo)}
        />
      )}
    </div>
  );
};

export default ChatConsultation;
