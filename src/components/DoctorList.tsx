
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Users, RefreshCw, Clock, Send, Loader2 } from "lucide-react";
import IntakeQuestionnaireForm from "@/components/IntakeQuestionnaireForm";
import {
  emptyQuestionnaire,
  getQuestionnaireError,
  toQuestionnairePayload,
  type QuestionnaireDraft,
} from "@/lib/questionnaire";
import { useToast } from "@/hooks/use-toast";
import { createConsultationRequest } from "@/services/consultationRequests";
import { getErrorMessage } from "@/services/api";
import type { FamilyMember } from "@/types";

interface DoctorListProps {
  selectedPatient: FamilyMember | null;
  onSelectPatient?: () => void;
  onRequestSent?: () => void;
}

const DoctorList = ({ selectedPatient, onSelectPatient, onRequestSent }: DoctorListProps) => {
  const [consultationType, setConsultationType] = useState<'video' | 'chat' | null>(null);
  const [urgencyLevel, setUrgencyLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireDraft>(emptyQuestionnaire());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmitRequest = async () => {
    if (!selectedPatient || !consultationType) return;

    const problem = getQuestionnaireError(questionnaire);
    if (problem) {
      toast({ title: "Questionnaire incomplete", description: problem, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await createConsultationRequest({
        type: consultationType,
        urgency: urgencyLevel,
        message: questionnaire.chiefComplaint.trim(),
        questionnaire: toQuestionnairePayload(questionnaire),
        familyMemberId: selectedPatient._id,
      });

      toast({
        title: "Consultation Request Sent",
        description: `A ${consultationType} consultation request has been sent to available doctors. You will be notified when a doctor accepts your request.`,
      });

      setConsultationType(null);
      setQuestionnaire(emptyQuestionnaire());
      onRequestSent?.();
    } catch (error) {
      toast({
        title: "Couldn't send request",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="text-center py-6">
                <Users className="w-12 h-12 mx-auto text-primary mb-3" />
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">Select Patient First</h3>
                <p className="text-muted-foreground mb-4">Please choose who this consultation is for to continue</p>
                <Button 
                  onClick={onSelectPatient}
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
              <Card className="border-primary/20 bg-primary/5">
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
                        <p className="font-medium text-foreground">Consultation for: {selectedPatient.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{selectedPatient.relationship}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={onSelectPatient}
                      variant="outline"
                      size="sm"
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
                  <h3 className="text-lg font-semibold mb-1">Health Questionnaire</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    The doctor will read your answers before accepting, so please fill this in as fully as you can.
                  </p>
                  <IntakeQuestionnaireForm
                    idPrefix="request"
                    value={questionnaire}
                    onChange={setQuestionnaire}
                    disabled={isSubmitting}
                  />
                </div>

                <Button
                  onClick={handleSubmitRequest}
                  disabled={!consultationType || isSubmitting || getQuestionnaireError(questionnaire) !== null}
                  className="w-full h-12 text-lg"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending Request...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send Consultation Request
                    </>
                  )}
                </Button>
                {getQuestionnaireError(questionnaire) !== null && (
                  <p className="text-xs text-amber-600 text-center -mt-2">
                    Complete the health questionnaire to send your request.
                  </p>
                )}

                <div className="bg-secondary/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    What happens next?
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Your request and questionnaire will be sent to available doctors</li>
                    <li>• You'll receive a notification when a doctor accepts</li>
                    <li>• The consultation will begin once matched</li>
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
