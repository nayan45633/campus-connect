import { useState, useMemo, type FC } from 'react';
import { Compass, Search, Calendar, Plus, CheckCircle2, X, Check, Users } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useStudentProfile, computeInitials } from '@/hooks/useStudentProfile';
import {
  ClubDetailsDialog,
  type CampusClub,
} from '@/components/explore/ClubDetailsDialog';
import { CreateClubDialog } from '@/components/explore/CreateClubDialog';
import { cn } from '@/lib/utils';

export const initialClubs: CampusClub[] = [
  {
    id: 'club_ai_robotics',
    name: 'Campus AI & Robotics Society',
    category: 'Tech & Coding',
    badgeVariant: 'indigo',
    membersCount: 142,
    description:
      'Weekly hands-on machine learning projects, guest lectures from research labs, and collegiate hackathon teams.',
    fullDescription:
      'The Campus AI & Robotics Society is a student-led technical group focusing on autonomous navigation, deep learning architectures, computer vision, and applied robotics hardware. Members work on hands-on team projects, participate in collegiate engineering hackathons, and attend guest tech talks from industry research labs.',
    schedule: 'Meets Thursdays • 6:00 PM',
    scheduleColor: 'text-indigo-600 dark:text-indigo-400',
    coverGradient: 'from-indigo-700 via-indigo-600 to-indigo-950',
    location: 'Engineering Hall Bay 4 & Discord',
    coordinator: {
      name: 'Arjun Bora',
      role: 'President & Tech Lead',
      handle: '@arjunbora',
      email: 'robotics@campus.edu',
      avatarInitials: 'AB',
    },
    activities: [
      'Autonomous Drones',
      'PyTorch & Computer Vision',
      'Hackathon Sprints',
      'ROS2 Robotics Workshops',
      'Hardware Soldering',
    ],
    recentAnnouncements: [
      {
        id: 'ann_ai_1',
        title: 'Spring Hackathon Rover Telemetry Showcase',
        date: '2 days ago',
        content:
          'Our autonomous rover completed its obstacle course run! Join us this Thursday for a code walkthrough and PCB debrief.',
      },
      {
        id: 'ann_ai_2',
        title: 'Intro to Jetson Nano & PyTorch Workshop',
        date: 'Last week',
        content:
          'Hands-on edge AI setup session in Engineering Hall Bay 4. Bring your laptop and USB-C cables.',
      },
    ],
  },
  {
    id: 'club_design_hci',
    name: 'Design & Human-Computer Interaction',
    category: 'Academic Clubs',
    badgeVariant: 'success',
    membersCount: 96,
    description:
      'Figma design jams, portfolio critiques, user research sprints, and UI/UX design system workshops for all skill levels.',
    fullDescription:
      'Design & HCI connects aspiring product designers, design engineers, and researchers. We host weekly Figma design sprints, portfolio reviews, accessibility audits, and collaborative cross-discipline builds with student engineers to turn creative wireframes into working campus applications.',
    schedule: 'Meets Tuesdays • 5:30 PM',
    scheduleColor: 'text-emerald-600 dark:text-emerald-400',
    coverGradient: 'from-emerald-700 via-teal-600 to-cyan-950',
    location: 'Design Media Lab 3B',
    coordinator: {
      name: 'Rimon Das',
      role: 'Design Lead & Coordinator',
      handle: '@rimondas',
      email: 'designhci@campus.edu',
      avatarInitials: 'RD',
    },
    activities: [
      'Figma Prototyping',
      'Design Systems',
      'User Research Sprints',
      'Accessibility Audits',
      'Portfolio Reviews',
    ],
    recentAnnouncements: [
      {
        id: 'ann_des_1',
        title: 'Design System Tokens & Micro-Interactions Clinic',
        date: 'Yesterday',
        content:
          'Hands-on clinic covering component states and token scaling for light/dark interfaces.',
      },
      {
        id: 'ann_des_2',
        title: 'Annual Student Portfolio Review Night',
        date: 'March 14',
        content:
          'Get 1-on-1 feedback on your UX case studies from alumni senior designers.',
      },
    ],
  },
  {
    id: 'club_photography',
    name: 'Campus Photography Collective',
    category: 'Arts & Music',
    badgeVariant: 'accent',
    membersCount: 68,
    description:
      'Photo walks around the campus, darkroom film development, Lightroom workshops, and semester gallery exhibitions.',
    fullDescription:
      'The Photography Collective is a vibrant sanctuary for 35mm film lovers, mirrorless street photographers, and mobile creators. We host weekend golden hour photowalks around the city, maintain the campus darkroom with supplied chemistry, and curate the annual campus spring gallery show.',
    schedule: 'Meets Saturdays • 10:00 AM',
    scheduleColor: 'text-purple-600 dark:text-purple-400',
    coverGradient: 'from-purple-700 via-pink-600 to-indigo-900',
    location: 'Fine Arts Studio 2 & Darkroom',
    coordinator: {
      name: 'Priya Saikia',
      role: 'Lead Curator & Organizer',
      handle: '@priyasaikia',
      email: 'photo@campus.edu',
      avatarInitials: 'PS',
    },
    activities: [
      '35mm Film Chemistry',
      'Street & Architectural Walk',
      'Adobe Lightroom Color Grading',
      'Portrait Lighting',
      'Semester Print Gallery',
    ],
    recentAnnouncements: [
      {
        id: 'ann_photo_1',
        title: 'Golden Hour Quad Photo Walk',
        date: '3 days ago',
        content:
          'Join us at the North Quad fountain this Saturday at 10 AM. Film loaner cameras available for beginners!',
      },
      {
        id: 'ann_photo_2',
        title: 'Darkroom Chemistry Mixing Orientation',
        date: 'Last week',
        content:
          'Learn standard black-and-white developing techniques with Ilford chemistry.',
      },
    ],
  },
  {
    id: 'club_comp_prog',
    name: 'Competitive Programming Guild',
    category: 'Tech & Coding',
    badgeVariant: 'indigo',
    membersCount: 185,
    description:
      'Algorithmic problem-solving, dynamic programming drills, ICPC regional preparation, and technical interview whiteboard practice.',
    fullDescription:
      'Competitive Programming Guild trains passionate computer science and math students in competitive algorithms, advanced data structures, and rapid problem breakdown under time pressure. We host mock Codeforces rounds, LeetCode whiteboard sessions, and team qualifiers for regional ICPC contests.',
    schedule: 'Meets Mondays & Wednesdays • 6:30 PM',
    scheduleColor: 'text-indigo-600 dark:text-indigo-400',
    coverGradient: 'from-indigo-800 via-blue-700 to-slate-900',
    location: 'Math Building Lab 101',
    coordinator: {
      name: 'Aditya Roy',
      role: 'Head Coach & President',
      handle: '@adityaroy',
      email: 'icpc@campus.edu',
      avatarInitials: 'AR',
    },
    activities: [
      'Dynamic Programming',
      'Graph Theory & Network Flows',
      'ICPC Regional Prep',
      'Mock Interview Drills',
      'Codeforces Contests',
    ],
    recentAnnouncements: [
      {
        id: 'ann_cp_1',
        title: 'Segment Tree & Fenwick Tree Solutions Posted',
        date: 'Yesterday',
        content:
          'Solution write-ups for Wednesday contest problems C & D are available on the guild portal.',
      },
      {
        id: 'ann_cp_2',
        title: 'Spring Campus Algorithm Sprint 2026',
        date: 'March 18',
        content:
          'Register your 3-person team for our 4-hour intra-college programming sprint with sponsor prizes!',
      },
    ],
  },
  {
    id: 'club_debate',
    name: 'Intercollegiate Debate & Forensics',
    category: 'Cultural',
    badgeVariant: 'warning',
    membersCount: 74,
    description:
      'Parliamentary debate rounds, rhetoric masterclasses, policy debates, and regional collegiate public speaking invitationals.',
    fullDescription:
      'Intercollegiate Debate trains students in critical argumentation, persuasive public rhetoric, evidence synthesis, and fast-paced parliamentary debate styles. Members travel to regional invitationals and hone verbal agility valuable for careers in law, public policy, and leadership.',
    schedule: 'Meets Wednesdays • 7:00 PM',
    scheduleColor: 'text-amber-600 dark:text-amber-400',
    coverGradient: 'from-amber-600 via-orange-600 to-red-900',
    location: 'Student Union Hall 202',
    coordinator: {
      name: 'Sneha Deka',
      role: 'Debate Captain',
      handle: '@snehadeka',
      email: 'debate@campus.edu',
      avatarInitials: 'SD',
    },
    activities: [
      'Parliamentary Debate',
      'Policy Motions',
      'Public Speaking Masterclass',
      'Mock Courtroom Trials',
      'Regional Tournaments',
    ],
    recentAnnouncements: [
      {
        id: 'ann_deb_1',
        title: 'Open Practice: AI Ethics in Academic Publishing',
        date: '4 days ago',
        content:
          'Great debates during Wednesday motions! Congratulations to the proposition bench.',
      },
      {
        id: 'ann_deb_2',
        title: 'Inter-University Forensics Invitational Team Selection',
        date: 'March 22',
        content:
          'Team tryouts for the upcoming regional championship in April.',
      },
    ],
  },
  {
    id: 'club_badminton',
    name: 'Intramural Badminton & Squash Club',
    category: 'Sports & Fitness',
    badgeVariant: 'neutral',
    membersCount: 112,
    description:
      'Casual open court nights, friendly doubles ladders, collegiate tournament trips, and free racket stringing clinics.',
    fullDescription:
      'The Badminton & Squash Club is the premier recreational racquet community on campus. We welcome beginner players looking for friendly casual rallies as well as seasoned competitive players competing in inter-college doubles leagues. We provide complimentary shuttlecocks and court access.',
    schedule: 'Meets Fridays & Sundays • 5:00 PM',
    scheduleColor: 'text-emerald-600 dark:text-emerald-400',
    coverGradient: 'from-teal-600 via-cyan-600 to-blue-900',
    location: 'Recreation Center Court Bay 2',
    coordinator: {
      name: 'Rahul Das',
      role: 'Intramural Organizer',
      handle: '@rahuldas',
      email: 'sports@campus.edu',
      avatarInitials: 'RD',
    },
    activities: [
      'Casual Open Court Rallies',
      'Doubles Ladder Tournament',
      'Racket Stringing Clinics',
      'Footwork & Smashing Drills',
      'Weekend Intramurals',
    ],
    recentAnnouncements: [
      {
        id: 'ann_bad_1',
        title: 'Spring Doubles Championship Bracket Open',
        date: '5 days ago',
        content:
          'Sign up with your doubles partner at the Recreation Center desk by Friday.',
      },
      {
        id: 'ann_bad_2',
        title: 'Complimentary Yonex Racket Re-Stringing Session',
        date: 'Last Sunday',
        content:
          'Club stringing machine is operational in Court Bay 2.',
      },
    ],
  },
];

