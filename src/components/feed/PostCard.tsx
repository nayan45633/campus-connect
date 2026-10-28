import { useState, type FC, type FormEvent } from 'react';
import type { CampusPost, StudentUser } from '@/types';
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  Check,
  BookOpen,
  Coffee,
  Laptop,
  Briefcase,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: CampusPost;
  currentUser: StudentUser;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
}

const categoryIcons = {
  Academics: BookOpen,
  'Campus Life': Coffee,
  Technology: Laptop,
  Opportunities: Briefcase,
};

const categoryBadgeVariants: Record<
  string,
  { variant: 'indigo' | 'success' | 'warning' | 'accent'; label: string }
> = {
  Academics: { variant: 'success', label: 'Academics' },
  'Campus Life': { variant: 'accent', label: 'Campus Life' },
  Technology: { variant: 'indigo', label: 'Technology' },
  Opportunities: { variant: 'warning', label: 'Opportunities' },
};

export const PostCard: FC<PostCardProps> = ({
  post,
  currentUser,
  onToggleLike,
  onAddComment,
}) => {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const CategoryIcon = categoryIcons[post.category] || BookOpen;
  const badgeConfig = categoryBadgeVariants[post.category] || {
    variant: 'indigo',
    label: post.category,
  };

  const isPostAuthorCurrentUser = post.author.id === currentUser.id;
  const authorAvatarUrl = isPostAuthorCurrentUser ? (currentUser.avatarUrl ?? post.author.avatarUrl) : post.author.avatarUrl;
  const authorName = isPostAuthorCurrentUser ? currentUser.name : post.author.name;
  const authorHandle = isPostAuthorCurrentUser ? currentUser.handle : post.author.handle;
  const authorInitials = isPostAuthorCurrentUser ? currentUser.initials : post.author.initials;

  const handleShare = async () => {
    const shareText = `"${post.content.slice(0, 80)}..." - by ${authorName} on Campus Connect`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Campus Connect Post',
          text: shareText,
          url: shareUrl,
        });
        setShareFeedback('Shared!');
        setTimeout(() => setShareFeedback(null), 2500);
        return;
      } catch {
        // Fallback to clipboard if share was aborted or rejected
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setShareFeedback('Link copied to clipboard!');
    } catch {
      setShareFeedback('Link copied!');
    }

    setTimeout(() => {
      setShareFeedback(null);
    }, 2500);
  };

  const handleCommentSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = commentInput.trim();
    if (!trimmed) return;

    onAddComment(post.id, trimmed);
    setCommentInput('');
  };

  return (
    <Card hoverable className="overflow-hidden border-slate-200/90 shadow-xs transition-all">
      {/* Post Header */}
      <CardHeader className="p-4 sm:p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              src={authorAvatarUrl}
              initials={authorInitials}
              size="md"
              alt={authorName}
              isOnline={true}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900 dark:text-dark-text-main truncate">
                  {authorName}
                </span>
                <span className="text-xs text-slate-400 dark:text-dark-text-muted hidden sm:inline">
                  {authorHandle}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-dark-text-muted mt-0.5">
                <span className="truncate">{post.author.major}</span>
                <span>•</span>
                <span className="shrink-0">{post.createdAt}</span>
              </div>
            </div>
          </div>

          <Badge
            variant={badgeConfig.variant}
            className="text-xs font-medium inline-flex items-center gap-1 shrink-0"
          >
            <CategoryIcon size={12} />
            <span>{badgeConfig.label}</span>
          </Badge>
        </div>
      </CardHeader>

      {/* Post Content */}
      <CardContent className="px-4 sm:px-5 pb-3">
        <p className="text-sm text-slate-800 dark:text-dark-text-main leading-relaxed whitespace-pre-line">
          {post.content}
        </p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/60 border border-indigo-100/80 dark:border-indigo-800/60 px-2 py-0.5 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      {/* Share Toast Banner if active */}
      {shareFeedback && (
        <div className="mx-4 sm:mx-5 mb-2 py-1.5 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-800 dark:text-indigo-200 flex items-center justify-between animate-fadeIn">
          <span className="flex items-center gap-1.5 font-medium">
            <Check size={14} className="text-indigo-600 dark:text-indigo-400" />
            {shareFeedback}
          </span>
        </div>
      )}

      {/* Actions Toolbar */}
      <CardFooter className="px-4 sm:px-5 py-2.5 border-t border-slate-100/90 dark:border-dark-border flex items-center justify-between text-xs text-slate-500 dark:text-dark-text-muted bg-slate-50/40 dark:bg-dark-surface/40">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Like Button */}
          <button
            type="button"
            onClick={() => onToggleLike(post.id)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all duration-150 cursor-pointer select-none',
              post.isLiked
                ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 font-semibold'
                : 'text-slate-600 dark:text-dark-text-muted hover:bg-slate-100 dark:hover:bg-dark-elevated hover:text-rose-600 dark:hover:text-rose-400'
            )}
            aria-label={post.isLiked ? 'Unlike post' : 'Like post'}
          >
            <Heart
              size={16}
              className={cn(
                'transition-transform active:scale-125',
                post.isLiked ? 'fill-rose-500 text-rose-500' : ''
              )}
            />
            <span>{post.likesCount}</span>
          </button>

          {/* Comment Button (toggles open/close) */}
          <button
            type="button"
            onClick={() => setIsCommentsOpen((prev) => !prev)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all duration-150 cursor-pointer select-none',
              isCommentsOpen
                ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 font-semibold'
                : 'text-slate-600 dark:text-dark-text-muted hover:bg-slate-100 dark:hover:bg-dark-elevated hover:text-indigo-600 dark:hover:text-indigo-400'
            )}
            aria-label="Toggle comments"
          >
            <MessageCircle size={16} />
            <span>{post.comments.length}</span>
            <span className="hidden sm:inline">
              {post.comments.length === 1 ? 'Comment' : 'Comments'}
            </span>
          </button>
        </div>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 dark:text-dark-text-muted hover:bg-slate-100 dark:hover:bg-dark-elevated hover:text-slate-900 dark:hover:text-dark-text-main transition-colors cursor-pointer select-none"
          aria-label="Share campus post"
        >
          <Share2 size={15} />
          <span className="hidden sm:inline">Share</span>
        </button>
      </CardFooter>

      {/* Expandable Comment Section */}
      {isCommentsOpen && (
        <div className="border-t border-slate-200/80 dark:border-dark-border bg-slate-50/70 dark:bg-dark-surface/60 p-4 sm:p-5 space-y-4 animate-fadeIn">
          {/* Existing comments list */}
          <div className="space-y-3">
            {post.comments.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-dark-text-muted italic text-center py-2">
                No comments yet. Be the first to start the campus discussion!
              </p>
            ) : (
              post.comments.map((comment) => {
                const isCommentAuthorCurrentUser = comment.author.id === currentUser.id;
                const commentAvatarUrl = isCommentAuthorCurrentUser
                  ? (currentUser.avatarUrl ?? comment.author.avatarUrl)
                  : comment.author.avatarUrl;
                const commentName = isCommentAuthorCurrentUser ? currentUser.name : comment.author.name;
                const commentInitials = isCommentAuthorCurrentUser ? currentUser.initials : comment.author.initials;

                return (
                  <div
                    key={comment.id}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white dark:bg-dark-card border border-slate-200/70 dark:border-dark-border shadow-2xs"
                  >
                    <Avatar
                      src={commentAvatarUrl}
                      initials={commentInitials}
                      size="sm"
                      alt={commentName}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900 dark:text-dark-text-main">
                            {commentName}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-dark-text-muted">
                            • {comment.author.major.split(' ')[0]}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-dark-text-muted shrink-0">
                          {comment.createdAt}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-dark-text-main mt-1 leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* New Comment Input */}
          <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 pt-1">
            <Avatar
              src={currentUser.avatarUrl}
              initials={currentUser.initials}
              size="sm"
              alt={currentUser.name}
            />
            <div className="flex-1 relative">
              <Input
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Write a supportive reply or answer..."
                className="bg-white dark:bg-dark-card text-xs py-1.5 h-9"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!commentInput.trim()}
              className="h-9 px-3 gap-1 cursor-pointer shrink-0"
            >
              <Send size={13} />
              <span className="hidden sm:inline">Reply</span>
            </Button>
          </form>
        </div>
      )}
    </Card>
  );
};
