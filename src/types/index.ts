import type { LucideIcon } from 'lucide-react';

/**
 * Main post categories for filtering and tagging
 */
export type PostCategory = 'Academics' | 'Campus Life' | 'Technology' | 'Opportunities';

/**
 * Navigation item definition for sidebar and mobile nav
 */
export interface NavItem {
  readonly label: string;
  readonly path: string;
  readonly icon: LucideIcon;
  readonly badge?: string | number;
  readonly description?: string;
}

/**
 * Basic student profile model
 */
export interface StudentUser {
  readonly id: string;
  readonly name: string;
  readonly handle: string;
  readonly avatarUrl?: string;
  readonly initials: string;
  readonly university: string;
  readonly major: string;
  readonly graduationYear: number;
  readonly role: 'student' | 'club_lead' | 'mentor';
}

/**
 * Detailed student profile model including bio, skills, interests, and academic details
 */
export interface StudentProfile extends StudentUser {
  readonly bio: string;
  readonly skills: readonly string[];
  readonly interests: readonly string[];
  readonly academicYearTitle: string;
  readonly location?: string;
  readonly joinedDate?: string;
  readonly studentEmail?: string;
  readonly bannerUrl?: string;
  readonly bannerGradient?: string;
}

/**
 * Comment model on a campus post
 */
export interface PostComment {
  readonly id: string;
  readonly author: StudentUser;
  readonly content: string;
  readonly createdAt: string;
}

/**
 * Complete campus feed post model
 */
export interface CampusPost {
  readonly id: string;
  readonly author: StudentUser;
  readonly category: PostCategory;
  readonly content: string;
  readonly createdAt: string;
  readonly likesCount: number;
  readonly isLiked: boolean;
  readonly comments: PostComment[];
  readonly tags?: readonly string[];
}

/**
 * Campus event category options
 */
export type EventCategory = 'Technical' | 'Cultural' | 'Workshop' | 'Sports' | 'General';

/**
 * Event organizer representation
 */
export interface EventOrganizer {
  readonly name: string;
  readonly role?: string;
  readonly avatarInitials: string;
}

/**
 * Campus event representation with full details and RSVP status
 */
export interface CampusEvent {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly month: string;
  readonly day: string;
  readonly time: string;
  readonly location: string;
  readonly category: EventCategory;
  readonly shortDescription: string;
  readonly fullDescription: string;
  readonly organizer: EventOrganizer;
  readonly attendeesCount: number;
  readonly isRsvpd: boolean;
  readonly isFeatured?: boolean;
  readonly tags?: readonly string[];
  readonly highlights?: readonly string[];
  readonly capacity?: number;
}

/**
 * Student community category options
 */
export type CommunityCategory =
  | 'Technology'
  | 'Academics'
  | 'Gaming'
  | 'Arts'
  | 'Entrepreneurship';

/**
 * Sample discussion post inside a community
 */
export interface CommunityPost {
  readonly id: string;
  readonly authorName: string;
  readonly authorHandle: string;
  readonly authorInitials: string;
  readonly authorRole?: string;
  readonly content: string;
  readonly timeAgo: string;
  readonly likesCount: number;
}

/**
 * Trending student community model
 */
export interface CampusCommunity {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly shortDescription: string;
  readonly fullDescription: string;
  readonly category: CommunityCategory;
  readonly membersCount: number;
  readonly isJoined: boolean;
  readonly avatarInitials: string;
  readonly coverGradient?: string;
  readonly meetingSchedule?: string;
  readonly location?: string;
  readonly leadName?: string;
  readonly leadRole?: string;
  readonly tags?: readonly string[];
  readonly samplePosts?: readonly CommunityPost[];
}

/**
 * Official campus announcement model for quick sidebar previews
 */
export interface CampusAnnouncement {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly date: string;
  readonly priority: 'Urgent' | 'Academic' | 'General';
  readonly department: string;
}

/**
 * Notice board categories
 */
export type NoticeCategory = 'Academics' | 'Examinations' | 'Placements' | 'Scholarships' | 'Events';

/**
 * Comprehensive campus notice board item
 */
export interface CampusNotice {
  readonly id: string;
  readonly title: string;
  readonly category: NoticeCategory;
  readonly shortDescription: string;
  readonly fullDescription: string;
  readonly publishedDate: string;
  readonly expiryDate?: string;
  readonly isPinned?: boolean;
  readonly isImportant?: boolean;
  readonly department: string;
  readonly referenceNumber?: string;
  readonly attachmentName?: string;
  readonly attachmentSize?: string;
  readonly contactEmail?: string;
  readonly isRead?: boolean;
}

/**
 * Campus metric / stat representation
 */
export interface CampusMetric {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly change?: string;
  readonly isPositive?: boolean;
  readonly icon: LucideIcon;
  readonly colorScheme: 'indigo' | 'emerald' | 'amber' | 'sky';
}

/**
 * Campus notification category types
 */
export type NotificationType =
  | 'like'
  | 'comment'
  | 'event_announced'
  | 'event_reminder'
  | 'community_joined'
  | 'notice_published';

/**
 * Notification grouping timeframe
 */
export type NotificationTimeframe = 'Today' | 'Yesterday' | 'Earlier';

/**
 * Complete campus notification model
 */
export interface CampusNotification {
  readonly id: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly timeAgo: string;
  readonly timestamp: string;
  readonly timeframe: NotificationTimeframe;
  readonly isRead: boolean;
  readonly targetUrl?: string;
  readonly actor?: {
    readonly name: string;
    readonly handle?: string;
    readonly initials: string;
    readonly avatarUrl?: string;
  };
}
