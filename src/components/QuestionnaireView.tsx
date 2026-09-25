import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClipboardList, AlertTriangle } from "lucide-react";
import { durationLabel, pregnancyLabel } from "@/lib/questionnaire";
import type { Questionnaire } from "@/types";

const severityClass = (severity: number) => {
  if (severity >= 8) return "bg-red-100 text-red-800 border-red-200";
  if (severity >= 5) return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-emerald-100 text-emerald-800 border-emerald-200";
};

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <div className="text-sm mt-1">{children}</div>
  </div>
);

const Tags = ({ items }: { items: string[] }) =>
  items.length === 0 ? (
    <span className="text-muted-foreground">None reported</span>
  ) : (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Badge key={item} variant="secondary">{item}</Badge>
      ))}
    </div>
  );

// Full read-only rendering of a submitted questionnaire.
export const QuestionnaireView = ({ questionnaire }: { questionnaire: Questionnaire }) => {
  const q = questionnaire;
  return (
    <div className="space-y-4">
      <Row label="Main concern">
        <p className="whitespace-pre-wrap">{q.chiefComplaint}</p>
      </Row>

      <div className="flex flex-wrap gap-6">
        <Row label="Severity">
          <Badge className={severityClass(q.severity)}>{q.severity} / 10</Badge>
        </Row>
        <Row label="Duration">{durationLabel(q.symptomDuration)}</Row>
      </div>

      <Row label="Symptoms">
        <Tags items={q.symptoms} />
        {q.otherSymptoms && <p className="mt-2 text-muted-foreground">Other: {q.otherSymptoms}</p>}
      </Row>

      <Row label="Existing conditions">
        <Tags items={q.medicalConditions} />
      </Row>

      <Row label="Current medications">{q.currentMedications || <span className="text-muted-foreground">Not provided</span>}</Row>

      <Row label="Allergies">{q.allergies || <span className="text-muted-foreground">Not provided</span>}</Row>

      <Row label="Pregnant">{pregnancyLabel(q.isPregnant)}</Row>

      {q.previousTreatment && <Row label="Already tried">{q.previousTreatment}</Row>}
      {q.additionalInfo && <Row label="Additional information"><p className="whitespace-pre-wrap">{q.additionalInfo}</p></Row>}

      {q.submittedAt && (
        <p className="text-xs text-muted-foreground pt-2 border-t">
          Submitted {new Date(q.submittedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
};

// One-line summary shown on request/appointment cards so the doctor gets the
// gist at a glance before opening the full questionnaire.
export const QuestionnaireSummary = ({ questionnaire }: { questionnaire?: Questionnaire }) => {
  if (!questionnaire) return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      <Badge className={severityClass(questionnaire.severity)}>Severity {questionnaire.severity}/10</Badge>
      <span className="text-muted-foreground truncate max-w-[16rem]" title={questionnaire.chiefComplaint}>
        {questionnaire.chiefComplaint}
      </span>
    </div>
  );
};

interface QuestionnaireButtonProps {
  questionnaire?: Questionnaire;
  patientName: string;
  size?: "sm" | "default";
  className?: string;
}

// "View questionnaire" button that opens the answers in a dialog. If the
// patient never submitted one (older records) it renders a disabled state
// rather than hiding, so the doctor knows it's missing.
export const QuestionnaireButton = ({ questionnaire, patientName, size = "sm", className }: QuestionnaireButtonProps) => {
  const [open, setOpen] = useState(false);

  if (!questionnaire) {
    return (
      <Button variant="outline" size={size} disabled className={className}>
        <AlertTriangle className="w-4 h-4 mr-1" />
        No questionnaire
      </Button>
    );
  }

  return (
    <>
      <Button variant="outline" size={size} onClick={() => setOpen(true)} className={className}>
        <ClipboardList className="w-4 h-4 mr-1" />
        View Questionnaire
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Health Questionnaire</DialogTitle>
            <DialogDescription>Submitted by the patient for {patientName}</DialogDescription>
          </DialogHeader>
          <QuestionnaireView questionnaire={questionnaire} />
        </DialogContent>
      </Dialog>
    </>
  );
};
