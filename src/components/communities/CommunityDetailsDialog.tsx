import { useState, useEffect, type FC } from 'react';
import type { CampusCommunity } from '@/types';
import {
  X,
  Users,
  Calendar,
  MapPin,
  UserCheck,
  Check,
  Plus,
  MessageSquare,
  Heart,
  Share2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { categoryIcons } from '@/components/communities/CommunityCard';
import { cn } from '@/lib/utils';

interface CommunityDetailsDialogProps {
  isOpen: boolean;
  community: CampusCommunity | null;
  onClose: () => void;
  onToggleJoin: (communityId: string) => void;
}

export const CommunityDetailsDialog: FC<CommunityDetailsDialogProps> = ({
  isOpen,
  community,
  onClose,
  onToggleJoin,
}) => {
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

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

  if (!isOpen || !community) return null;

  const CategoryIcon = categoryIcons[community.category];
  const coverGradient =
    community.coverGradient || 'from-indigo-600 via-indigo-700 to-indigo-900';

  const handleShare = async () => {
    const text = `Join the "${community.name}" community on Campus Connect! ${community.shortDescription}`;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: community.name,
          text,
          url,
        });
        setShareFeedback('Shared!');
        setTimeout(() => setShareFeedback(null), 2500);
        return;
      } catch {
        // Fallback
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setShareFeedback('Community link copied to clipboard!');
    } catch {
      setShareFeedback('Link copied!');
    }

    setTimeout(() => setShareFeedback(null), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="community-details-title"
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
            'relative px-6 py-6 bg-gradient-to-r text-white flex items-start justify-between overflow-hidden',
            coverGradient
          )}
        >
          {/* Subtle ambient lighting */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:14px_14px]" />
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

          <div className="relative z-10 space-y-2 pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="bg-white/15 text-white border-white/20 text-xs font-semibold backdrop-blur-xs inline-flex items-center gap-1"
              >
                <CategoryIcon size={12} />
                <span>{community.category}</span>
              </Badge>

              {community.isJoined && (
                <Badge
                  variant="outline"
                  className="bg-emerald-500/25 text-emerald-100 border-emerald-400/30 text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Check size={12} className="text-emerald-300" />
                  <span>You're a Member</span>
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-extrabold text-lg shadow-sm">
                {community.avatarInitials}
              </div>
              <h2
                id="community-details-title"
                className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug"
              >
                {community.name}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="relative z-10 p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            aria-label="Close community details"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Share feedback toast */}
          {shareFeedback && (
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-800 dark:text-indigo-200 flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{shareFeedback}</span>
            </div>
          )}

          {/* Quick Logistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-150 dark:border-dark-border text-xs sm:text-sm">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Users size={16} />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted block">
                  Community Size
                </span>
                <span className="font-semibold text-slate-900 dark:text-dark-text-main">
                  {community.membersCount} student members
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Calendar size={16} />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted block">
                  Regular Meetings
                </span>
                <span className="font-semibold text-slate-900 dark:text-dark-text-main">
                  {community.meetingSchedule || 'Weekly sessions'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 shrink-0">
                <MapPin size={16} />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted block">
                  Primary Location
                </span>
                <span className="font-semibold text-slate-900 dark:text-dark-text-main">
                  {community.location || 'Campus Center & Online'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 shrink-0">
                <UserCheck size={16} />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted block">
                  Leadership
                </span>
                <span className="font-semibold text-slate-900 dark:text-dark-text-main">
                  {community.leadName ? `${community.leadName} (${community.leadRole || 'Lead'})` : 'Student Executive Committee'}
                </span>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted">
              About This Community
            </h3>
            <p className="text-sm text-slate-700 dark:text-dark-text-main leading-relaxed whitespace-pre-line">
              {community.fullDescription || community.shortDescription || community.description}
            </p>
          </div>

          {/* Tags */}
          {community.tags && community.tags.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted">
                Focus Areas & Topics
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {community.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 px-2.5 py-0.5 rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Community Posts & Discussions */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-dark-border">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted flex items-center gap-1.5">
                <MessageSquare size={13} />
                <span>Recent Discussions & Circle Activity</span>
              </h3>
              <span className="text-[11px] text-slate-400 dark:text-dark-text-subtle">
                {community.samplePosts?.length || 0} recent posts
              </span>
            </div>

            {community.samplePosts && community.samplePosts.length > 0 ? (
              <div className="space-y-3">
                {community.samplePosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-3.5 rounded-xl border border-slate-200/90 dark:border-dark-border bg-slate-50/60 dark:bg-dark-surface/60 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar
                          initials={post.authorInitials}
                          size="sm"
                          alt={post.authorName}
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-dark-text-main">
                              {post.authorName}
                            </span>
                            {post.authorRole && (
                              <Badge variant="indigo" className="text-[9px] py-0 px-1.5">
                                {post.authorRole}
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 dark:text-dark-text-muted font-mono">
                            {post.authorHandle}
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] text-slate-400 dark:text-dark-text-subtle">
                        {post.timeAgo}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 dark:text-dark-text-main leading-relaxed">
                      {post.content}
                    </p>

                    <div className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 pt-1">
                      <Heart size={12} className="fill-rose-500 text-rose-500 dark:fill-rose-400 dark:text-rose-400" />
                      <span>{post.likesCount} student likes</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-dark-text-muted italic">
                No recent discussions in this circle yet. Join to start the first conversation!
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 dark:border-dark-border bg-slate-50/70 dark:bg-dark-surface/70">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="gap-1.5 text-slate-600 dark:text-dark-text-muted hover:text-slate-900 dark:hover:text-dark-text-main cursor-pointer"
          >
            <Share2 size={15} />
            <span>Share</span>
          </Button>

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
              variant={community.isJoined ? 'destructive' : 'primary'}
              size="sm"
              onClick={() => onToggleJoin(community.id)}
              className="gap-1.5 cursor-pointer font-semibold px-4"
            >
              {community.isJoined ? (
                <>
                  <X size={14} />
                  <span>Leave Community</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Join Community</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
