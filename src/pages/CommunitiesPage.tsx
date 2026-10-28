import { useState, useMemo, type FC, type ChangeEvent } from 'react';
import type { CampusCommunity, CommunityCategory } from '@/types';
import {
  Users,
  Search,
  X,
  Filter,
  CheckCircle2,
  BookmarkCheck,
  Compass,
  Code2,
  GraduationCap,
  Gamepad2,
  Palette,
  Briefcase,
} from 'lucide-react';
import { useCampusCommunities } from '@/hooks/useCampusCommunities';
import { PageHeader } from '@/components/common/PageHeader';
import { CommunityCard } from '@/components/communities/CommunityCard';
import { CommunityDetailsDialog } from '@/components/communities/CommunityDetailsDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const categories: { label: CommunityCategory | 'All'; icon?: typeof Code2 }[] = [
  { label: 'All' },
  { label: 'Technology', icon: Code2 },
  { label: 'Academics', icon: GraduationCap },
  { label: 'Gaming', icon: Gamepad2 },
  { label: 'Arts', icon: Palette },
  { label: 'Entrepreneurship', icon: Briefcase },
];

export const CommunitiesPage: FC = () => {
  const { communities, joinedCount, toggleJoin } = useCampusCommunities();

  // Search, category, and joined filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CommunityCategory | 'All'>('All');
  const [showOnlyJoined, setShowOnlyJoined] = useState(false);

  // Modal dialog state
  const [selectedCommunity, setSelectedCommunity] = useState<CampusCommunity | null>(null);

  // Feedback toast banner
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Filter communities conjunctively based on search, category, and joined status
  const filteredCommunities = useMemo(() => {
    return communities.filter((community) => {
      // 1. My Communities filter
      if (showOnlyJoined && !community.isJoined) {
        return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'All' && community.category !== selectedCategory) {
        return false;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = community.name.toLowerCase().includes(query);
        const matchesShortDesc = community.shortDescription.toLowerCase().includes(query);
        const matchesFullDesc = community.fullDescription.toLowerCase().includes(query);
        const matchesCategory = community.category.toLowerCase().includes(query);
        const matchesLead = community.leadName?.toLowerCase().includes(query);
        const matchesTags = community.tags?.some((t) => t.toLowerCase().includes(query));

        return (
          matchesName ||
          matchesShortDesc ||
          matchesFullDesc ||
          matchesCategory ||
          matchesLead ||
          matchesTags
        );
      }

      return true;
    });
  }, [communities, selectedCategory, searchQuery, showOnlyJoined]);

  // Handle toggling community membership with friendly feedback
  const handleToggleJoin = (communityId: string) => {
    const result = toggleJoin(communityId);

    if (result.isJoined) {
      setFeedback({
        message: `Joined "${result.communityName}"! You are now part of this student circle. 🎉`,
        type: 'success',
      });
    } else {
      setFeedback({
        message: `Left "${result.communityName}". You have departed from this circle.`,
        type: 'info',
      });
    }

    // Keep modal state synchronized if currently open
    setSelectedCommunity((current) => {
      if (current && current.id === communityId) {
        const updated = communities.find((c) => c.id === communityId);
        if (updated) {
          return {
            ...updated,
            isJoined: result.isJoined,
            membersCount: result.isJoined
              ? updated.membersCount + 1
              : Math.max(0, updated.membersCount - 1),
          };
        }
      }
      return current;
    });

    setTimeout(() => {
      setFeedback(null);
    }, 3500);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setShowOnlyJoined(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12 max-w-7xl mx-auto">
      {/* 1. Page Header with Title, Subtitle, and My Communities Toggle */}
      <PageHeader
        title="Discover Communities"
        description="Find your people. Explore your interests."
        badge={
          <Badge variant="indigo" className="hidden sm:inline-flex gap-1">
            <Users size={12} />
            <span>{communities.length} Active Student Guilds</span>
          </Badge>
        }
      >
        <button
          type="button"
          onClick={() => setShowOnlyJoined((prev) => !prev)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none border',
            showOnlyJoined
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-white dark:bg-dark-card border-slate-200 dark:border-dark-border text-slate-700 dark:text-dark-text-main hover:bg-slate-50 dark:hover:bg-dark-elevated'
          )}
        >
          <BookmarkCheck size={15} />
          <span>My Communities</span>
          <span
            className={cn(
              'px-1.5 py-0.2 rounded-full text-[10px]',
              showOnlyJoined
                ? 'bg-indigo-700 text-white'
                : 'bg-slate-100 dark:bg-dark-elevated text-slate-600 dark:text-dark-text-muted'
            )}
          >
            {joinedCount}
          </span>
        </button>
      </PageHeader>

      {/* 2. Visual Feedback Banner */}
      {feedback && (
        <div
          className={cn(
            'p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between shadow-xs animate-fadeIn',
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
              : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200'
          )}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2
              size={18}
              className={feedback.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}
            />
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold underline hover:opacity-80 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Search and Category Filters Bar */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Field */}
          <div className="relative w-full md:max-w-md">
            <Input
              value={searchQuery}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder="Search communities by name, topic (#AI, #Figma), or leads..."
              icon={<Search size={16} />}
              className="bg-white dark:bg-dark-card pr-8 text-xs sm:text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 dark:text-dark-text-muted hover:text-slate-600 dark:hover:text-dark-text-main cursor-pointer"
                aria-label="Clear search query"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Result Counter & Joined Filter Indicator */}
          <div className="flex items-center justify-between md:justify-end gap-2 text-xs text-slate-500 dark:text-dark-text-muted">
            <span>
              Showing <strong className="text-slate-900 dark:text-dark-text-main">{filteredCommunities.length}</strong>{' '}
              {filteredCommunities.length === 1 ? 'community' : 'communities'}
            </span>

            {showOnlyJoined && (
              <Badge variant="indigo" className="text-xs">
                Filter: Joined Circles
              </Badge>
            )}
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200/80 dark:border-dark-border">
          <span className="text-xs font-semibold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Filter size={12} /> Categories:
          </span>
          {categories.map(({ label, icon: Icon }) => {
            const isActive = selectedCategory === label;
            const count =
              label === 'All'
                ? communities.length
                : communities.filter((c) => c.category === label).length;

            return (
              <button
                key={label}
                type="button"
                onClick={() => setSelectedCategory(label)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer select-none',
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'bg-white dark:bg-dark-card border border-slate-200/90 dark:border-dark-border text-slate-600 dark:text-dark-text-muted hover:bg-slate-50 dark:hover:bg-dark-elevated hover:text-slate-900 dark:hover:text-dark-text-main'
                )}
              >
                {Icon && <Icon size={12} />}
                <span>{label}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px]',
                    isActive
                      ? 'bg-indigo-700 text-white'
                      : 'bg-slate-100 dark:bg-dark-elevated text-slate-500 dark:text-dark-text-muted'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Communities Grid */}
      {filteredCommunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCommunities.map((community) => (
            <CommunityCard
              key={community.id}
              community={community}
              onSelect={(comm) => setSelectedCommunity(comm)}
              onToggleJoin={handleToggleJoin}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Compass}
          title="No campus communities found"
          description={
            showOnlyJoined
              ? "You haven't joined any communities yet! Explore the circles above and join your classmates in software, arts, esports, or startups."
              : searchQuery
              ? `No communities matched your search query "${searchQuery}". Try searching for another keyword, skill, or discipline.`
              : `There are currently no student communities listed under the "${selectedCategory}" category.`
          }
          actionLabel="Reset Filters & Show All Communities"
          onAction={handleResetFilters}
        />
      )}

      {/* 5. Community Details Dialog Modal */}
      <CommunityDetailsDialog
        isOpen={Boolean(selectedCommunity)}
        community={selectedCommunity}
        onClose={() => setSelectedCommunity(null)}
        onToggleJoin={handleToggleJoin}
      />
    </div>
  );
};
