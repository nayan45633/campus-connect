import type { FC, ChangeEvent } from 'react';
import { Bell, Search, Menu, X, PlusCircle } from 'lucide-react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { BrandLogo } from '@/components/common/BrandLogo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { useStudentProfile } from '@/hooks/useStudentProfile';
import { useCampusNotifications } from '@/hooks/useCampusNotifications';

interface HeaderProps {
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export const Header: FC<HeaderProps> = ({
  isMobileMenuOpen,
  onToggleMobileMenu,
}) => {
  const { profile } = useStudentProfile();
  const { unreadCount } = useCampusNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchQuery = searchParams.get('q') || '';

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (location.pathname !== '/') {
      navigate(val.trim() ? `/?q=${encodeURIComponent(val)}` : '/');
    } else {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (val.trim()) {
            next.set('q', val);
          } else {
            next.delete('q');
          }
          return next;
        },
        { replace: true }
      );
    }
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

  const handleCreatePostClick = () => {
    if (location.pathname !== '/') {
      navigate('/');
    }
    // Smoothly scroll and focus composer
    setTimeout(() => {
      const composer = document.getElementById('post-composer-textarea');
      if (composer) {
        composer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        composer.focus();
      }
    }, 100);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-dark-border bg-white/95 dark:bg-dark-surface/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-dark-surface/80 transition-colors duration-200">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Left: Mobile hamburger + Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 dark:text-dark-text-muted hover:bg-slate-100 dark:hover:bg-dark-elevated hover:text-slate-800 dark:hover:text-dark-text-main md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <BrandLogo showTagline={false} size="md" />
        </div>

        {/* Center: Search input */}
        <div className="hidden sm:flex max-w-md w-full mx-4 lg:mx-6 relative">
          <Input
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search posts, departments, topics (#AI, #Calculus)..."
            icon={<Search size={16} />}
            className="w-full bg-slate-50 dark:bg-dark-card focus:bg-white dark:focus:bg-dark-elevated text-xs sm:text-sm pr-8 border-slate-200 dark:border-dark-border text-slate-900 dark:text-dark-text-main"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-dark-text-muted hover:text-slate-600 dark:hover:text-dark-text-main p-0.5 rounded cursor-pointer"
              aria-label="Clear search input"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Right: Actions, Notifications & Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <Button
            type="button"
            variant="soft"
            size="sm"
            onClick={handleCreatePostClick}
            className="hidden lg:inline-flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle size={16} />
            <span>Create Post</span>
          </Button>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Notification Icon */}
          <Link
            to="/notifications"
            className="relative inline-flex items-center justify-center h-9 w-9 rounded-lg text-slate-600 dark:text-dark-text-muted hover:bg-slate-100 dark:hover:bg-dark-elevated hover:text-slate-900 dark:hover:text-dark-text-main transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label={
              unreadCount > 0
                ? `Campus notifications (${unreadCount} unread)`
                : 'Campus notifications (no unread)'
            }
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-dark-surface animate-pulse" />
            )}
          </Link>

          {/* User Profile Mini Card */}
          <Link
            to="/profile"
            className="flex items-center gap-2.5 pl-1 sm:pl-2 border-l border-slate-200 dark:border-dark-border hover:opacity-85 transition-opacity"
            aria-label={`View profile of ${profile.name}`}
          >
            <Avatar
              src={profile.avatarUrl}
              initials={profile.initials}
              size="sm"
              isOnline={true}
              alt={profile.name}
            />
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 dark:text-dark-text-main leading-tight">
                {profile.name}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-dark-text-muted truncate max-w-[120px]">
                {profile.university}
              </span>
            </div>
            <Badge variant="indigo" className="hidden 2xl:inline-flex">
              {profile.major.split(' ')[0]}
            </Badge>
          </Link>
        </div>
      </div>
    </header>
  );
};
