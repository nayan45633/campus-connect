import type { FC } from 'react';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const NotFoundPage: FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 shadow-sm dark:shadow-none mb-4">
        <Compass size={32} />
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-1">
        Error 404
      </span>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-dark-text-main mb-2">
        Campus Trail Not Found
      </h1>
      <p className="text-sm text-slate-500 dark:text-dark-text-muted max-w-md mb-6 leading-relaxed">
        The campus page or student resource you are looking for has been moved, renamed, or doesn't exist.
      </p>

      <div className="flex items-center gap-3">
        <Link to="/">
          <Button variant="primary" size="md" className="gap-2">
            <Home size={16} />
            <span>Return to Home Feed</span>
          </Button>
        </Link>
        <Button
          variant="outline"
          size="md"
          className="gap-2"
          onClick={() => window.history.back()}
        >
          <ArrowLeft size={16} />
          <span>Go Back</span>
        </Button>
      </div>
    </div>
  );
};
