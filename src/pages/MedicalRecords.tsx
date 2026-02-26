import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Search, Calendar, Pill, Activity, ArrowLeft } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

const MedicalRecords = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient');
  
  // Sample patients data (would come from props or context in real app)
  const patients = [
    { id: "1", name: "John Smith (You)", relationship: "self", age: 35 },
    { id: "2", name: "Emma Smith", relationship: "daughter", age: 8 },
    { id: "3", name: "Michael Smith", relationship: "son", age: 12 }
  ];
  
  const currentPatient = patients.find(p => p.id === patientId) || patients[0];

  // Sample data that would vary by patient
  const getPatientData = (patient: typeof patients[0]) => {
    const baseConsultations = [
      {
        id: 1,
        date: "2024-01-10",
        doctor: "Dr. Emily Davis",
        specialty: "General Practice",
        diagnosis: "Common Cold",
        prescription: "Rest and fluids, Acetaminophen as needed",
        notes: "Patient presented with mild cold symptoms. Recommended rest and over-the-counter medication.",
        status: "completed"
      },
      {
        id: 2,
        date: "2024-01-05",
        doctor: "Dr. Robert Wilson",
        specialty: "Orthopedic",
        diagnosis: "Muscle Strain",
        prescription: "Physical therapy, Anti-inflammatory medication",
        notes: "Lower back strain from exercise. Physical therapy recommended for 2 weeks.",
        status: "completed"
      }
    ];

    const basePrescriptions = [
      {
        id: 1,
        medication: "Lisinopril 10mg",
        dosage: "Once daily",
        prescribedBy: "Dr. Sarah Johnson",
        date: "2023-12-20",
        status: "active",
        refills: 3
      }
    ];

    const baseVitals = [
      {
        id: 1,
        date: "2024-01-10",
        bloodPressure: "120/80",
        heartRate: "72",
        temperature: "98.6°F",
        weight: "175 lbs",
        height: "5'10\""
      }
    ];

    const baseLabs = [
      {
        id: 1,
        date: "2023-12-15",
        test: "Complete Blood Count",
        results: "Normal",
        doctor: "Dr. Sarah Johnson",
        file: "CBC_Results_Dec2023.pdf"
      }
    ];

    // Customize data based on patient
    if (patient.relationship === "daughter" || patient.relationship === "son") {
      return {
        consultations: [
          {
            ...baseConsultations[0],
            doctor: "Dr. Emily Rodriguez",
            specialty: "Pediatrician",
            diagnosis: "Routine Check-up",
            prescription: "Vitamins as needed",
            notes: `${patient.name} had a routine pediatric check-up. All development milestones are normal.`
          }
        ],
        prescriptions: [
          {
            ...basePrescriptions[0],
            medication: "Children's Multivitamin",
            dosage: "Once daily with food",
            prescribedBy: "Dr. Emily Rodriguez"
          }
        ],
        vitals: [
          {
            ...baseVitals[0],
            bloodPressure: "95/60",
            heartRate: "88",
            weight: patient.age === 8 ? "55 lbs" : "85 lbs",
            height: patient.age === 8 ? "4'2\"" : "4'8\""
          }
        ],
        labs: [
          {
            ...baseLabs[0],
            test: "Pediatric Blood Panel",
            results: "All values within normal pediatric ranges",
            doctor: "Dr. Emily Rodriguez"
          }
        ]
      };
    }

    return {
      consultations: baseConsultations,
      prescriptions: basePrescriptions,
      vitals: baseVitals,
      labs: baseLabs
    };
  };

  const patientData = getPatientData(currentPatient);
  const { consultations, prescriptions, vitals, labs } = patientData;

  const filteredConsultations = consultations.filter(consultation =>
    consultation.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consultation.doctor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/patient-dashboard" className="flex items-center mr-4">
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
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Records
            </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900">{currentPatient.name}</h3>
                <p className="text-gray-600">Patient ID: #{currentPatient.id}2345</p>
                <p className="text-gray-600 capitalize">Relationship: {currentPatient.relationship}</p>
                {currentPatient.age && <p className="text-gray-600">Age: {currentPatient.age} years</p>}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Contact Information</h4>
                <p className="text-gray-600">{currentPatient.name.toLowerCase().replace(/\s+/g, '.')}@email.com</p>
                <p className="text-gray-600">(555) 123-4567</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Insurance</h4>
                <p className="text-gray-600">Blue Cross Blue Shield</p>
                <p className="text-gray-600">Policy: #ABC123456</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search medical records..."
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
            <div className="space-y-4">
              {filteredConsultations.map((consultation) => (
                <Card key={consultation.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{consultation.diagnosis}</CardTitle>
                        <CardDescription>
                          {consultation.doctor} • {consultation.specialty}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-sm text-gray-500 mb-1">
                          <Calendar className="w-4 h-4 mr-1" />
                          {consultation.date}
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          {consultation.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm text-gray-900">Notes:</h4>
                        <p className="text-sm text-gray-600">{consultation.notes}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-gray-900">Prescription:</h4>
                        <p className="text-sm text-gray-600">{consultation.prescription}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="prescriptions">
            <div className="space-y-4">
              {prescriptions.map((prescription) => (
                <Card key={prescription.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3">
                        <Pill className="w-5 h-5 text-blue-600 mt-1" />
                        <div>
                          <h3 className="font-semibold text-lg">{prescription.medication}</h3>
                          <p className="text-gray-600">{prescription.dosage}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Prescribed by {prescription.prescribedBy} on {prescription.date}
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
                          {prescription.refills} refills remaining
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="vitals">
            <div className="space-y-4">
              {vitals.map((vital) => (
                <Card key={vital.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-5 h-5 text-red-600" />
                        <h3 className="font-semibold text-lg">Vital Signs</h3>
                      </div>
                      <div className="text-sm text-gray-500">{vital.date}</div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{vital.bloodPressure}</div>
                        <div className="text-sm text-gray-600">Blood Pressure</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{vital.heartRate}</div>
                        <div className="text-sm text-gray-600">Heart Rate (bpm)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{vital.temperature}</div>
                        <div className="text-sm text-gray-600">Temperature</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{vital.weight}</div>
                        <div className="text-sm text-gray-600">Weight</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">{vital.height}</div>
                        <div className="text-sm text-gray-600">Height</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="labs">
            <div className="space-y-4">
              {labs.map((lab) => (
                <Card key={lab.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{lab.test}</h3>
                        <p className="text-gray-600 mt-1">{lab.results}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Ordered by {lab.doctor} on {lab.date}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MedicalRecords;
