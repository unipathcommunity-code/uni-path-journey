export interface CompetitionLevel {
  level: 'low' | 'medium' | 'high';
  labelUz: string;
  labelRu: string;
  labelEn: string;
  color: string; // tailwind classes
  bgColor: string;
}

export function getCompetitionLevel(successRate: string | null): CompetitionLevel | null {
  if (!successRate) return null;
  const num = parseInt(successRate.replace('%', ''), 10);
  if (isNaN(num)) return null;

  if (num >= 25) {
    return {
      level: 'low',
      labelUz: 'Past raqobat',
      labelRu: 'Низкая конкуренция',
      labelEn: 'Low competition',
      color: 'text-green-700 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    };
  } else if (num >= 10) {
    return {
      level: 'medium',
      labelUz: "O'rta raqobat",
      labelRu: 'Средняя конкуренция',
      labelEn: 'Medium competition',
      color: 'text-yellow-700 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
    };
  } else {
    return {
      level: 'high',
      labelUz: 'Yuqori raqobat',
      labelRu: 'Высокая конкуренция',
      labelEn: 'High competition',
      color: 'text-red-700 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    };
  }
}
