import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  SYMPTOM_OPTIONS,
  CONDITION_OPTIONS,
  DURATION_OPTIONS,
  PREGNANCY_OPTIONS,
  type QuestionnaireDraft,
} from "@/lib/questionnaire";

interface IntakeQuestionnaireFormProps {
  value: QuestionnaireDraft;
  onChange: (next: QuestionnaireDraft) => void;
  disabled?: boolean;
  // Used to keep element ids unique if the form appears twice on a page
  idPrefix?: string;
}

const NONE_OPTION = "None of the above";

const Required = () => <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>;

const IntakeQuestionnaireForm = ({ value, onChange, disabled, idPrefix = "iq" }: IntakeQuestionnaireFormProps) => {
  const set = <K extends keyof QuestionnaireDraft>(key: K, v: QuestionnaireDraft[K]) =>
    onChange({ ...value, [key]: v });

  const toggle = (list: string[], item: string) =>
    list.includes(item) ? list.filter((i) => i !== item) : [...list, item];

  // "None of the above" is exclusive with the specific conditions
  const toggleCondition = (condition: string) => {
    if (condition === NONE_OPTION) {
      set("medicalConditions", value.medicalConditions.includes(NONE_OPTION) ? [] : [NONE_OPTION]);
    } else {
      set("medicalConditions", toggle(value.medicalConditions.filter((c) => c !== NONE_OPTION), condition));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor={`${idPrefix}-complaint`}>
          What is your main concern today?<Required />
        </Label>
        <Textarea
          id={`${idPrefix}-complaint`}
          className="mt-2 min-h-[80px]"
          placeholder="e.g. Persistent dry cough and chest tightness"
          maxLength={500}
          value={value.chiefComplaint}
          onChange={(e) => set("chiefComplaint", e.target.value)}
          disabled={disabled}
        />
      </div>

      <div>
        <Label>Which symptoms are you experiencing?</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {SYMPTOM_OPTIONS.map((symptom) => {
            const id = `${idPrefix}-symptom-${symptom}`;
            return (
              <div key={symptom} className="flex items-center space-x-2">
                <Checkbox
                  id={id}
                  checked={value.symptoms.includes(symptom)}
                  onCheckedChange={() => set("symptoms", toggle(value.symptoms, symptom))}
                  disabled={disabled}
                />
                <Label htmlFor={id} className="font-normal cursor-pointer">{symptom}</Label>
              </div>
            );
          })}
        </div>
        <Input
          className="mt-3"
          placeholder="Any other symptoms? (optional)"
          maxLength={500}
          value={value.otherSymptoms}
          onChange={(e) => set("otherSymptoms", e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>
            How long have you had these symptoms?<Required />
          </Label>
          <Select
            value={value.symptomDuration}
            onValueChange={(v) => set("symptomDuration", v as QuestionnaireDraft["symptomDuration"])}
            disabled={disabled}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((d) => (
                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>
          How severe are your symptoms? (1 = very mild, 10 = worst imaginable)<Required />
        </Label>
        <div className="flex flex-wrap gap-2 mt-2" role="radiogroup" aria-label="Symptom severity">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <Button
              key={n}
              type="button"
              size="sm"
              role="radio"
              aria-checked={value.severity === n}
              variant={value.severity === n ? "default" : "outline"}
              className="w-10 h-10 p-0"
              onClick={() => set("severity", n)}
              disabled={disabled}
            >
              {n}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label>Do you have any existing medical conditions?</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {CONDITION_OPTIONS.map((condition) => {
            const id = `${idPrefix}-condition-${condition}`;
            return (
              <div key={condition} className="flex items-center space-x-2">
                <Checkbox
                  id={id}
                  checked={value.medicalConditions.includes(condition)}
                  onCheckedChange={() => toggleCondition(condition)}
                  disabled={disabled}
                />
                <Label htmlFor={id} className="font-normal cursor-pointer">{condition}</Label>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <Label htmlFor={`${idPrefix}-meds`}>Medications you currently take</Label>
        <Textarea
          id={`${idPrefix}-meds`}
          className="mt-2"
          placeholder="Name and dose, or write 'None'"
          maxLength={500}
          value={value.currentMedications}
          onChange={(e) => set("currentMedications", e.target.value)}
          disabled={disabled}
        />
      </div>

      <div>
        <Label htmlFor={`${idPrefix}-allergies`}>Known allergies</Label>
        <Input
          id={`${idPrefix}-allergies`}
          className="mt-2"
          placeholder="Medication, food or other allergies, or write 'None'"
          maxLength={500}
          value={value.allergies}
          onChange={(e) => set("allergies", e.target.value)}
          disabled={disabled}
        />
      </div>

      <div>
        <Label>Is the patient pregnant?</Label>
        <RadioGroup
          className="flex flex-wrap gap-4 mt-2"
          value={value.isPregnant}
          onValueChange={(v) => set("isPregnant", v as QuestionnaireDraft["isPregnant"])}
          disabled={disabled}
        >
          {PREGNANCY_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center space-x-2">
              <RadioGroupItem value={opt.value} id={`${idPrefix}-preg-${opt.value}`} />
              <Label htmlFor={`${idPrefix}-preg-${opt.value}`} className="font-normal cursor-pointer">
                {opt.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div>
        <Label htmlFor={`${idPrefix}-treatment`}>Anything you've already tried for this?</Label>
        <Textarea
          id={`${idPrefix}-treatment`}
          className="mt-2"
          placeholder="Medication, home remedies, or previous doctor visits (optional)"
          maxLength={500}
          value={value.previousTreatment}
          onChange={(e) => set("previousTreatment", e.target.value)}
          disabled={disabled}
        />
      </div>

      <div>
        <Label htmlFor={`${idPrefix}-additional`}>Anything else the doctor should know?</Label>
        <Textarea
          id={`${idPrefix}-additional`}
          className="mt-2"
          maxLength={1000}
          value={value.additionalInfo}
          onChange={(e) => set("additionalInfo", e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="flex items-start space-x-2 bg-secondary/50 p-3 rounded-lg">
        <Checkbox
          id={`${idPrefix}-confirm`}
          className="mt-0.5"
          checked={value.confirmedAccurate}
          onCheckedChange={(checked) => set("confirmedAccurate", checked === true)}
          disabled={disabled}
        />
        <Label htmlFor={`${idPrefix}-confirm`} className="font-normal cursor-pointer leading-snug">
          I confirm the information above is accurate to the best of my knowledge.<Required />
        </Label>
      </div>
    </div>
  );
};

export default IntakeQuestionnaireForm;
