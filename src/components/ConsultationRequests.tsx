
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, MessageSquare, Video, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  getConsultationRequests,
  acceptConsultationRequest,
  declineConsultationRequest,
} from "@/services/consultationRequests";
import { getErrorMessage } from "@/services/api";
import { getSocket } from "@/services/socket";
import type { ConsultationRequestItem } from "@/types";

const ConsultationRequests = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ConsultationRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actingOnId, setActingOnId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      const data = await getConsultationRequests({ status: "pending" });
      setRequests(data);
    } catch (error) {
      toast({
        title: "Couldn't load requests",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRequests();

    const socket = getSocket();
    if (!socket) return;

    const handleNewRequest = (request: ConsultationRequestItem) => {
      setRequests((prev) => (prev.some((r) => r._id === request._id) ? prev : [request, ...prev]));
    };

    socket.on("consultation-request:new", handleNewRequest);
    return () => {
      socket.off("consultation-request:new", handleNewRequest);
    };
  }, [loadRequests]);

  const handleAcceptRequest = async (request: ConsultationRequestItem) => {
    setActingOnId(request._id);
    try {
      const { appointment } = await acceptConsultationRequest(request._id);
      toast({
        title: "Request Accepted",
        description: `Starting ${request.type} consultation with ${request.patient.firstName} ${request.patient.lastName}`,
      });
      setRequests((prev) => prev.filter((r) => r._id !== request._id));
      navigate(`/video-call?appointmentId=${appointment._id}&type=${appointment.type}`);
    } catch (error) {
      toast({
        title: "Couldn't accept request",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setActingOnId(null);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    setActingOnId(requestId);
    try {
      await declineConsultationRequest(requestId);
      setRequests((prev) => prev.filter((r) => r._id !== requestId));
      toast({
        title: "Request Declined",
        description: "The consultation request has been declined.",
      });
    } catch (error) {
      toast({
        title: "Couldn't decline request",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setActingOnId(null);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-secondary text-secondary-foreground border-border';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consultation Requests</CardTitle>
        <CardDescription>
          {isLoading
            ? 'Loading requests…'
            : requests.length > 0
            ? `${requests.length} patient${requests.length === 1 ? '' : 's'} waiting for consultation`
            : 'No pending consultation requests'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p>No consultation requests at the moment</p>
              <p className="text-sm">You'll be notified when patients request consultations</p>
            </div>
          ) : (
            requests.map((request) => {
              const patientName = `${request.patient.firstName} ${request.patient.lastName}`;
              const displayName = request.familyMember ? request.familyMember.name : patientName;
              const relationship = request.familyMember?.relationship || 'self';
              const age = request.familyMember?.age;

              return (
                <Card key={request._id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src="/placeholder.svg" />
                          <AvatarFallback>
                            {displayName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{displayName}</h3>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span className="capitalize">{relationship}</span>
                            {age && <span>• {age} years old</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getUrgencyColor(request.urgency)}>
                          {request.urgency} priority
                        </Badge>
                        <Badge variant="outline" className="flex items-center space-x-1">
                          {request.type === 'video' ? (
                            <Video className="w-3 h-3" />
                          ) : (
                            <MessageSquare className="w-3 h-3" />
                          )}
                          <span>{request.type}</span>
                        </Badge>
                      </div>
                    </div>

                    {request.message && (
                      <div className="bg-secondary/50 p-3 rounded-lg mb-3">
                        <p className="text-sm text-foreground">{request.message}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        {request.timeAgo}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeclineRequest(request._id)}
                          disabled={actingOnId === request._id}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(request)}
                          disabled={actingOnId === request._id}
                          className="bg-primary hover:bg-primary/90"
                        >
                          {actingOnId === request._id ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-1" />
                          )}
                          Accept
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsultationRequests;
