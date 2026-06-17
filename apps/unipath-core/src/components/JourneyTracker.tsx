import { CheckCircle2, Circle } from 'lucide-react';

interface Stage {
  key: string;
  label: string;
  completed: boolean;
  active: boolean;
}

interface JourneyTrackerProps {
  stages: Stage[];
}

export function JourneyTracker({ stages }: JourneyTrackerProps) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border" />
        <div className="space-y-4">
          {stages.map((stage, i) => (
            <div key={stage.key} className="flex items-center gap-4 relative">
              <div className="z-10">
                {stage.completed ? (
                  <CheckCircle2 className="w-8 h-8 text-primary fill-primary/20" />
                ) : stage.active ? (
                  <div className="w-8 h-8 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  </div>
                ) : (
                  <Circle className="w-8 h-8 text-muted-foreground/40" />
                )}
              </div>
              <span
                className={`text-sm font-medium ${
                  stage.completed
                    ? 'text-foreground'
                    : stage.active
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground'
                }`}
              >
                {stage.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
