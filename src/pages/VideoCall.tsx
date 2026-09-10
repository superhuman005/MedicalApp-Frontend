import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Video, VideoOff, Mic, MicOff, Phone, FileText, Loader2, AlertTriangle } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/services/api";
import { getSocket } from "@/services/socket";
import { getAppointmentById, updateAppointmentStatus } from "@/services/appointments";
import { createPrescription, createConsultation } from "@/services/medicalRecords";
import { createDoctorReport } from "@/services/doctorReports";
import ChatConsultation from "@/components/ChatConsultation";
import type { Appointment } from "@/types";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const VideoCall = () => {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const typeParam = (searchParams.get('type') as 'video' | 'chat') || 'video';
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [peerConnected, setPeerConnected] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);
  const [isSubmittingRx, setIsSubmittingRx] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({ medication: "", dosage: "", instructions: "" });
  const [notes, setNotes] = useState("");
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [recommendation, setRecommendation] = useState("");
  const [reportUrgency, setReportUrgency] = useState<"low" | "medium" | "high">("low");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const isDoctor = user?.role === 'doctor';

  // Load the appointment so we know who the other party is and whether this
  // call is authorized (only participants can join, enforced server-side too).
  useEffect(() => {
    if (!appointmentId) {
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        const appt = await getAppointmentById(appointmentId);
        setAppointment(appt);
      } catch (error) {
        toast({ title: "Couldn't load appointment", description: getErrorMessage(error), variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [appointmentId, toast]);

  const cleanupCall = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
  }, []);

  // WebRTC + Socket.io signaling setup (video calls only).
  useEffect(() => {
    if (typeParam !== 'video' || !appointmentId) return;
    const socket = getSocket();
    if (!socket) return;

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const createPeerConnection = () => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("video:ice-candidate", { roomId: appointmentId, candidate: event.candidate });
        }
      };
      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        setPeerConnected(true);
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'closed' || pc.connectionState === 'failed') {
          setPeerConnected(false);
        }
      };
      return pc;
    };

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) return;
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const pc = createPeerConnection();
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        pcRef.current = pc;

        socket.emit("video:join", { roomId: appointmentId });
        timer = setInterval(() => setCallDuration((d) => d + 1), 1000);
      } catch (error) {
        toast({
          title: "Camera/microphone unavailable",
          description: "Please allow camera and microphone access to join the video call.",
          variant: "destructive",
        });
      }
    };

    const handlePeerJoined = async () => {
      // The peer already in the room initiates the offer when someone new joins.
      const pc = pcRef.current;
      if (!pc) return;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("video:offer", { roomId: appointmentId, offer });
    };

    const handleOffer = async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("video:answer", { roomId: appointmentId, answer });
    };

    const handleAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      try {
        await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // Ignore late candidates arriving before remote description is set
      }
    };

    const handlePeerLeft = () => {
      setPeerConnected(false);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    };

    const handleCallEnded = () => {
      toast({ title: "Call ended", description: "The other participant left the call." });
      cleanupCall();
      navigate(isDoctor ? "/doctor-dashboard" : "/patient-dashboard");
    };

    socket.on("video:peer-joined", handlePeerJoined);
    socket.on("video:offer", handleOffer);
    socket.on("video:answer", handleAnswer);
    socket.on("video:ice-candidate", handleIceCandidate);
    socket.on("video:peer-left", handlePeerLeft);
    socket.on("video:call-ended", handleCallEnded);

    start();

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      socket.emit("video:leave", { roomId: appointmentId });
      socket.off("video:peer-joined", handlePeerJoined);
      socket.off("video:offer", handleOffer);
      socket.off("video:answer", handleAnswer);
      socket.off("video:ice-candidate", handleIceCandidate);
      socket.off("video:peer-left", handlePeerLeft);
      socket.off("video:call-ended", handleCallEnded);
      cleanupCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId, typeParam]);

  const toggleAudio = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !isAudioOn));
    setIsAudioOn((v) => !v);
  };

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !isVideoOn));
    setIsVideoOn((v) => !v);
  };

  // Patients (and the plain "leave" case) just hang up immediately - only the
  // doctor's end-of-consultation path finalizes the appointment record.
  const handleLeaveCall = async () => {
    setIsEnding(true);
    const socket = getSocket();
    socket?.emit("video:end-call", { roomId: appointmentId });
    cleanupCall();
    navigate(isDoctor ? "/doctor-dashboard" : "/patient-dashboard");
  };

  const handleEndCallClick = () => {
    if (isDoctor) {
      setIsEndDialogOpen(true);
    } else {
      handleLeaveCall();
    }
  };

  const handleConfirmEndConsultation = async () => {
    if (!appointment || !recommendation.trim()) return;
    setIsEnding(true);

    const socket = getSocket();
    socket?.emit("video:end-call", { roomId: appointmentId });
    cleanupCall();

    try {
      await updateAppointmentStatus(appointment._id, "completed");

      if (notes.trim()) {
        await createConsultation({
          patientId: appointment.patient._id,
          familyMemberId: appointment.familyMember?._id,
          appointmentId: appointment._id,
          specialty: user?.specialization,
          notes: notes.trim(),
          status: "completed",
        });
      }

      await createDoctorReport({
        appointmentId: appointment._id,
        recommendation: recommendation.trim(),
        urgency: reportUrgency,
      });

      toast({ title: "Consultation ended", description: "Your recommendation was sent to the admin team." });
    } catch (error) {
      toast({ title: "Couldn't finalize appointment", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      navigate("/doctor-dashboard");
    }
  };

  const handleAddPrescription = async () => {
    if (!appointment || !prescriptionForm.medication) return;
    setIsSubmittingRx(true);
    try {
      await createPrescription({
        patientId: appointment.patient._id,
        familyMemberId: appointment.familyMember?._id,
        medication: prescriptionForm.medication,
        dosage: prescriptionForm.dosage || undefined,
        instructions: prescriptionForm.instructions || undefined,
      });
      toast({ title: "Prescription added" });
      setIsPrescriptionOpen(false);
      setPrescriptionForm({ medication: "", dosage: "", instructions: "" });
    } catch (error) {
      toast({ title: "Couldn't add prescription", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsSubmittingRx(false);
    }
  };

  if (!appointmentId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <p className="text-gray-600 mb-2">No appointment specified.</p>
          <Link to="/" className="text-blue-600 hover:underline">Go home</Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <p className="text-gray-600">Appointment not found or you don't have access to it.</p>
      </div>
    );
  }

  const otherPartyName = isDoctor
    ? (appointment.familyMember ? appointment.familyMember.name : `${appointment.patient.firstName} ${appointment.patient.lastName}`)
    : `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`;
  const otherPartySubtitle = isDoctor
    ? (appointment.familyMember ? appointment.familyMember.relationship : 'Patient')
    : appointment.doctor.specialization;
  const otherPartyAvatar = isDoctor ? appointment.patient.avatar : appointment.doctor.avatar;

  const recordsHref = isDoctor
    ? `/medical-records?patientId=${appointment.patient._id}${appointment.familyMember ? `&familyMemberId=${appointment.familyMember._id}` : ''}`
    : `/medical-records${appointment.familyMember ? `?familyMemberId=${appointment.familyMember._id}` : ''}`;

  // Chat consultations reuse the real chat panel wired to this appointment.
  if (typeParam === 'chat') {
    return (
      <ChatConsultation
        conversationId={appointment._id}
        conversationModel="Appointment"
        otherPartyName={otherPartyName}
        otherPartySubtitle={otherPartySubtitle}
        otherPartyAvatar={otherPartyAvatar}
        backTo={isDoctor ? "/doctor-dashboard" : "/patient-dashboard"}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to={isDoctor ? "/doctor-dashboard" : "/patient-dashboard"}>
              <Button variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center space-x-2 bg-black/50 rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-white text-sm font-medium">{formatDuration(callDuration)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge
              variant="outline"
              className={peerConnected ? "bg-green-500/20 border-green-500 text-green-300" : "bg-yellow-500/20 border-yellow-500 text-yellow-300"}
            >
              {peerConnected ? "Connected" : "Waiting for other participant…"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex h-screen">
        <div className="flex-1 relative">
          <div className="w-full h-full bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            {!peerConnected && (
              <div className="absolute text-center">
                <Avatar className="w-32 h-32 mx-auto mb-4">
                  <AvatarImage src={otherPartyAvatar} />
                  <AvatarFallback className="text-2xl">
                    {otherPartyName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold text-white mb-2">{otherPartyName}</h2>
                <p className="text-blue-200">{otherPartySubtitle}</p>
              </div>
            )}
          </div>

          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute top-20 right-4 w-64 h-48 bg-gray-800 rounded-lg border-2 border-white/20 overflow-hidden">
            {isVideoOn ? (
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center">
                <div className="text-center">
                  <VideoOff className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Camera Off</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-lg">Consultation Notes</h3>
          </div>

          <div className="p-4 border-b border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{isDoctor ? 'Patient:' : 'Doctor:'}</span>
                <span className="text-sm font-medium">{otherPartyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Type:</span>
                <span className="text-sm font-medium">{appointment.appointmentType}</span>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-gray-200">
            <Link to={recordsHref}>
              <Button variant="outline" size="sm" className="w-full text-xs">
                <FileText className="w-3 h-3 mr-1" />
                View Records
              </Button>
            </Link>
          </div>

          {isDoctor ? (
            <>
              <div className="flex-1 p-4">
                <textarea
                  className="w-full h-full resize-none border border-gray-300 rounded-lg p-3 text-sm"
                  placeholder="Add consultation notes here. They'll be saved to the patient's record when you end the call."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="p-4 border-t border-gray-200">
                <Dialog open={isPrescriptionOpen} onOpenChange={setIsPrescriptionOpen}>
                  <Button className="w-full" size="sm" onClick={() => setIsPrescriptionOpen(true)}>
                    Add Prescription
                  </Button>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Prescription</DialogTitle>
                      <DialogDescription>Prescribe medication for {otherPartyName}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Medication</Label>
                        <Input
                          value={prescriptionForm.medication}
                          onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medication: e.target.value })}
                          placeholder="e.g. Amoxicillin 500mg"
                        />
                      </div>
                      <div>
                        <Label>Dosage</Label>
                        <Input
                          value={prescriptionForm.dosage}
                          onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })}
                          placeholder="e.g. Twice daily"
                        />
                      </div>
                      <div>
                        <Label>Instructions</Label>
                        <Textarea
                          value={prescriptionForm.instructions}
                          onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button variant="outline" onClick={() => setIsPrescriptionOpen(false)} disabled={isSubmittingRx}>Cancel</Button>
                      <Button onClick={handleAddPrescription} disabled={isSubmittingRx || !prescriptionForm.medication}>
                        {isSubmittingRx && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Opened via the red hang-up button below, not a visible trigger here */}
              <Dialog open={isEndDialogOpen} onOpenChange={(open) => !isEnding && setIsEndDialogOpen(open)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                      End Consultation
                    </DialogTitle>
                    <DialogDescription>
                      Send a private recommendation to the admin team before ending this consultation with{" "}
                      {otherPartyName}. This is separate from the patient's medical record.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Recommendation for admin (required)</Label>
                      <Textarea
                        value={recommendation}
                        onChange={(e) => setRecommendation(e.target.value)}
                        placeholder="e.g. Patient needs urgent in-person follow-up; suspected platform misuse; general note on how this consultation went..."
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">Urgency</Label>
                      <RadioGroup value={reportUrgency} onValueChange={(v) => setReportUrgency(v as typeof reportUrgency)} className="flex space-x-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="low" id="urgency-low" />
                          <Label htmlFor="urgency-low" className="font-normal">Low</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="medium" id="urgency-medium" />
                          <Label htmlFor="urgency-medium" className="font-normal">Medium</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="high" id="urgency-high" />
                          <Label htmlFor="urgency-high" className="font-normal">High</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => setIsEndDialogOpen(false)} disabled={isEnding}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleConfirmEndConsultation}
                      disabled={isEnding || !recommendation.trim()}
                    >
                      {isEnding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      End Consultation
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <div className="flex-1 p-4">
              <p className="text-sm text-gray-500">
                Your doctor may add consultation notes and prescriptions during this call. You'll find them in your Medical Records afterward.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Call Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center space-x-4 bg-white/20 backdrop-blur-sm rounded-full px-6 py-4">
          <Button
            variant="outline"
            size="lg"
            className={`rounded-full w-14 h-14 ${isAudioOn ? 'bg-white/20 border-white/30 text-white hover:bg-white/30' : 'bg-red-500 border-red-500 text-white hover:bg-red-600'}`}
            onClick={toggleAudio}
          >
            {isAudioOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>

          <Button
            variant="outline"
            size="lg"
            className={`rounded-full w-14 h-14 ${isVideoOn ? 'bg-white/20 border-white/30 text-white hover:bg-white/30' : 'bg-red-500 border-red-500 text-white hover:bg-red-600'}`}
            onClick={toggleVideo}
          >
            {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>

          <Button
            variant="destructive"
            size="lg"
            className="rounded-full w-14 h-14"
            onClick={handleEndCallClick}
            disabled={isEnding}
          >
            {isEnding ? <Loader2 className="w-6 h-6 animate-spin" /> : <Phone className="w-6 h-6" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
