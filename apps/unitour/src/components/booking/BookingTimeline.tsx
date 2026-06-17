import { CheckCircle, Circle, Clock, User, FileText, Plane, MapPin, Flag } from "lucide-react";
import { motion } from "framer-motion";

interface TimelineStep {
  id: string;
  step: string;
  title: string;
  description?: string;
  completed: boolean;
  completed_at?: string;
}

interface BookingTimelineProps {
  steps: TimelineStep[];
  managerName?: string;
  managerPhone?: string;
}

const defaultSteps: TimelineStep[] = [
  { id: "1", step: "reserved", title: "Joy band qilindi", description: "Deposit to'lovi qabul qilindi", completed: false },
  { id: "2", step: "manager_assigned", title: "Manager tayinlandi", description: "Sizning shaxsiy manageringiz", completed: false },
  { id: "3", step: "documents", title: "Hujjatlar jarayonda", description: "Pasport va hujjatlar tekshirilmoqda", completed: false },
  { id: "4", step: "visa", title: "Viza jarayoni", description: "Viza uchun ariza berildi", completed: false },
  { id: "5", step: "ticket", title: "Chipta band qilindi", description: "Aviachiptalar rasmiylashtirildi", completed: false },
  { id: "6", step: "flight", title: "Uchish sanasi", description: "Sayohatingiz boshlanadi", completed: false },
  { id: "7", step: "started", title: "Tur boshlandi", description: "Sayohatingizdan zavqlaning!", completed: false },
];

const stepIcons: Record<string, typeof CheckCircle> = {
  reserved: Flag,
  manager_assigned: User,
  documents: FileText,
  visa: FileText,
  ticket: Plane,
  flight: Plane,
  started: MapPin,
};

const BookingTimeline = ({ steps = defaultSteps, managerName, managerPhone }: BookingTimelineProps) => {
  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const Icon = stepIcons[step.step] || Circle;
        const isLast = index === steps.length - 1;

        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-3"
          >
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                step.completed
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}>
                {step.completed ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              {!isLast && (
                <div className={`w-0.5 h-12 ${step.completed ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>

            {/* Content */}
            <div className="pb-8">
              <p className={`text-sm font-semibold ${step.completed ? "text-foreground" : "text-muted-foreground"}`}>
                {step.title}
              </p>
              {step.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
              )}
              {step.completed_at && (
                <p className="text-xs text-primary mt-1">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {new Date(step.completed_at).toLocaleDateString("uz-UZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
              {step.step === "manager_assigned" && managerName && (
                <div className="mt-2 p-2 bg-primary/5 rounded-lg">
                  <p className="text-xs font-medium">{managerName}</p>
                  {managerPhone && <p className="text-xs text-muted-foreground">{managerPhone}</p>}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export { defaultSteps };
export default BookingTimeline;
