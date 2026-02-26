
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Users, RefreshCw, Clock, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  rating: number;
  experience: string;
  avatar: string;
  status: 'online' | 'busy' | 'offline';
  bio?: string;
  consultationFee?: number;
}

interface DoctorListProps {
  onStartVideoCall: (doctor: Doctor) => void;
  onStartChat: (doctor: Doctor) => void;
  selectedPatient: any;
  onSelectPatient?: () => void;
}

const DoctorList = ({ selectedPatient, onSelectPatient }: DoctorListProps) => {
  const [consultationType, setConsultationType] = useState<'video' | 'chat' | null>(null);
  const [urgencyLevel, setUrgencyLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [requestMessage, setRequestMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmitRequest = async () => {
    if (!selectedPatient || !consultationType) return;

    setIsSubmitting(true);
    
    // Simulate API call to notify doctors
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Consultation Request Sent",
      description: `A ${consultationType} consultation request has been sent to available doctors. You will be notified when a doctor accepts your request.`,
    });

    // Reset form
    setConsultationType(null);
    setRequestMessage('');
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Consultation</CardTitle>
        <CardDescription>Send a consultation request to available doctors</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {!selectedPatient && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="text-center py-6">
                <Users className="w-12 h-12 mx-auto text-blue-600 mb-3" />
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Select Patient First</h3>
                <p className="text-blue-700 mb-4">Please choose who this consultation is for to continue</p>
                <Button 
                  onClick={onSelectPatient}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Select Patient
                </Button>
              </CardContent>
            </Card>
          )}

          {selectedPatient && (
            <>
              <Card className="border-green-200 bg-green-50">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={selectedPatient.avatar} />
                        <AvatarFallback>
                          {selectedPatient.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-green-900">Consultation for: {selectedPatient.name}</p>
                        <p className="text-sm text-green-700 capitalize">{selectedPatient.relationship}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={onSelectPatient}
                      variant="outline"
                      size="sm"
                      className="border-green-300 text-green-700 hover:bg-green-100"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Change Patient
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Consultation Type</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={consultationType === 'video' ? 'default' : 'outline'}
                      onClick={() => setConsultationType('video')}
                      className="h-16 flex flex-col space-y-1"
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span>Video Call</span>
                    </Button>
                    <Button
                      variant={consultationType === 'chat' ? 'default' : 'outline'}
                      onClick={() => setConsultationType('chat')}
                      className="h-16 flex flex-col space-y-1"
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span>Chat</span>
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Urgency Level</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant={urgencyLevel === 'low' ? 'default' : 'outline'}
                      onClick={() => setUrgencyLevel('low')}
                      className="h-12"
                    >
                      Low
                    </Button>
                    <Button
                      variant={urgencyLevel === 'medium' ? 'default' : 'outline'}
                      onClick={() => setUrgencyLevel('medium')}
                      className="h-12"
                    >
                      Medium
                    </Button>
                    <Button
                      variant={urgencyLevel === 'high' ? 'default' : 'outline'}
                      onClick={() => setUrgencyLevel('high')}
                      className="h-12"
                    >
                      High
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Describe Your Concern (Optional)</h3>
                  <Textarea
                    placeholder="Please describe your symptoms or what you'd like to discuss with the doctor..."
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <Button
                  onClick={handleSubmitRequest}
                  disabled={!consultationType || isSubmitting}
                  className="w-full h-12 text-lg"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-5 h-5 mr-2 animate-spin" />
                      Sending Request...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send Consultation Request
                    </>
                  )}
                </Button>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    What happens next?
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Your request will be sent to available doctors</li>
                    <li>• You'll receive a notification when a doctor accepts</li>
                    <li>• The consultation will begin once matched</li>
                    <li>• Expected wait time: 5-15 minutes</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DoctorList;
