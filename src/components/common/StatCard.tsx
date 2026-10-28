import type { FC } from 'react';
import type { CampusMetric } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  metric: CampusMetric;
  className?: string;
}

const colorSchemeMap = {
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    text: 'text-indigo-600 dark:text-indigo-300',
    border: 'border-indigo-100 dark:border-indigo-800/60',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-600 dark:text-emerald-300',
    border: 'border-emerald-100 dark:border-emerald-800/60',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-600 dark:text-amber-300',
    border: 'border-amber-100 dark:border-amber-800/60',
  },
  sky: {
    bg: 'bg-sky-50 dark:bg-sky-950/60',
    text: 'text-sky-600 dark:text-sky-300',
    border: 'border-sky-100 dark:border-sky-800/60',
  },
};

export const StatCard: FC<StatCardProps> = ({ metric, className }) => {
  const Icon = metric.icon;
  const theme = colorSchemeMap[metric.colorScheme] || colorSchemeMap.indigo;

  return (
    <Card hoverable className={cn('overflow-hidden', className)}>
      <CardContent className="p-5 flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 dark:text-dark-text-muted uppercase tracking-wider">
            {metric.label}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-dark-text-main">
              {metric.value}
            </span>
            {metric.change && (
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 gap-0.5">
                <TrendingUp size={12} />
                {metric.change}
              </span>
            )}
          </div>
        </div>

        <div className={cn('p-2.5 rounded-xl border', theme.bg, theme.text, theme.border)}>
          <Icon size={20} />
        </div>
      </CardContent>
    </Card>
  );
};
