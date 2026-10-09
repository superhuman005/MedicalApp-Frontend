import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Bot } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/services/api";
import { getSocket } from "@/services/socket";
import { getConsultationRequestById } from "@/services/consultationRequests";
import ChatConsultation from "@/components/ChatConsultation";
import type { ConsultationRequestItem } from "@/types";

// Chat surface for a consultation request for its *entire* lifecycle -
// pending (possibly AI-attended), and after a doctor accepts. The underlying
// chat thread is keyed by the request's own id throughout, so nothing here
// needs to migrate messages when a doctor takes over; it just needs to know
// whether to show the "AI is standing in" banner and who the other party is.
const ConsultationChatPage = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isDoctor = user?.role === "doctor";

  const [request, setRequest] = useState<ConsultationRequestItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!requestId) return;
    (async () => {
      try {
        const data = await getConsultationRequestById(requestId);
        setRequest(data);
      } catch (error) {
        toast({ title: "Couldn't load conversation", description: getErrorMessage(error), variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [requestId, toast]);

  // Live-update the moment a doctor accepts - swaps the AI banner for the
  // doctor's details without the patient needing to refresh.
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !requestId) return;

    const handleAccepted = (updated: ConsultationRequestItem) => {
      if (updated._id !== requestId) return;
      setRequest(updated);
    };

    socket.on("consultation-request:accepted", handleAccepted);
    return () => {
      socket.off("consultation-request:accepted", handleAccepted);
    };
  }, [requestId]);

  if (!requestId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <p className="text-gray-600">No consultation request specified.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <p className="text-gray-600">Conversation not found or you don't have access to it.</p>
      </div>
    );
  }

  const assignedDoctor = request.doctor || request.acceptedBy;
  const isAiActive = !!request.aiHandling && request.status === "pending";

  const otherPartyName = isDoctor
    ? (request.familyMember ? request.familyMember.name : `${request.patient.firstName} ${request.patient.lastName}`)
    : isAiActive
    ? "TeleMed AI"
    : assignedDoctor
    ? `Dr. ${assignedDoctor.firstName} ${assignedDoctor.lastName}`
    : "Waiting for a doctor…";

  const otherPartySubtitle = isDoctor
    ? (request.familyMember ? request.familyMember.relationship : "Patient")
    : isAiActive
    ? "Standing in until a doctor joins"
    : assignedDoctor?.specialization;

  const otherPartyAvatar = isDoctor ? undefined : assignedDoctor?.avatar;

  return (
    <ChatConsultation
      conversationId={request._id}
      conversationModel="ConsultationRequest"
      otherPartyName={otherPartyName}
      otherPartySubtitle={otherPartySubtitle}
      otherPartyAvatar={otherPartyAvatar}
      backTo={isDoctor ? "/doctor-dashboard" : "/patient-dashboard"}
      // A real Appointment only exists once a doctor accepts - the "end
      // consultation" / description-tab features that need one simply stay
      // hidden until then (ChatConsultation already handles appointmentId
      // being undefined).
      appointmentId={request.appointment}
      doctorId={assignedDoctor?._id}
      doctorName={assignedDoctor ? `${assignedDoctor.firstName} ${assignedDoctor.lastName}` : undefined}
      banner={
        isAiActive && !isDoctor ? (
          <div className="flex items-start gap-2 bg-accent/10 border border-accent/30 text-accent-foreground rounded-lg px-3 py-2 text-xs mb-1">
            <Bot className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              No doctor is online right now, so <strong>TeleMed AI</strong> is attending to you. A human doctor will
              automatically join and see this whole conversation as soon as one's available.
            </p>
          </div>
        ) : undefined
      }
    />
  );
};

export default ConsultationChatPage;
