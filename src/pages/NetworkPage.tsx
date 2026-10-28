import { useState, useMemo, type FC } from 'react';
import { Users, UserPlus, Search, Check, CheckCircle2, X } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';

interface PeerStudent {
  id: string;
  name: string;
  initials: string;
  major: string;
  year: string;
  role: string;
  subjects: string[];
}

const mockPeers: PeerStudent[] = [
  {
    id: 'peer_1',
    name: 'Neha Patel',
    initials: 'NP',
    major: 'Computer Science',
    year: 'Senior (2026)',
    role: 'Peer Tutor',
    subjects: ['Data Structures', 'Algorithms', 'TypeScript'],
  },
  {
    id: 'peer_2',
    name: 'Sagar Sharma',
    initials: 'SS',
    major: 'Data Science & Math',
    year: 'Junior (2027)',
    role: 'Study Buddy',
    subjects: ['Linear Algebra', 'Probability', 'Python'],
  },
  {
    id: 'peer_3',
    name: 'Priya Saikia',
    initials: 'PS',
    major: 'Electrical Engineering',
    year: 'Sophomore (2028)',
    role: 'Project Partner',
    subjects: ['Circuit Theory', 'Embedded Systems', 'C++'],
  },
  {
    id: 'peer_4',
    name: 'Rohit Verma',
    initials: 'RV',
    major: 'Mechanical Engineering',
    year: 'Junior (2027)',
    role: 'Lab Partner',
    subjects: ['Thermodynamics', 'CAD Modeling', 'MATLAB'],
  },
  {
    id: 'peer_5',
    name: 'Sneha Deka',
    initials: 'SD',
    major: 'Cognitive Science & HCI',
    year: 'Senior (2026)',
    role: 'Design Mentor',
    subjects: ['User Research', 'Figma', 'Interaction Design'],
  },
  {
    id: 'peer_6',
    name: 'Ishita Choudhury',
    initials: 'IC',
    major: 'Business & Computer Science',
    year: 'Senior (2026)',
    role: 'Founder Circle',
    subjects: ['Venture Capital', 'Product Strategy', 'Fintech'],
  },
];

const NETWORK_CONNECTED_KEY = 'campus_connect_connected_peers';

export const NetworkPage: FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [connectedPeerIds, setConnectedPeerIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(NETWORK_CONNECTED_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch {
      // ignore
    }
    return new Set(['peer_1']);
  });

  const [feedback, setFeedback] = useState<string | null>(null);

  const triggerFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => {
      setFeedback((current) => (current === message ? null : current));
    }, 3200);
  };

  const handleToggleConnect = (peer: PeerStudent) => {
    const isConnected = connectedPeerIds.has(peer.id);
    const next = new Set(connectedPeerIds);

    if (isConnected) {
      next.delete(peer.id);
      triggerFeedback(`Disconnected from ${peer.name}.`);
    } else {
      next.add(peer.id);
      triggerFeedback(`Connection request accepted with ${peer.name}! You can now share study circle notes.`);
    }

    setConnectedPeerIds(next);
    try {
      localStorage.setItem(NETWORK_CONNECTED_KEY, JSON.stringify(Array.from(next)));
    } catch {
      // ignore
    }
  };

  // Filter peers by search query
  const filteredPeers = useMemo(() => {
    if (!searchQuery.trim()) return mockPeers;
    const q = searchQuery.toLowerCase().trim();

    return mockPeers.filter((peer) => {
      const matchesName = peer.name.toLowerCase().includes(q);
      const matchesMajor = peer.major.toLowerCase().includes(q);
      const matchesYear = peer.year.toLowerCase().includes(q);
      const matchesRole = peer.role.toLowerCase().includes(q);
      const matchesSubjects = peer.subjects.some((s) => s.toLowerCase().includes(q));

      return matchesName || matchesMajor || matchesYear || matchesRole || matchesSubjects;
    });
  }, [searchQuery]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <PageHeader
        title="Student Network & Study Circles"
        description="Connect with classmates, form study groups, and find upperclassmen mentors in your department."
        badge={<Badge variant="success">{14 + connectedPeerIds.size - 1} Connections</Badge>}
      >
        <Button
          variant="primary"
          size="sm"
          className="gap-1.5 cursor-pointer shadow-xs"
          onClick={() =>
            triggerFeedback('Study partner match preferences updated! We will notify you when a classmate shares courses.')
          }
        >
          <UserPlus size={16} />
          <span>Find Study Partner</span>
        </Button>
      </PageHeader>

      {/* Feedback Toast */}
      {feedback && (
        <div className="flex items-center justify-between p-3.5 rounded-xl border text-xs sm:text-sm bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="font-medium">{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 dark:text-dark-text-muted dark:hover:text-dark-text-main p-1 rounded-md"
            aria-label="Dismiss feedback message"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="max-w-md relative">
        <Input
          placeholder="Filter by major, subject, or graduation year..."
          icon={<Search size={15} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 text-xs bg-white dark:bg-dark-card border-slate-200 dark:border-dark-border"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-dark-text-muted hover:text-slate-600 dark:hover:text-dark-text-main p-0.5"
            aria-label="Clear peer search"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Suggested Peers Grid */}
      {filteredPeers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPeers.map((peer) => {
            const isConnected = connectedPeerIds.has(peer.id);

            return (
              <Card key={peer.id} hoverable className="flex flex-col justify-between">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar initials={peer.initials} size="lg" isOnline={true} />
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-text-main">
                          {peer.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-dark-text-muted">
                          {peer.major} • {peer.year}
                        </p>
                        <Badge variant="indigo" className="mt-1 text-[10px]">
                          {peer.role}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">
                      Shared Subjects
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {peer.subjects.map((sub) => (
                        <span
                          key={sub}
                          className="text-[11px] font-medium bg-slate-100 dark:bg-dark-elevated text-slate-700 dark:text-dark-text-muted px-2 py-0.5 rounded-md"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant={isConnected ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => handleToggleConnect(peer)}
                    className={cn(
                      'w-full text-xs h-8 cursor-pointer transition-colors',
                      isConnected &&
                        'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60 dark:hover:bg-rose-950/60 dark:hover:text-rose-400'
                    )}
                  >
                    {isConnected ? (
                      <span className="inline-flex items-center gap-1.5 font-semibold">
                        <Check size={13} className="stroke-[2.5]" />
                        <span>Connected</span>
                      </span>
                    ) : (
                      <span>Connect</span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200/80 dark:border-dark-border p-8 text-center shadow-xs">
          <EmptyState
            icon={Users}
            title="No peers found"
            description={`No classmates matched your search "${searchQuery}". Try searching by course name or major.`}
            actionLabel="Clear Search"
            onAction={() => setSearchQuery('')}
          />
        </div>
      )}

      {/* Build Circle banner */}
      <EmptyState
        icon={Users}
        title="Build your campus circle"
        description="Forming study circles with classmates has been shown to boost semester GPA by up to 25%. Invite peers to join your circle."
        actionLabel="Create Study Circle"
        onAction={() =>
          triggerFeedback('Study Circle invitation link copied! Share it with classmates to start collaborating.')
        }
      />
    </div>
  );
};
