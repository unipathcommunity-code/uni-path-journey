import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';
import { Check } from 'lucide-react';

export interface CountryCardData {
  id: string;
  name: string;
  name_uz?: string | null;
  name_ru?: string | null;
  flag?: string | null;
  image_url?: string | null;
  avg_tuition?: string | null;
}

interface CountryCardProps {
  country: CountryCardData;
  isSelected: boolean;
  onClick: () => void;
}

export function CountryCard({ country, isSelected, onClick }: CountryCardProps) {
  const { language } = useApp();
  const t = useTranslation(language);

  const countryName =
    language === 'uz'
      ? country.name_uz || country.name
      : language === 'ru'
      ? country.name_ru || country.name
      : country.name;

  return (
    <button
      onClick={onClick}
      className={`
        group relative w-full text-left rounded-2xl border-2 transition-all duration-300 overflow-hidden
        ${
          isSelected
            ? 'border-primary shadow-card-hover bg-primary/5'
            : 'border-border hover:border-primary/40 hover:shadow-card bg-card'
        }
      `}
    >
      <div className="relative p-6">
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-scale-in">
            <Check className="w-4 h-4 text-primary-foreground" />
          </div>
        )}

        {/* Flag */}
        <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
          {country.flag || '🌍'}
        </div>

        {/* Country name */}
        <h3 className="text-lg font-semibold text-foreground mb-2">{countryName}</h3>

        {/* Tuition info */}
        {country.avg_tuition && (
          <p className="text-sm text-muted-foreground">{country.avg_tuition}/yr</p>
        )}
      </div>
    </button>
  );
}