const categories = [
  'All Categories',
  'Academic Clubs',
  'Tech & Coding',
  'Arts & Music',
  'Sports & Fitness',
  'Cultural',
];

const EXPLORE_CLUBS_KEY = 'campus_connect_explore_clubs';
const EXPLORE_JOINED_KEY = 'campus_connect_explore_joined';

function getStoredClubs(): CampusClub[] {
  try {
    const raw = localStorage.getItem(EXPLORE_CLUBS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const initialMap = new Map(initialClubs.map((c) => [c.id, c]));
        const merged: CampusClub[] = [];

        for (const item of parsed) {
          if (initialMap.has(item.id)) {
            merged.push({ ...initialMap.get(item.id)!, ...item });
            initialMap.delete(item.id);
          } else {
            merged.push(item);
          }
        }

        for (const remaining of initialMap.values()) {
          merged.push(remaining);
        }

        return merged;
      }
    }
  } catch (err) {
    console.error('Failed to load clubs from localStorage:', err);
  }
  return initialClubs;
}

const getCategoryBadgeVariant = (
  cat: string
): 'indigo' | 'success' | 'accent' | 'warning' | 'neutral' => {
  switch (cat) {
    case 'Tech & Coding':
      return 'indigo';
    case 'Academic Clubs':
      return 'success';
    case 'Arts & Music':
      return 'accent';
    case 'Cultural':
      return 'warning';
    case 'Sports & Fitness':
      return 'neutral';
    default:
      return 'indigo';
  }
};

