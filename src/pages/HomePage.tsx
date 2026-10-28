import { useState, useMemo, type FC } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { PostCategory } from '@/types';
import {
  Sparkles,
  Search,
  X,
  Compass,
  BookOpen,
  Coffee,
  Laptop,
  Briefcase,
  TrendingUp,
} from 'lucide-react';
import { PostComposer } from '@/components/feed/PostComposer';
import { PostCard } from '@/components/feed/PostCard';
import { RightSidebar } from '@/components/feed/RightSidebar';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import {
  campusAnnouncements,
  campusMetrics,
} from '@/data/mockData';
import { useStudentProfile } from '@/hooks/useStudentProfile';
import { useCampusEvents } from '@/hooks/useCampusEvents';
import { useCampusCommunities } from '@/hooks/useCampusCommunities';
import { useCampusPosts } from '@/hooks/useCampusPosts';
import { StatCard } from '@/components/common/StatCard';

const categories: { label: PostCategory | 'All'; icon?: typeof BookOpen }[] = [
  { label: 'All' },
  { label: 'Academics', icon: BookOpen },
  { label: 'Campus Life', icon: Coffee },
  { label: 'Technology', icon: Laptop },
  { label: 'Opportunities', icon: Briefcase },
];

export const HomePage: FC = () => {
  const { profile } = useStudentProfile();
  const { events, toggleRsvp: handleToggleEventRsvp } = useCampusEvents();
  const { communities: allCommunities, toggleJoin: handleToggleCommunityJoin } =
    useCampusCommunities();
  const { posts, addPost, toggleLike, addComment } = useCampusPosts();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const [selectedCategory, setSelectedCategory] = useState<PostCategory | 'All'>('All');

  // Interactive state for right sidebar widgets
  const trendingSidebarCommunities = useMemo(
    () => allCommunities.slice(0, 4),
    [allCommunities]
  );
  const [showMetricsBanner, setShowMetricsBanner] = useState(false);

  // Filter posts based on search query and category
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Category filter
      if (selectedCategory !== 'All' && post.category !== selectedCategory) {
        return false;
      }

      // Keyword search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesContent = post.content.toLowerCase().includes(query);
        const matchesAuthor =
          post.author.name.toLowerCase().includes(query) ||
          post.author.handle.toLowerCase().includes(query) ||
          post.author.major.toLowerCase().includes(query);
        const matchesCategory = post.category.toLowerCase().includes(query);
        const matchesTags = post.tags?.some((t) => t.toLowerCase().includes(query));

        return matchesContent || matchesAuthor || matchesCategory || matchesTags;
      }

      return true;
    });
  }, [posts, selectedCategory, searchQuery]);

  // Create post interaction: adds to top of feed and persists
  const handleAddPost = (postData: {
    content: string;
    category: PostCategory;
    tags: string[];
  }) => {
    addPost(postData, profile);
  };

  // Like interaction: toggles isLiked and persists in localStorage
  const handleToggleLike = (postId: string) => {
    toggleLike(postId);
  };

  // Comment interaction: adds comment and persists in localStorage
  const handleAddComment = (postId: string, commentText: string) => {
    addComment(postId, commentText, profile);
  };

  const handleClearSearch = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('q');
        return next;
      },
      { replace: true }
    );
  };

  const handleResetFilters = () => {
    setSelectedCategory('All');
    handleClearSearch();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Welcoming Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-indigo-150/80 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 p-6 sm:p-8 text-white shadow-sm">
        {/* Decorative subtle background aura */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-indigo-500/25 blur-2xl" />
        <div className="pointer-events-none absolute right-1/3 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-xl" />

        <div className="relative z-10 max-w-2xl space-y-2.5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/20">
            <Sparkles size={13} className="text-amber-300" />
            <span>Welcome, {profile.name.split(' ')[0]} • {profile.university}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Your Campus, Connected.
          </h1>

          <p className="text-xs sm:text-sm text-indigo-100 max-w-xl leading-relaxed">
            The social heartbeat for your university. Form study circles, exchange notes, discover club gatherings, and stay up to date with official faculty announcements in real time.
          </p>

          <div className="pt-2 flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                const composer = document.getElementById('post-composer-textarea');
                if (composer) {
                  composer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  composer.focus();
                }
              }}
              className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold cursor-pointer shadow-xs"
            >
              Share Something
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowMetricsBanner((prev) => !prev)}
              className="text-white hover:bg-white/15 cursor-pointer"
            >
              <TrendingUp size={15} />
              <span>{showMetricsBanner ? 'Hide Campus Stats' : 'View Campus Stats'}</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Optional Collapsible Campus Metrics Grid */}
      {showMetricsBanner && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 animate-fadeIn">
          {campusMetrics.map((metric) => (
            <StatCard key={metric.id} metric={metric} />
          ))}
        </section>
      )}

      {/* Main 3-Column Work Area (Desktop: Center Feed + Right Rail) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
        {/* Central Campus Feed (lg:col-span-7, xl:col-span-8) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5">
          {/* Post Composer */}
          <PostComposer currentUser={profile} onAddPost={handleAddPost} />

          {/* Feed Controls: Search Status & Category Tabs */}
          <div className="space-y-3">
            {/* Active search filter banner */}
            {searchQuery && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-150 dark:border-indigo-800/80 text-xs text-indigo-900 dark:text-indigo-200">
                <div className="flex items-center gap-2">
                  <Search size={14} className="text-indigo-600 dark:text-indigo-400" />
                  <span>
                    Showing discussions matching: <strong className="font-semibold">"{searchQuery}"</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 cursor-pointer"
                >
                  <X size={14} />
                  <span>Clear</span>
                </button>
              </div>
            )}

            {/* Category Filter Pills */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-dark-border pb-3">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full no-scrollbar py-0.5">
                {categories.map(({ label, icon: Icon }) => {
                  const isActive = selectedCategory === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setSelectedCategory(label)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer select-none ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                          : 'bg-white dark:bg-dark-card border border-slate-200/90 dark:border-dark-border text-slate-600 dark:text-dark-text-muted hover:bg-slate-50 dark:hover:bg-dark-elevated hover:text-slate-900 dark:hover:text-dark-text-main'
                      }`}
                    >
                      {Icon && <Icon size={12} />}
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              <span className="text-[11px] text-slate-400 dark:text-dark-text-muted shrink-0 hidden sm:inline">
                {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
              </span>
            </div>
          </div>

          {/* Posts Feed List */}
          {filteredPosts.length > 0 ? (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={profile}
                  onToggleLike={handleToggleLike}
                  onAddComment={handleAddComment}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Compass}
              title="No posts found"
              description={
                searchQuery
                  ? `No campus discussions matched "${searchQuery}". Try searching for another topic or clear the search query.`
                  : `There are no posts currently in the ${selectedCategory} category.`
              }
              actionLabel="Reset filters & search"
              onAction={handleResetFilters}
            />
          )}
        </div>

        {/* Right Sidebar (lg:col-span-5, xl:col-span-4) */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-20">
          <RightSidebar
            events={events}
            communities={trendingSidebarCommunities}
            announcements={campusAnnouncements}
            onToggleEventRsvp={handleToggleEventRsvp}
            onToggleCommunityJoin={handleToggleCommunityJoin}
          />
        </div>
      </div>
    </div>
  );
};
