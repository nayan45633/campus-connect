import type { FC, MouseEvent } from 'react';
import type { CampusCommunity, CommunityCategory } from '@/types';
import {
  Users,
  Check,
  Plus,
  ArrowRight,
  Code2,
  GraduationCap,
  Gamepad2,
  Palette,
  Briefcase,
  Compass,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CommunityCardProps {
  community: CampusCommunity;
  onSelect: (community: CampusCommunity) => void;
  onToggleJoin: (communityId: string) => void;
}

export const categoryIcons: Record<CommunityCategory, typeof Code2> = {
  Technology: Code2,
  Academics: GraduationCap,
  Gaming: Gamepad2,
  Arts: Palette,
  Entrepreneurship: Briefcase,
};

export const categoryBadgeVariants: Record<
  CommunityCategory,
  'indigo' | 'neutral' | 'success' | 'accent' | 'warning'
> = {
  Technology: 'indigo',
  Academics: 'neutral',
  Gaming: 'success',
  Arts: 'accent',
  Entrepreneurship: 'warning',
};

export const CommunityCard: FC<CommunityCardProps> = ({
  community,
  onSelect,
  onToggleJoin,
}) => {
  const CategoryIcon = categoryIcons[community.category] || Compass;

  const handleJoinClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onToggleJoin(community.id);
  };

  const coverGradient =
    community.coverGradient || 'from-indigo-600 via-indigo-700 to-indigo-900';

  return (
    <Card
      hoverable
      onClick={() => onSelect(community)}
      className="group relative flex flex-col justify-between overflow-hidden border-slate-200/90 dark:border-dark-border shadow-xs hover:border-indigo-300 dark:hover:border-indigo-500/60 transition-all cursor-pointer"
    >
      <div>
        {/* Top Cover Banner */}
        <div
          className={cn(
            'relative h-28 w-full bg-gradient-to-r p-4 flex items-start justify-between text-white overflow-hidden',
            coverGradient
          )}
        >
          {/* Subtle ambient lighting & pattern */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
          <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-xl" />

          {/* Category Badge on Cover */}
          <div className="relative z-10 flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="outline"
              className="bg-white/15 text-white border-white/20 text-xs font-semibold backdrop-blur-xs inline-flex items-center gap-1"
            >
              <CategoryIcon size={12} />
              <span>{community.category}</span>
            </Badge>

            {community.isJoined && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/25 text-emerald-100 border border-emerald-400/30">
                <Check size={11} />
                <span>Joined</span>
              </span>
            )}
          </div>

          {/* Members count chip */}
          <div className="relative z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/25 backdrop-blur-xs text-white text-xs font-medium border border-white/10">
            <Users size={12} />
            <span>{community.membersCount}</span>
          </div>
        </div>

        {/* Card Header with Overlapping Avatar */}
        <CardHeader className="px-4 sm:px-5 pt-0 pb-2 relative">
          {/* Avatar circle overlapping the cover */}
          <div className="-mt-7 mb-3 flex items-center justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-dark-card border-2 border-slate-200 dark:border-dark-border text-indigo-700 dark:text-indigo-400 font-extrabold text-lg shadow-sm">
              {community.avatarInitials}
            </div>

            {community.leadName && (
              <span className="text-[11px] text-slate-400 dark:text-dark-text-muted truncate max-w-[170px] text-right">
                Lead: <strong className="text-slate-700 dark:text-dark-text-main font-semibold">{community.leadName.split(' ')[0]}</strong>
              </span>
            )}
          </div>

          <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-dark-text-main group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 leading-snug">
            {community.name}
          </CardTitle>

          <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-dark-text-muted line-clamp-2 pt-1 leading-relaxed">
            {community.shortDescription || community.description}
          </CardDescription>
        </CardHeader>

        {/* Card Content: Meeting Info & Tags */}
        <CardContent className="px-4 sm:px-5 pb-4 space-y-3">
          {community.meetingSchedule && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-dark-text-muted truncate">
              <Calendar size={13} className="text-slate-400 dark:text-dark-text-subtle shrink-0" />
              <span className="truncate">{community.meetingSchedule}</span>
            </div>
          )}

          {community.tags && community.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {community.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-medium text-slate-600 dark:text-dark-text-muted bg-slate-100 dark:bg-dark-elevated px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-dark-border"
                >
                  #{tag}
                </span>
              ))}
              {community.tags.length > 3 && (
                <span className="text-[10px] text-slate-400 dark:text-dark-text-subtle self-center">
                  +{community.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </CardContent>
      </div>

      {/* Card Footer: View Details & Join / Leave action */}
      <CardFooter className="px-4 sm:px-5 py-3 border-t border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-surface/50 flex items-center justify-between">
        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline inline-flex items-center gap-1">
          <span>View Circle</span>
          <ArrowRight size={13} />
        </span>

        <Button
          type="button"
          variant={community.isJoined ? 'soft' : 'primary'}
          size="sm"
          onClick={handleJoinClick}
          className="h-8 px-3 text-xs font-semibold gap-1.5 cursor-pointer select-none"
        >
          {community.isJoined ? (
            <>
              <Check size={13} className="text-indigo-600 dark:text-indigo-400" />
              <span>Joined</span>
            </>
          ) : (
            <>
              <Plus size={13} />
              <span>Join</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
