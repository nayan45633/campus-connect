import { useState, useMemo, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pencil,
  GraduationCap,
  Calendar,
  Building,
  MapPin,
  Mail,
  ShieldCheck,
  BookOpen,
  Heart,
  FileText,
  Code2,
  Compass,
  Sparkles,
  Clock,
  CheckCircle2,
  Camera,
} from 'lucide-react';
import { useStudentProfile } from '@/hooks/useStudentProfile';
import { useCampusPosts } from '@/hooks/useCampusPosts';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';
import { PostCard } from '@/components/feed/PostCard';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';

export const ProfilePage: FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfile } = useStudentProfile();
  const { posts: allPosts, toggleLike, addComment } = useCampusPosts();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Filter posts created by the current student (either by user ID or handle)
  const studentPosts = useMemo(() => {
    return allPosts.filter(
      (p) => p.author.id === profile.id || p.author.handle === profile.handle
    );
  }, [allPosts, profile.id, profile.handle]);

  // Total likes received across student's posts
  const totalLikesReceived = useMemo(() => {
    return studentPosts.reduce((acc, curr) => acc + curr.likesCount, 0);
  }, [studentPosts]);

  // Handle post like
  const handleToggleLike = (postId: string) => {
    toggleLike(postId);
  };

  // Handle post comment
  const handleAddComment = (postId: string, commentText: string) => {
    addComment(postId, commentText, profile);
  };

  const handleSaveProfile = (updatedFields: Parameters<typeof updateProfile>[0]) => {
    updateProfile(updatedFields);
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 3500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn pb-12">
      {/* Success Notification Banner */}
      {showSuccessToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs sm:text-sm text-emerald-800 dark:text-emerald-200 flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">
              Profile changes saved and persisted to your student account!
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowSuccessToast(false)}
            className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 font-semibold text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Profile Header Card with Cover */}
      <Card className="overflow-hidden border-slate-200/90 dark:border-dark-border shadow-xs">
        {/* Modern Cover Section */}
        <div
          className={cn(
            'relative h-44 sm:h-56 w-full overflow-hidden transition-all',
            profile.bannerUrl
              ? 'bg-slate-900'
              : cn('bg-gradient-to-r', profile.bannerGradient || 'from-indigo-800 via-indigo-600 to-indigo-900')
          )}
        >
          {profile.bannerUrl ? (
            <img
              src={profile.bannerUrl}
              alt="Profile Cover Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              {/* Subtle geometric pattern & ambient lighting */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="pointer-events-none absolute -right-8 -top-12 h-64 w-64 rounded-full bg-indigo-400/20 blur-2xl" />
              <div className="pointer-events-none absolute left-1/4 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-xl" />
            </>
          )}

          {/* Quick change banner button on cover */}
          <button
            type="button"
            onClick={() => setIsEditDialogOpen(true)}
            className="absolute top-4 left-4 sm:top-5 sm:left-6 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/50 hover:bg-slate-900/75 backdrop-blur-md border border-white/20 text-white text-xs font-medium transition-all shadow-xs cursor-pointer group"
            title="Change profile banner or theme"
          >
            <Camera size={13} className="text-white/80 group-hover:text-white" />
            <span className="hidden sm:inline">Change Cover</span>
          </button>

          {/* University tag top right */}
          <div className="absolute top-4 right-4 sm:top-5 sm:right-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-semibold">
              <ShieldCheck size={13} className="text-emerald-300" />
              <span>Verified Student</span>
            </div>
          </div>
        </div>

        {/* Profile Info Bar */}
        <CardContent className="px-5 sm:px-8 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-5">
            {/* Avatar overlapping cover */}
            <div className="relative inline-block group">
              <Avatar
                src={profile.avatarUrl}
                initials={profile.initials}
                size="xl"
                isOnline={true}
                alt={profile.name}
                className="h-28 w-28 sm:h-32 sm:w-32 ring-4 ring-white dark:ring-dark-card shadow-md bg-indigo-50 dark:bg-indigo-950/80 border-2 border-indigo-100 dark:border-indigo-900/60 text-2xl font-bold"
              />
              <button
                type="button"
                onClick={() => setIsEditDialogOpen(true)}
                className="absolute bottom-1 right-1 p-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md border-2 border-white dark:border-dark-card transition-all cursor-pointer opacity-90 hover:opacity-100 hover:scale-105"
                title="Change profile photo"
                aria-label="Change profile photo"
              >
                <Camera size={15} />
              </button>
            </div>

            {/* Edit Profile Action Button */}
            <div className="flex items-center gap-2.5 pt-2 sm:pt-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
                className="gap-2 border-slate-300 dark:border-dark-border hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-dark-elevated hover:text-indigo-700 dark:hover:text-indigo-400 cursor-pointer shadow-2xs font-semibold"
              >
                <Pencil size={15} />
                <span>Edit Profile</span>
              </Button>
            </div>
          </div>

          {/* Student Names & Basic Academic Tags */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-dark-text-main tracking-tight">
                  {profile.name}
                </h1>
                <Badge variant="indigo" className="text-xs font-medium">
                  {profile.role === 'student' ? 'Undergraduate' : profile.role}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 dark:text-dark-text-muted font-mono mt-0.5">
                {profile.handle}
              </p>
            </div>

            {/* Academic & Campus Metadata Pills */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-slate-600 dark:text-dark-text-muted">
              <div className="flex items-center gap-1.5">
                <GraduationCap size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="font-semibold text-slate-900 dark:text-dark-text-main">{profile.major}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Calendar size={15} className="text-slate-400 dark:text-dark-text-subtle shrink-0" />
                <span>{profile.academicYearTitle}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Building size={15} className="text-slate-400 dark:text-dark-text-subtle shrink-0" />
                <span>{profile.university}</span>
              </div>
            </div>

            {/* Bio text */}
            {profile.bio && (
              <p className="text-sm text-slate-700 dark:text-dark-text-main leading-relaxed max-w-3xl pt-1">
                {profile.bio}
              </p>
            )}

            {/* Secondary Location & Date info */}
            <div className="pt-2 flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-500 dark:text-dark-text-muted border-t border-slate-100 dark:border-dark-border">
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={13} className="text-slate-400 dark:text-dark-text-subtle" />
                  {profile.location}
                </span>
              )}
              {profile.joinedDate && (
                <span className="flex items-center gap-1">
                  <Clock size={13} className="text-slate-400 dark:text-dark-text-subtle" />
                  {profile.joinedDate}
                </span>
              )}
              {profile.studentEmail && (
                <span className="flex items-center gap-1">
                  <Mail size={13} className="text-slate-400 dark:text-dark-text-subtle" />
                  {profile.studentEmail}
                </span>
              )}
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-dark-border">
            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-dark-surface/80 border border-slate-150 dark:border-dark-border text-center sm:text-left">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted block">
                Discussions
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-dark-text-main">
                {studentPosts.length}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-dark-surface/80 border border-slate-150 dark:border-dark-border text-center sm:text-left">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted block">
                Campus Karma
              </span>
              <span className="text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center justify-center sm:justify-start gap-1">
                <Heart size={15} className="fill-rose-500 text-rose-500 dark:fill-rose-400 dark:text-rose-400" />
                {totalLikesReceived}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-dark-surface/80 border border-slate-150 dark:border-dark-border text-center sm:text-left">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted block">
                Study Circles
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-dark-text-main">
                4 Circles
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-dark-surface/80 border border-slate-150 dark:border-dark-border text-center sm:text-left">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted block">
                Connections
              </span>
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                14 Peers
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation: Posts & About */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-dark-border">
        <button
          type="button"
          onClick={() => setActiveTab('posts')}
          className={cn(
            'flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer',
            activeTab === 'posts'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-dark-text-muted hover:text-slate-900 dark:hover:text-dark-text-main hover:border-slate-300 dark:hover:border-slate-600'
          )}
        >
          <FileText size={16} />
          <span>Posts</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-dark-elevated text-slate-600 dark:text-dark-text-muted">
            {studentPosts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('about')}
          className={cn(
            'flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer',
            activeTab === 'about'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-dark-text-muted hover:text-slate-900 dark:hover:text-dark-text-main hover:border-slate-300 dark:hover:border-slate-600'
          )}
        >
          <Sparkles size={16} />
          <span>About</span>
        </button>
      </div>

      {/* Tab 1: Posts Tab */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {studentPosts.length > 0 ? (
            studentPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={profile}
                onToggleLike={handleToggleLike}
                onAddComment={handleAddComment}
              />
            ))
          ) : (
            <EmptyState
              icon={Compass}
              title="No posts published yet"
              description="Share your first lecture notes, study session invite, or campus question to start engaging with classmates."
              actionLabel="Go to Home Feed to Post"
              onAction={() => navigate('/')}
            />
          )}
        </div>
      )}

      {/* Tab 2: About Tab */}
      {activeTab === 'about' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Academic Information Card */}
          <Card className="border-slate-200/90 dark:border-dark-border shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                <BookOpen size={18} />
                <CardTitle className="text-base">Academic Details</CardTitle>
              </div>
              <CardDescription>
                Official university program and enrollment information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between py-2 border-b border-slate-150 dark:border-dark-border">
                <span className="text-slate-500 dark:text-dark-text-muted font-medium">Department / Major</span>
                <span className="font-semibold text-slate-900 dark:text-dark-text-main">{profile.major}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-150 dark:border-dark-border">
                <span className="text-slate-500 dark:text-dark-text-muted font-medium">Academic Year</span>
                <span className="font-semibold text-slate-900 dark:text-dark-text-main">{profile.academicYearTitle}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-150 dark:border-dark-border">
                <span className="text-slate-500 dark:text-dark-text-muted font-medium">University</span>
                <span className="font-semibold text-slate-900 dark:text-dark-text-main">{profile.university}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-150 dark:border-dark-border">
                <span className="text-slate-500 dark:text-dark-text-muted font-medium">Degree Level</span>
                <span className="font-semibold text-slate-900 dark:text-dark-text-main">Bachelor of Science (B.S.)</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 dark:text-dark-text-muted font-medium">Academic Standing</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <ShieldCheck size={14} /> Good Standing (Verified)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Current Semester Courses */}
          <Card className="border-slate-200/90 dark:border-dark-border shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                <GraduationCap size={18} />
                <CardTitle className="text-base">Current Enrolled Courses</CardTitle>
              </div>
              <CardDescription>
                Spring Semester 2026 registered coursework
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50/70 dark:bg-dark-surface/70 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-dark-text-main">CS 210: Data Structures & Algorithms</p>
                  <p className="text-[11px] text-slate-500 dark:text-dark-text-muted">Prof. S. Sen • Mon/Wed 10:00 AM</p>
                </div>
                <Badge variant="indigo" className="text-[10px]">4 Units</Badge>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50/70 dark:bg-dark-surface/70 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-dark-text-main">HCI 301: Human-Centered UI/UX</p>
                  <p className="text-[11px] text-slate-500 dark:text-dark-text-muted">Prof. R. Banerjee • Tue/Thu 1:30 PM</p>
                </div>
                <Badge variant="indigo" className="text-[10px]">4 Units</Badge>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50/70 dark:bg-dark-surface/70 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-dark-text-main">MATH 240: Linear Algebra</p>
                  <p className="text-[11px] text-slate-500 dark:text-dark-text-muted">Prof. A. Roy • Mon/Wed 2:00 PM</p>
                </div>
                <Badge variant="neutral" className="text-[10px]">3 Units</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Skills & Tools */}
          <Card className="border-slate-200/90 dark:border-dark-border shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                  <Code2 size={18} />
                  <CardTitle className="text-base">Skills & Technologies</CardTitle>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditDialogOpen(true)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer"
                >
                  Edit
                </button>
              </div>
              <CardDescription>
                Tools, programming languages, and practical proficiencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="indigo"
                    className="text-xs py-1 px-3 shadow-2xs"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Interests & Campus Involvements */}
          <Card className="border-slate-200/90 dark:border-dark-border shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                  <Heart size={18} />
                  <CardTitle className="text-base">Interests & Activities</CardTitle>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditDialogOpen(true)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer"
                >
                  Edit
                </button>
              </div>
              <CardDescription>
                Topics, student clubs, and recreational passions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center text-xs font-medium text-slate-700 dark:text-dark-text-main bg-slate-100 dark:bg-dark-surface hover:bg-slate-200/80 dark:hover:bg-dark-elevated border border-slate-200 dark:border-dark-border px-3 py-1 rounded-full transition-colors"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Profile Dialog Modal */}
      {isEditDialogOpen && (
        <EditProfileDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          profile={profile}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
};
