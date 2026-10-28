import { useState, useEffect, type FC, type FormEvent } from 'react';
import {
  X,
  Compass,
  Sparkles,
  AlertCircle,
  Calendar,
  User,
  Tag,
  FileText,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const CLUB_CATEGORIES = [
  'Academic Clubs',
  'Tech & Coding',
  'Arts & Music',
  'Sports & Fitness',
  'Cultural',
] as const;

interface CreateClubDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateClub: (clubData: {
    name: string;
    category: string;
    description: string;
    schedule: string;
    coordinatorName: string;
    activities: string[];
  }) => void;
  defaultCoordinatorName?: string;
}

interface FormErrors {
  name?: string;
  category?: string;
  description?: string;
}

export const CreateClubDialog: FC<CreateClubDialogProps> = ({
  isOpen,
  onClose,
  onCreateClub,
  defaultCoordinatorName = 'Nayan Kalita',
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Tech & Coding');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('');
  const [coordinatorName, setCoordinatorName] = useState(defaultCoordinatorName);
  const [activitiesInput, setActivitiesInput] = useState('');

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);


  if (!isOpen) return null;

  const parsedActivities = activitiesInput
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Club name is required';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Club name must be at least 3 characters';
    }

    if (!category.trim()) {
      newErrors.category = 'Please select a club category';
    }

    if (!description.trim()) {
      newErrors.description = 'Short description is required';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onCreateClub({
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      schedule: schedule.trim() || 'Schedule TBA • Check with Coordinator',
      coordinatorName: coordinatorName.trim() || defaultCoordinatorName,
      activities: parsedActivities.length > 0 ? parsedActivities : ['Campus Collaboration', 'Student Projects'],
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-club-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-slate-200 dark:border-dark-border overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-dark-border bg-slate-50/70 dark:bg-dark-surface/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60">
              <Compass size={18} />
            </div>
            <div>
              <h2
                id="create-club-dialog-title"
                className="text-base font-bold text-slate-900 dark:text-dark-text-main leading-snug"
              >
                Register a New Student Club
              </h2>
              <p className="text-xs text-slate-500 dark:text-dark-text-muted">
                Create an official campus organization and invite students to join.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-dark-text-muted hover:text-slate-700 dark:hover:text-dark-text-main hover:bg-slate-100 dark:hover:bg-dark-elevated transition-colors cursor-pointer"
            aria-label="Close register club dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
            {isSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-fadeIn">
                <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold">
                  Club registered successfully! You are now the founder and lead member. 🎉
                </span>
              </div>
            )}

            {/* 1. Club Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-dark-text-main flex items-center gap-1">
                <Compass size={13} className="text-indigo-600 dark:text-indigo-400" />
                <span>Club Name *</span>
              </label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="e.g. Open Source & Web Developers Circle"
                className={errors.name ? 'border-rose-300 focus:border-rose-500' : ''}
              />
              {errors.name && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-0.5">
                  <AlertCircle size={11} /> {errors.name}
                </p>
              )}
            </div>

            {/* 2. Category Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-dark-text-main flex items-center gap-1">
                <Tag size={13} className="text-indigo-600 dark:text-indigo-400" />
                <span>Category *</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CLUB_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategory(cat);
                      if (errors.category) setErrors((prev) => ({ ...prev, category: undefined }));
                    }}
                    className={`px-3 py-2 text-xs font-medium rounded-xl border text-left transition-all cursor-pointer ${
                      category === cat
                        ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold shadow-2xs'
                        : 'border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-600 dark:text-dark-text-muted hover:bg-slate-50 dark:hover:bg-dark-elevated'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-0.5">
                  <AlertCircle size={11} /> {errors.category}
                </p>
              )}
            </div>

            {/* 3. Short Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-dark-text-main flex items-center gap-1">
                  <FileText size={13} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Short Description *</span>
                </label>
                <span className="text-[11px] text-slate-400 dark:text-dark-text-muted">
                  {description.length}/300
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={300}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description)
                    setErrors((prev) => ({ ...prev, description: undefined }));
                }}
                placeholder="Briefly describe what your club does, project goals, and who should join..."
                className={`w-full resize-none rounded-xl border bg-white dark:bg-dark-card p-3 text-xs sm:text-sm text-slate-900 dark:text-dark-text-main placeholder:text-slate-400 dark:placeholder:text-dark-text-muted focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors ${
                  errors.description
                    ? 'border-rose-300 dark:border-rose-500'
                    : 'border-slate-200 dark:border-dark-border'
                }`}
              />
              {errors.description && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-0.5">
                  <AlertCircle size={11} /> {errors.description}
                </p>
              )}
            </div>

            {/* 4. Meeting Schedule & Club Coordinator Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Meeting Schedule */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-dark-text-main flex items-center gap-1">
                  <Calendar size={13} className="text-slate-400 dark:text-dark-text-muted" />
                  <span>Meeting Schedule</span>
                </label>
                <Input
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="e.g. Meets Thursdays • 5:30 PM"
                />
              </div>

              {/* Club Coordinator */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-dark-text-main flex items-center gap-1">
                  <User size={13} className="text-slate-400 dark:text-dark-text-muted" />
                  <span>Club Coordinator</span>
                </label>
                <Input
                  value={coordinatorName}
                  onChange={(e) => setCoordinatorName(e.target.value)}
                  placeholder="e.g. Nayan Kalita"
                />
              </div>
            </div>

            {/* 5. Activities or Interests */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-dark-text-main flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Sparkles size={13} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Activities & Interests (Comma separated)</span>
                </span>
                <span className="text-[11px] text-slate-400 dark:text-dark-text-muted font-normal">
                  {parsedActivities.length} added
                </span>
              </label>
              <Input
                value={activitiesInput}
                onChange={(e) => setActivitiesInput(e.target.value)}
                placeholder="e.g. Hackathons, Open Source, React, Python, Code Reviews"
              />
              {parsedActivities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {parsedActivities.map((act) => (
                    <Badge key={act} variant="indigo" className="text-[11px]">
                      {act}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-dark-border bg-slate-50/70 dark:bg-dark-surface/70">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="gap-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles size={14} />
              <span>Create Club</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