const getCategoryScheduleColor = (cat: string): string => {
  switch (cat) {
    case 'Tech & Coding':
      return 'text-indigo-600 dark:text-indigo-400';
    case 'Academic Clubs':
      return 'text-emerald-600 dark:text-emerald-400';
    case 'Arts & Music':
      return 'text-purple-600 dark:text-purple-400';
    case 'Cultural':
      return 'text-amber-600 dark:text-amber-400';
    case 'Sports & Fitness':
      return 'text-emerald-600 dark:text-emerald-400';
    default:
      return 'text-indigo-600 dark:text-indigo-400';
  }
};

const getCategoryCoverGradient = (cat: string): string => {
  switch (cat) {
    case 'Tech & Coding':
      return 'from-indigo-700 via-indigo-600 to-indigo-950';
    case 'Academic Clubs':
      return 'from-emerald-700 via-teal-600 to-cyan-950';
    case 'Arts & Music':
      return 'from-purple-700 via-pink-600 to-indigo-900';
    case 'Cultural':
      return 'from-amber-600 via-orange-600 to-red-900';
    case 'Sports & Fitness':
      return 'from-teal-600 via-cyan-600 to-blue-900';
    default:
      return 'from-indigo-700 via-indigo-600 to-indigo-950';
  }
};

export const ExplorePage: FC = () => {
  const { profile } = useStudentProfile();
  const [clubs, setClubs] = useState<CampusClub[]>(getStoredClubs);
  const [activeCategory, setActiveCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected club for details modal
  const [selectedClub, setSelectedClub] = useState<CampusClub | null>(null);

  // Create club modal state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Persisted joined club membership IDs
  const [joinedClubIds, setJoinedClubIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(EXPLORE_JOINED_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch {
      // ignore
    }
    return new Set(['club_ai_robotics']);
  });

  const [feedback, setFeedback] = useState<string | null>(null);

  const triggerFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => {
      setFeedback((current) => (current === message ? null : current));
    }, 3500);
  };

  // Join / Leave club interaction
  const handleToggleJoinClub = (club: CampusClub) => {
    const isJoined = joinedClubIds.has(club.id);
    const next = new Set(joinedClubIds);

    if (isJoined) {
      next.delete(club.id);
      triggerFeedback(`Left "${club.name}". You will no longer receive club notifications.`);
    } else {
      next.add(club.id);
      triggerFeedback(`Joined "${club.name}"! Welcome to the club community circle.`);
    }

    setJoinedClubIds(next);
    try {
      localStorage.setItem(EXPLORE_JOINED_KEY, JSON.stringify(Array.from(next)));
    } catch {
      // ignore
    }
  };

  // Create new club submission handler
  const handleCreateClub = (newClubData: {
    name: string;
    category: string;
    description: string;
    schedule: string;
    coordinatorName: string;
    activities: string[];
  }) => {
    const newClubId = `club_${Date.now()}`;
    const badgeVariant = getCategoryBadgeVariant(newClubData.category);
    const scheduleColor = getCategoryScheduleColor(newClubData.category);
    const coverGradient = getCategoryCoverGradient(newClubData.category);

    const coordinatorHandle = `@${newClubData.coordinatorName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')}`;
    const coordinatorEmail = `${newClubData.coordinatorName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')}@campus.edu`;

    const newClub: CampusClub = {
      id: newClubId,
      name: newClubData.name,
      category: newClubData.category,
      badgeVariant,
      membersCount: 0, // base member count (user is added via joinedClubIds to make 1)
      description: newClubData.description,
      fullDescription: newClubData.description,
      schedule: newClubData.schedule,
      scheduleColor,
      coverGradient,
      location: 'Engineering Hall Bay 4 & Campus Discord',
      coordinator: {
        name: newClubData.coordinatorName,
        role: 'Club Founder & Lead Coordinator',
        handle: coordinatorHandle,
        email: coordinatorEmail,
        avatarInitials: computeInitials(newClubData.coordinatorName),
      },
      activities: newClubData.activities,
      recentAnnouncements: [
        {
          id: `ann_${Date.now()}`,
          title: `Welcome to ${newClubData.name}!`,
          date: 'Just now',
          content:
            'We are officially registered on Campus Connect! Kickoff meeting and project sprints are being scheduled.',
        },
      ],
    };

    const updatedClubs = [newClub, ...clubs];
    setClubs(updatedClubs);
    try {
      localStorage.setItem(EXPLORE_CLUBS_KEY, JSON.stringify(updatedClubs));
    } catch {
      // ignore
    }

    // Automatically join creator to their new club
    const nextJoined = new Set(joinedClubIds);
    nextJoined.add(newClubId);
    setJoinedClubIds(nextJoined);
    try {
      localStorage.setItem(EXPLORE_JOINED_KEY, JSON.stringify(Array.from(nextJoined)));
    } catch {
      // ignore
    }

    triggerFeedback(`"${newClub.name}" has been registered and added to Explore Campus Life! 🎉`);
  };

  // Filter clubs based on category and search query
  const filteredClubs = useMemo(() => {
    return clubs.filter((club) => {
      if (activeCategory !== 'All Categories' && club.category !== activeCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = club.name.toLowerCase().includes(q);
        const matchesDesc = club.description.toLowerCase().includes(q);
        const matchesCategory = club.category.toLowerCase().includes(q);
        const matchesActivities = club.activities?.some((a) => a.toLowerCase().includes(q));
        const matchesCoordinator = club.coordinator?.name.toLowerCase().includes(q);
        return Boolean(matchesName || matchesDesc || matchesCategory || matchesActivities || matchesCoordinator);
      }
      return true;
    });
  }, [clubs, activeCategory, searchQuery]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <PageHeader
        title="Explore Campus Life"
        description="Discover student organizations, academic workshops, hackathons, and recreational clubs across campus."
        badge={<Badge variant="indigo">{clubs.length} Clubs Active</Badge>}
      >
        <Button
          variant="primary"
          size="sm"
          className="gap-1.5 cursor-pointer shadow-xs"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus size={16} />
          <span>Register a Club</span>
        </Button>
      </PageHeader>

      {/* Feedback Notification Toast */}
      {feedback && (
        <div className="flex items-center justify-between p-3.5 rounded-xl border text-xs sm:text-sm bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="font-medium">{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 dark:text-dark-text-muted dark:hover:text-dark-text-main p-1 rounded-md cursor-pointer"
            aria-label="Dismiss feedback message"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-dark-surface p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
        <div className="w-full sm:max-w-xs relative">
          <Input
            placeholder="Search clubs, activities, or topics..."
            icon={<Search size={15} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 text-xs bg-slate-50 dark:bg-dark-card border-slate-200 dark:border-dark-border"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-dark-text-muted hover:text-slate-600 dark:hover:text-dark-text-main p-0.5 cursor-pointer"
              aria-label="Clear explore search"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none',
                activeCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-600 dark:text-dark-text-muted hover:bg-slate-50 dark:hover:bg-dark-elevated hover:text-slate-900 dark:hover:text-dark-text-main'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Club Cards Grid */}
      {filteredClubs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClubs.map((club) => {
            const isJoined = joinedClubIds.has(club.id);
            const memberCount = club.membersCount + (isJoined ? 1 : 0);

            return (
              <Card
                key={club.id}
                hoverable
                onClick={() => setSelectedClub(club)}
                className="flex flex-col justify-between cursor-pointer group transition-all duration-200 hover:border-indigo-300 dark:hover:border-indigo-500/70 hover:shadow-md"
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={club.badgeVariant}>{club.category}</Badge>
                    <span className="text-xs text-slate-400 dark:text-dark-text-muted flex items-center gap-1">
                      <Users size={12} />
                      <span>{memberCount} members</span>
                    </span>
                  </div>
                  <CardTitle className="text-base pt-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {club.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {club.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-dark-text-muted pt-3 border-t border-slate-100 dark:border-dark-border">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Calendar size={13} className={club.scheduleColor} /> {club.schedule}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hidden sm:inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        Details &rarr;
                      </span>
                      <Button
                        variant={isJoined ? 'outline' : 'soft'}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleJoinClub(club);
                        }}
                        className={cn(
                          'cursor-pointer transition-colors text-xs h-8',
                          isJoined &&
                            'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60 dark:hover:bg-rose-950/60 dark:hover:text-rose-400'
                        )}
                      >
                        {isJoined ? (
                          <>
                            <Check size={12} className="stroke-[2.5]" />
                            <span>Joined</span>
                          </>
                        ) : (
                          <span>Join Club</span>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200/80 dark:border-dark-border p-8 text-center shadow-xs">
          <EmptyState
            icon={Compass}
            title="No campus clubs found"
            description={`No student clubs matched your filter "${searchQuery || activeCategory}". Try searching with a different keyword or category.`}
            actionLabel="Reset Search & Filters"
            onAction={() => {
              setSearchQuery('');
              setActiveCategory('All Categories');
            }}
          />
        </div>
      )}

      {/* Bottom call to action banner */}
      <EmptyState
        icon={Compass}
        title="Looking for something specific?"
        description="Can't find the club you're looking for? Start a new campus initiative or connect with student council representatives."
        actionLabel="Start a New Student Club"
        onAction={() => setIsCreateDialogOpen(true)}
      />

      {/* 1. Club Details Dialog Modal */}
      <ClubDetailsDialog
        isOpen={Boolean(selectedClub)}
        club={selectedClub}
        isJoined={selectedClub ? joinedClubIds.has(selectedClub.id) : false}
        onClose={() => setSelectedClub(null)}
        onToggleJoin={handleToggleJoinClub}
      />

      {/* 2. Register / Create Club Dialog Modal */}
      {isCreateDialogOpen && (
        <CreateClubDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onCreateClub={handleCreateClub}
          defaultCoordinatorName={profile.name}
        />
      )}
    </div>
  );
};
