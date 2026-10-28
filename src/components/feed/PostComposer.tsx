import { useState, type FC, type FormEvent } from 'react';
import type { PostCategory, StudentUser } from '@/types';
import { Send, Sparkles, Hash, BookOpen, Coffee, Laptop, Briefcase, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PostComposerProps {
  currentUser: StudentUser;
  onAddPost: (postData: {
    content: string;
    category: PostCategory;
    tags: string[];
  }) => void;
}

const categories: { label: PostCategory; icon: typeof BookOpen }[] = [
  { label: 'Academics', icon: BookOpen },
  { label: 'Campus Life', icon: Coffee },
  { label: 'Technology', icon: Laptop },
  { label: 'Opportunities', icon: Briefcase },
];

const popularTags: readonly string[] = [
  'StudyCircle',
  'Midterms',
  'Hackathon',
  'Internship',
  'CampusVibes',
];

export const PostComposer: FC<PostComposerProps> = ({
  currentUser,
  onAddPost,
}) => {
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PostCategory>('Technology');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showSuccessBadge, setShowSuccessBadge] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    onAddPost({
      content: trimmed,
      category: selectedCategory,
      tags: selectedTags,
    });

    // Reset composer state
    setContent('');
    setSelectedTags([]);
    setShowSuccessBadge(true);
    setTimeout(() => {
      setShowSuccessBadge(false);
    }, 3500);
  };

  return (
    <Card className="border-indigo-150/70 dark:border-dark-border shadow-xs bg-white dark:bg-dark-card overflow-hidden transition-colors duration-200">
      <CardContent className="p-4 sm:p-5">
        {showSuccessBadge && (
          <div className="mb-3 flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 animate-fadeIn">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">
              Your post has been published to the Campus Feed! 🎉
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Top row: Student avatar + Category pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100 dark:border-dark-border">
            <div className="flex items-center gap-2.5">
              <Avatar
                src={currentUser.avatarUrl}
                initials={currentUser.initials}
                size="md"
                isOnline={true}
                alt={currentUser.name}
              />
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-dark-text-main block leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-dark-text-muted">
                  Posting to <span className="font-medium text-indigo-600 dark:text-indigo-400">{selectedCategory}</span>
                </span>
              </div>
            </div>

            {/* Category selection selector */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {categories.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSelectedCategory(label)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer',
                    selectedCategory === label
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-dark-elevated text-slate-600 dark:text-dark-text-muted hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  )}
                >
                  <Icon size={12} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Textarea field */}
          <div className="relative">
            <textarea
              id="post-composer-textarea"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind? Share study group invites, club updates, campus questions, or project collaborations..."
              className="w-full resize-none rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-dark-surface p-3 text-sm text-slate-900 dark:text-dark-text-main placeholder:text-slate-400 dark:placeholder:text-dark-text-muted focus:bg-white dark:focus:bg-dark-elevated focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors leading-relaxed"
              maxLength={600}
            />
            <div className="text-[11px] text-slate-400 dark:text-dark-text-muted text-right pr-1">
              {content.length}/600
            </div>
          </div>

          {/* Tag suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-medium text-slate-400 dark:text-dark-text-muted flex items-center gap-1 mr-1">
              <Hash size={12} /> Add tags:
            </span>
            {popularTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'text-[11px] px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60'
                      : 'bg-slate-100 dark:bg-dark-elevated text-slate-600 dark:text-dark-text-muted hover:bg-slate-200/80 dark:hover:bg-slate-700/60 border border-transparent'
                  )}
                >
                  #{tag}
                </button>
              );
            })}
          </div>

          {/* Bottom actions bar */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-dark-border">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-dark-text-muted">
              <Sparkles size={13} className="text-amber-500" />
              <span>Visible to all verified students</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!content.trim()}
              className="gap-1.5 px-4 cursor-pointer"
            >
              <span>Post</span>
              <Send size={14} />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
