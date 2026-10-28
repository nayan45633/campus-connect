import { useEffect, type FC } from 'react';
import {
  X,
  Users,
  Calendar,
  MapPin,
  UserCheck,
  Check,
  Plus,
  Sparkles,
  Bell,
  Clock,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { computeInitials } from '@/hooks/useStudentProfile';
import { cn } from '@/lib/utils';

export interface ClubAnnouncement {
  id: string;
  title: string;
  date: string;
  content: string;
}

export interface CampusClub {
  id: string;
  name: string;
  category: string;
  badgeVariant: 'indigo' | 'success' | 'accent' | 'warning' | 'neutral';
  membersCount: number;
  description: string;
  fullDescription?: string;
  schedule: string;
  scheduleColor: string;
  coordinator?: {
    name: string;
    role: string;
    handle?: string;
    email?: string;
    avatarInitials?: string;
  };
  activities?: string[];
  recentAnnouncements?: ClubAnnouncement[];
  coverGradient?: string;
  location?: string;
}

interface ClubDetailsDialogProps {
  isOpen: boolean;
  club: CampusClub | null;
  isJoined: boolean;
  onClose: () => void;
  onToggleJoin: (club: CampusClub) => void;
}

export const ClubDetailsDialog: FC<ClubDetailsDialogProps> = ({
  isOpen,
  club,
  isJoined,
  onClose,
  onToggleJoin,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !club) return null;

  const effectiveMemberCount = club.membersCount + (isJoined ? 1 : 0);
  const coverGradient =
    club.coverGradient || 'from-indigo-700 via-indigo-600 to-indigo-900';

  const coordinatorName = club.coordinator?.name || 'Student Coordinator';
  const coordinatorInitials =
    club.coordinator?.avatarInitials || computeInitials(coordinatorName);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="club-details-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-slate-200 dark:border-dark-border overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover Header Banner */}
        <div
          className={cn(
            'relative px-6 py-6 bg-gradient-to-r text-white flex flex-col justify-between overflow-hidden',
            coverGradient
          )}
        >
          {/* Ambient lighting overlays */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute left-1/3 -bottom-8 h-32 w-32 rounded-full bg-indigo-300/20 blur-xl" />

          {/* Top Row: Category, Member Count & Close Button */}
          <div className="relative z-10 flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={club.badgeVariant}
                className="bg-white/20 backdrop-blur-md text-white border-white/20 text-xs px-2.5 py-0.5 font-semibold"
              >
                {club.category}
              </Badge>
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full bg-black/25 backdrop-blur-md text-white font-medium">
                <Users size={12} className="text-white/80" />
                <span>{effectiveMemberCount} Members</span>
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Close club details modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Club Title & Schedule */}
          <div className="relative z-10 space-y-1.5">
            <h2
              id="club-details-modal-title"
              className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug"
            >
              {club.name}
            </h2>
            <div className="flex items-center gap-3 text-xs text-indigo-100 flex-wrap">
              <span className="inline-flex items-center gap-1 font-medium bg-black/20 px-2.5 py-1 rounded-md backdrop-blur-xs">
                <Calendar size={13} className="text-amber-300" />
                <span>{club.schedule}</span>
              </span>
              <span className="inline-flex items-center gap-1 font-medium bg-black/20 px-2.5 py-1 rounded-md backdrop-blur-xs">
                <MapPin size={13} className="text-emerald-300" />
                <span>{club.location || 'Engineering Hall Bay 4 & Discord'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* 1. About the Club / Full Description */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted flex items-center gap-1.5">
              <Sparkles size={13} className="text-indigo-600 dark:text-indigo-400" />
              <span>About This Club</span>
            </h3>
            <p className="text-sm text-slate-700 dark:text-dark-text-main leading-relaxed">
              {club.fullDescription || club.description}
            </p>
          </div>

          {/* 2. Key Details Grid: Schedule & Coordinator */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Meeting Schedule Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50/70 dark:bg-dark-surface/60 space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs">
                <Clock size={15} />
                <span>Gatherings & Schedule</span>
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-900 dark:text-dark-text-main">
                  {club.schedule}
                </p>
                <p className="text-slate-500 dark:text-dark-text-muted flex items-center gap-1">
                  <MapPin size={12} className="shrink-0 text-slate-400" />
                  <span>{club.location || 'Engineering Hall Bay 4 & Online'}</span>
                </p>
              </div>
            </div>

            {/* Coordinator Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50/70 dark:bg-dark-surface/60 space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs">
                <UserCheck size={15} />
                <span>Club Coordinator</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Avatar
                  initials={coordinatorInitials}
                  size="sm"
                  alt={coordinatorName}
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-dark-text-main truncate">
                    {coordinatorName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-dark-text-muted truncate">
                    {club.coordinator?.role || 'Lead Coordinator'}
                  </p>
                </div>
              </div>
              {club.coordinator?.email && (
                <a
                  href={`mailto:${club.coordinator.email}`}
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline pt-0.5"
                >
                  <Mail size={11} />
                  <span>{club.coordinator.email}</span>
                </a>
              )}
            </div>
          </div>

          {/* 3. Club Activities & Interests */}
          {club.activities && club.activities.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted">
                Activities & Focus Areas
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {club.activities.map((activity) => (
                  <Badge
                    key={activity}
                    variant="neutral"
                    className="text-xs py-1 px-2.5 bg-slate-100 dark:bg-dark-surface border-slate-200 dark:border-dark-border text-slate-700 dark:text-dark-text-main font-medium"
                  >
                    {activity}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 4. Recent Club Announcements & Activities */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted flex items-center gap-1.5">
                <Bell size={13} className="text-indigo-600 dark:text-indigo-400" />
                <span>Recent Club Announcements</span>
              </h3>
              <span className="text-[11px] text-slate-400 dark:text-dark-text-muted">
                {club.recentAnnouncements?.length || 0} updates
              </span>
            </div>

            {club.recentAnnouncements && club.recentAnnouncements.length > 0 ? (
              <div className="space-y-2.5">
                {club.recentAnnouncements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-dark-border bg-white dark:bg-dark-card shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-dark-text-main">
                        {ann.title}
                      </h4>
                      <Badge variant="indigo" className="text-[10px] py-0 px-2 shrink-0">
                        {ann.date}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-dark-text-muted leading-relaxed">
                      {ann.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-dark-border text-center text-xs text-slate-500 dark:text-dark-text-muted">
                No recent announcements posted yet. Check back following the next club meeting!
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 dark:border-dark-border bg-slate-50/70 dark:bg-dark-surface/70">
          <div className="flex items-center gap-2">
            {isJoined ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                <Check size={13} className="stroke-[2.5]" />
                <span>You are an active member</span>
              </span>
            ) : (
              <span className="text-xs text-slate-500 dark:text-dark-text-muted hidden sm:inline">
                Open to all enrolled students • No membership fees
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="cursor-pointer"
            >
              Close
            </Button>

            <Button
              type="button"
              variant={isJoined ? 'outline' : 'primary'}
              size="sm"
              onClick={() => onToggleJoin(club)}
              className={cn(
                'cursor-pointer gap-1.5 min-w-[110px]',
                isJoined &&
                  'text-rose-600 border-rose-200 dark:text-rose-400 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              )}
            >
              {isJoined ? (
                <span>Leave Club</span>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Join Club</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
