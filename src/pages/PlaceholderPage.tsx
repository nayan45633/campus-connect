import type { FC } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
}

export const PlaceholderPage: FC<PlaceholderPageProps> = ({
  title,
  description,
  icon: Icon,
  badge = 'Coming in Next Phase',
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        badge={<Badge variant="indigo">{badge}</Badge>}
      >
        <Link to="/">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft size={15} />
            <span>Back to Home</span>
          </Button>
        </Link>
      </PageHeader>

      <EmptyState
        icon={Icon}
        title={`${title} is on the roadmap`}
        description={`We are currently focusing on the central Campus Feed and interactive dashboard. Full interactive features for ${title.toLowerCase()} will arrive in the next release milestone.`}
        actionLabel="Return to Feed"
        onAction={() => navigate('/')}
      />
    </div>
  );
};
