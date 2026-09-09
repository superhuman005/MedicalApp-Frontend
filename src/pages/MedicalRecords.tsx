import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Download, Search, Calendar, Pill, Activity, ArrowLeft, Loader2, Plus } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/services/api";
import { getUserById } from "@/services/users";
import { getFamilyMembers } from "@/services/familyMembers";
import {
  getConsultations,
  getPrescriptions,
  createPrescription,
  getVitals,
  createVital,
  getLabResults,
  createLabResult,
} from "@/services/medicalRecords";
import type { FamilyMember, ConsultationRecord, Prescription, VitalSign, LabResult, User } from "@/types";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");

const MedicalRecords = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const isDoctor = user?.role === 'doctor';

  const familyMemberIdParam = searchParams.get('familyMemberId');
  const patientIdParam = searchParams.get('patientId');

  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [ownFamilyMembers, setOwnFamilyMembers] = useState<FamilyMember[]>([]);
  const [targetPatient, setTargetPatient] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [displayMeta, setDisplayMeta] = useState("");

  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [vitals, setVitals] = useState<VitalSign[]>([]);
  const [labs, setLabs] = useState<LabResult[]>([]);

  const [isVitalDialogOpen, setIsVitalDialogOpen] = useState(false);
  const [isPrescriptionDialogOpen, setIsPrescriptionDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vitalForm, setVitalForm] = useState({ bloodPressure: "", heartRate: "", temperature: "", weight: "", height: "" });
  const [prescriptionForm, setPrescriptionForm] = useState({ medication: "", dosage: "", instructions: "", refills: "0" });

  // Scope used for every records fetch: patients scope by familyMemberId (their
  // own account owns the records); doctors scope by the target patient's userId.
  const scope = isDoctor
    ? { patientId: patientIdParam || undefined }
    : { familyMemberId: familyMemberIdParam || undefined };

  const loadRecords = useCallback(async () => {
    if (isDoctor && !patientIdParam) return;
    try {
      const [c, p, v, l] = await Promise.all([
        getConsultations(scope),
        getPrescriptions(scope),
        getVitals(scope),
        getLabResults(scope),
      ]);
      setConsultations(c);
      setPrescriptions(p);
      setVitals(v);
      setLabs(l);
    } catch (error) {
      toast({ title: "Couldn't load records", description: getErrorMessage(error), variant: "destructive" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDoctor, patientIdParam, familyMemberIdParam, toast]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        if (isDoctor) {
          if (patientIdParam) {
            const patientUser = await getUserById(patientIdParam);
            setTargetPatient(patientUser);
            setDisplayName(`${patientUser.firstName} ${patientUser.lastName}`);
            setDisplayMeta(patientUser.email);
          }
        } else {
          const members = await getFamilyMembers();
          setOwnFamilyMembers(members);
          const target = familyMemberIdParam
            ? members.find((m) => m._id === familyMemberIdParam)
            : members.find((m) => m.isSelf);
          if (target) {
            setDisplayName(target.name);
            setDisplayMeta(`${target.relationship}${target.age ? `, ${target.age} years old` : ''}`);
          }
        }
        await loadRecords();
      } catch (error) {
        toast({ title: "Couldn't load patient", description: getErrorMessage(error), variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyMemberIdParam, patientIdParam, isDoctor]);

  const filteredConsultations = consultations.filter((c) =>
    (c.diagnosis || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${c.doctor.firstName} ${c.doctor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogVital = async () => {
    setIsSubmitting(true);
    try {
      await createVital({
        patientId: isDoctor ? patientIdParam || undefined : undefined,
        familyMemberId: isDoctor ? searchParams.get('familyMemberId') || undefined : (familyMemberIdParam || undefined),
        bloodPressure: vitalForm.bloodPressure || undefined,
        heartRate: vitalForm.heartRate || undefined,
        temperature: vitalForm.temperature || undefined,
        weight: vitalForm.weight || undefined,
        height: vitalForm.height || undefined,
      });
      toast({ title: "Vitals logged" });
      setIsVitalDialogOpen(false);
      setVitalForm({ bloodPressure: "", heartRate: "", temperature: "", weight: "", height: "" });
      await loadRecords();
    } catch (error) {
      toast({ title: "Couldn't log vitals", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPrescription = async () => {
    if (!isDoctor || !patientIdParam || !prescriptionForm.medication) return;
    setIsSubmitting(true);
    try {
      await createPrescription({
        patientId: patientIdParam,
        familyMemberId: searchParams.get('familyMemberId') || undefined,
        medication: prescriptionForm.medication,
        dosage: prescriptionForm.dosage || undefined,
        instructions: prescriptionForm.instructions || undefined,
        refills: Number(prescriptionForm.refills) || 0,
      });
      toast({ title: "Prescription added" });
      setIsPrescriptionDialogOpen(false);
      setPrescriptionForm({ medication: "", dosage: "", instructions: "", refills: "0" });
      await loadRecords();
    } catch (error) {
      toast({ title: "Couldn't add prescription", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const backLink = isDoctor ? "/doctor-dashboard" : "/patient-dashboard";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isDoctor && !patientIdParam) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600">No patient selected. Open records from a patient's appointment or record list.</p>
          <Link to={backLink} className="text-blue-600 hover:underline mt-2 inline-block">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to={backLink} className="flex items-center mr-4">
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span>Back to Dashboard</span>
              </Link>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">Medical Records</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Patient Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">{displayName}</h3>
                <p className="text-gray-600">{displayMeta}</p>
              </div>
              <div className="flex gap-2">
                <Dialog open={isVitalDialogOpen} onOpenChange={setIsVitalDialogOpen}>
                  <Button variant="outline" size="sm" onClick={() => setIsVitalDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" /> Log Vitals
                  </Button>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Log Vital Signs</DialogTitle>
                      <DialogDescription>Record current vitals for {displayName}</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Blood Pressure</Label>
                        <Input placeholder="120/80" value={vitalForm.bloodPressure} onChange={(e) => setVitalForm({ ...vitalForm, bloodPressure: e.target.value })} />
                      </div>
                      <div>
                        <Label>Heart Rate (bpm)</Label>
                        <Input placeholder="72" value={vitalForm.heartRate} onChange={(e) => setVitalForm({ ...vitalForm, heartRate: e.target.value })} />
                      </div>
                      <div>
                        <Label>Temperature</Label>
                        <Input placeholder="98.6°F" value={vitalForm.temperature} onChange={(e) => setVitalForm({ ...vitalForm, temperature: e.target.value })} />
                      </div>
                      <div>
                        <Label>Weight</Label>
                        <Input placeholder="175 lbs" value={vitalForm.weight} onChange={(e) => setVitalForm({ ...vitalForm, weight: e.target.value })} />
                      </div>
                      <div>
                        <Label>Height</Label>
                        <Input placeholder="5'10&quot;" value={vitalForm.height} onChange={(e) => setVitalForm({ ...vitalForm, height: e.target.value })} />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button variant="outline" onClick={() => setIsVitalDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
                      <Button onClick={handleLogVital} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {isDoctor && (
                  <Dialog open={isPrescriptionDialogOpen} onOpenChange={setIsPrescriptionDialogOpen}>
                    <Button size="sm" onClick={() => setIsPrescriptionDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-1" /> Add Prescription
                    </Button>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Prescription</DialogTitle>
                        <DialogDescription>Prescribe medication for {displayName}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Medication</Label>
                          <Input value={prescriptionForm.medication} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medication: e.target.value })} placeholder="e.g. Amoxicillin 500mg" />
                        </div>
                        <div>
                          <Label>Dosage</Label>
                          <Input value={prescriptionForm.dosage} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })} placeholder="e.g. Twice daily" />
                        </div>
                        <div>
                          <Label>Instructions</Label>
                          <Textarea value={prescriptionForm.instructions} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })} />
                        </div>
                        <div>
                          <Label>Refills</Label>
                          <Input type="number" min={0} value={prescriptionForm.refills} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, refills: e.target.value })} />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="outline" onClick={() => setIsPrescriptionDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
                        <Button onClick={handleAddPrescription} disabled={isSubmitting || !prescriptionForm.medication}>
                          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Save
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search consultations by diagnosis or doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Records Tabs */}
        <Tabs defaultValue="consultations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="consultations">Consultations</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="vitals">Vital Signs</TabsTrigger>
            <TabsTrigger value="labs">Lab Results</TabsTrigger>
          </TabsList>

          <TabsContent value="consultations">
            {filteredConsultations.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-12">No consultation records yet.</p>
            ) : (
              <div className="space-y-4">
                {filteredConsultations.map((consultation) => (
                  <Card key={consultation._id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{consultation.diagnosis || 'Consultation'}</CardTitle>
                          <CardDescription>
                            Dr. {consultation.doctor.firstName} {consultation.doctor.lastName} • {consultation.specialty || consultation.doctor.specialization}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-sm text-gray-500 mb-1">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(consultation.date).toLocaleDateString()}
                          </div>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            {consultation.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    {(consultation.notes || consultation.prescription) && (
                      <CardContent>
                        <div className="space-y-3">
                          {consultation.notes && (
                            <div>
                              <h4 className="font-medium text-sm text-gray-900">Notes:</h4>
                              <p className="text-sm text-gray-600">{consultation.notes}</p>
                            </div>
                          )}
                          {consultation.prescription && (
                            <div>
                              <h4 className="font-medium text-sm text-gray-900">Prescription:</h4>
                              <p className="text-sm text-gray-600">{consultation.prescription}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="prescriptions">
            {prescriptions.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-12">No prescriptions on file.</p>
            ) : (
              <div className="space-y-4">
                {prescriptions.map((prescription) => (
                  <Card key={prescription._id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-3">
                          <Pill className="w-5 h-5 text-blue-600 mt-1" />
                          <div>
                            <h3 className="font-semibold text-lg">{prescription.medication}</h3>
                            <p className="text-gray-600">{prescription.dosage}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Prescribed by Dr. {prescription.prescribedBy.firstName} {prescription.prescribedBy.lastName} on {new Date(prescription.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={prescription.status === 'active' ? 'default' : 'secondary'}
                            className={prescription.status === 'active' ? 'bg-green-500' : ''}
                          >
                            {prescription.status}
                          </Badge>
                          <p className="text-sm text-gray-500 mt-1">
                            {prescription.refills} refill{prescription.refills === 1 ? '' : 's'} remaining
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="vitals">
            {vitals.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-12">No vitals recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {vitals.map((vital) => (
                  <Card key={vital._id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <Activity className="w-5 h-5 text-red-600" />
                          <h3 className="font-semibold text-lg">Vital Signs</h3>
                        </div>
                        <div className="text-sm text-gray-500">{new Date(vital.date).toLocaleDateString()}</div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{vital.bloodPressure || '—'}</div>
                          <div className="text-sm text-gray-600">Blood Pressure</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{vital.heartRate || '—'}</div>
                          <div className="text-sm text-gray-600">Heart Rate (bpm)</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{vital.temperature || '—'}</div>
                          <div className="text-sm text-gray-600">Temperature</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{vital.weight || '—'}</div>
                          <div className="text-sm text-gray-600">Weight</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-indigo-600">{vital.height || '—'}</div>
                          <div className="text-sm text-gray-600">Height</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="labs">
            {labs.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-12">No lab results on file.</p>
            ) : (
              <div className="space-y-4">
                {labs.map((lab) => (
                  <Card key={lab._id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{lab.test}</h3>
                          <p className="text-gray-600 mt-1">{lab.results}</p>
                          <p className="text-sm text-gray-500 mt-2">
                            {lab.orderedBy ? `Ordered by Dr. ${lab.orderedBy.firstName} ${lab.orderedBy.lastName} on ` : ''}
                            {new Date(lab.date).toLocaleDateString()}
                          </p>
                        </div>
                        {lab.fileUrl && (
                          <a href={`${API_ORIGIN}${lab.fileUrl}`} target="_blank" rel="noreferrer">
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MedicalRecords;
