import { Lock } from 'lucide-react';

interface LockedFeatureProps {
  message: string;
  title?: string;
}

export function LockedFeature({ message, title }: LockedFeatureProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-muted-foreground" />
        </div>
        {title && (
          <h2 className="text-2xl font-bold text-foreground mb-3">{title}</h2>
        )}
        <p className="text-muted-foreground text-lg leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
