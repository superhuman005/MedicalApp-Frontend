
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, MessageSquare, Video, User, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConsultationRequest {
  id: string;
  patientName: string;
  patientAge?: number;
  patientRelationship: string;
  type: 'video' | 'chat';
  urgency: 'low' | 'medium' | 'high';
  message?: string;
  requestedAt: string;
  timeAgo: string;
}

const ConsultationRequests = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ConsultationRequest[]>([
    {
      id: '1',
      patientName: 'John Smith',
      patientAge: 35,
      patientRelationship: 'self',
      type: 'video',
      urgency: 'medium',
      message: 'Having chest pain and shortness of breath. Need immediate consultation.',
      requestedAt: '2024-01-15T10:30:00Z',
      timeAgo: '2 minutes ago'
    },
    {
      id: '2',
      patientName: 'Emma Smith',
      patientAge: 8,
      patientRelationship: 'daughter',
      type: 'chat',
      urgency: 'low',
      message: 'Child has mild fever and cough for 2 days.',
      requestedAt: '2024-01-15T10:25:00Z',
      timeAgo: '7 minutes ago'
    },
    {
      id: '3',
      patientName: 'Michael Johnson',
      patientAge: 42,
      patientRelationship: 'self',
      type: 'video',
      urgency: 'high',
      message: 'Severe headache and dizziness. Very concerned.',
      requestedAt: '2024-01-15T10:20:00Z',
      timeAgo: '12 minutes ago'
    }
  ]);

  const handleAcceptRequest = (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (request) {
      toast({
        title: "Request Accepted",
        description: `Starting ${request.type} consultation with ${request.patientName}`,
      });
      setRequests(prev => prev.filter(r => r.id !== requestId));
    }
  };

  const handleDeclineRequest = (requestId: string) => {
    setRequests(prev => prev.filter(r => r.id !== requestId));
    toast({
      title: "Request Declined",
      description: "The consultation request has been declined.",
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consultation Requests</CardTitle>
        <CardDescription>
          {requests.length > 0 
            ? `${requests.length} patient${requests.length === 1 ? '' : 's'} waiting for consultation`
            : 'No pending consultation requests'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p>No consultation requests at the moment</p>
              <p className="text-sm">You'll be notified when patients request consultations</p>
            </div>
          ) : (
            requests.map((request) => (
              <Card key={request.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback>
                          {request.patientName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{request.patientName}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span className="capitalize">{request.patientRelationship}</span>
                          {request.patientAge && <span>• {request.patientAge} years old</span>}
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
                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                      <p className="text-sm text-gray-700">{request.message}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {request.timeAgo}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeclineRequest(request.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(request.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsultationRequests;
