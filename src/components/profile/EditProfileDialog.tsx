import { useState, useEffect, useRef, type FC, type FormEvent, type ChangeEvent } from 'react';
import type { StudentProfile } from '@/types';
import {
  X,
  Check,
  AlertCircle,
  Sparkles,
  User,
  AtSign,
  GraduationCap,
  Calendar,
  FileText,
  Code2,
  Heart,
  Camera,
  Trash2,
  Palette,
  Upload,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  validateImageFile,
  resizeAndCompressImage,
  bannerPresets,
} from '@/lib/imageUtils';
import { computeInitials } from '@/hooks/useStudentProfile';
import { cn } from '@/lib/utils';

interface EditProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  onSave: (updated: Partial<StudentProfile>) => void;
}

interface FormErrors {
  name?: string;
  handle?: string;
  major?: string;
  academicYearTitle?: string;
}

export const EditProfileDialog: FC<EditProfileDialogProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [name, setName] = useState(profile.name);
  const [handle, setHandle] = useState(profile.handle.replace(/^@/, ''));
  const [major, setMajor] = useState(profile.major);
  const [academicYearTitle, setAcademicYearTitle] = useState(profile.academicYearTitle);
  const [bio, setBio] = useState(profile.bio);
  const [skillsInput, setSkillsInput] = useState(profile.skills.join(', '));
  const [interestsInput, setInterestsInput] = useState(profile.interests.join(', '));

  // Custom Avatar & Banner states
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(profile.avatarUrl);
  const [bannerUrl, setBannerUrl] = useState<string | undefined>(profile.bannerUrl);
  const [bannerGradient, setBannerGradient] = useState<string>(
    profile.bannerGradient || 'from-indigo-800 via-indigo-600 to-indigo-900'
  );
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [isProcessingBanner, setIsProcessingBanner] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);


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

  // Image Upload Handlers
  const handleAvatarFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setAvatarError(validation.error || 'Invalid image file');
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      return;
    }

    try {
      setIsProcessingAvatar(true);
      const compressedDataUrl = await resizeAndCompressImage(file, {
        maxWidth: 256,
        maxHeight: 256,
        quality: 0.85,
        cropToRatio: 1,
      });
      setAvatarUrl(compressedDataUrl);
    } catch (err) {
      console.error('Failed to process avatar image:', err);
      setAvatarError('Failed to process image. Please try another file.');
    } finally {
      setIsProcessingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(undefined);
    setAvatarError(null);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const handleBannerFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBannerError(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setBannerError(validation.error || 'Invalid banner image file');
      if (bannerInputRef.current) bannerInputRef.current.value = '';
      return;
    }

    try {
      setIsProcessingBanner(true);
      const compressedDataUrl = await resizeAndCompressImage(file, {
        maxWidth: 1200,
        maxHeight: 400,
        quality: 0.82,
        cropToRatio: 3,
      });
      setBannerUrl(compressedDataUrl);
    } catch (err) {
      console.error('Failed to process banner image:', err);
      setBannerError('Failed to process image. Please try another file.');
    } finally {
      setIsProcessingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  const handleRemoveBanner = () => {
    setBannerUrl(undefined);
    setBannerError(null);
    if (bannerInputRef.current) bannerInputRef.current.value = '';
  };

  // Parse comma-separated strings into trimmed arrays for live preview
  const parsedSkills = skillsInput
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const parsedInterests = interestsInput
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Full name must be at least 2 characters';
    }

    if (!handle.trim()) {
      newErrors.handle = 'Username is required';
    } else if (!/^[a-zA-Z0-9_]+$/.test(handle.trim())) {
      newErrors.handle = 'Username can only contain letters, numbers, and underscores';
    }

    if (!major.trim()) {
      newErrors.major = 'Department / Major is required';
    }

    if (!academicYearTitle.trim()) {
      newErrors.academicYearTitle = 'Academic year is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Extract graduation year number if present (e.g. from "Class of 2027")
    const yearMatch = academicYearTitle.match(/20\d\d/);
    const gradYear = yearMatch ? parseInt(yearMatch[0], 10) : profile.graduationYear;

    onSave({
      name: name.trim(),
      handle: `@${handle.trim()}`,
      major: major.trim(),
      academicYearTitle: academicYearTitle.trim(),
      graduationYear: gradYear,
      bio: bio.trim(),
      skills: parsedSkills.length > 0 ? parsedSkills : profile.skills,
      interests: parsedInterests.length > 0 ? parsedInterests : profile.interests,
      avatarUrl,
      bannerUrl,
      bannerGradient,
    });

    setIsSavedSuccessfully(true);
    setTimeout(() => {
      setIsSavedSuccessfully(false);
      onClose();
    }, 900);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-slate-200 dark:border-dark-border overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-dark-border bg-slate-50/70 dark:bg-dark-surface/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60">
              <User size={18} />
            </div>
            <div>
              <h2
                id="edit-profile-dialog-title"
                className="text-base font-bold text-slate-900 dark:text-dark-text-main leading-snug"
              >
                Edit Student Profile
              </h2>
              <p className="text-xs text-slate-500 dark:text-dark-text-muted">
                Update your photos, campus identity, and academic details.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-dark-text-muted hover:text-slate-700 dark:hover:text-dark-text-main hover:bg-slate-100 dark:hover:bg-dark-elevated transition-colors cursor-pointer"
            aria-label="Close edit profile dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {isSavedSuccessfully && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-fadeIn">
                <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold">
                  Profile updated and persisted successfully! 🎉
                </span>
              </div>
            )}

            {/* Hidden File Inputs */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleAvatarFileChange}
              className="hidden"
              aria-label="Upload profile photo"
            />
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleBannerFileChange}
              className="hidden"
              aria-label="Upload profile banner"
            />

            {/* Profile Cover / Banner Section */}
            <div className="space-y-2.5 p-3.5 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-dark-surface/40">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-dark-text-main flex items-center gap-1.5">
                  <Palette size={14} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Profile Cover Banner</span>
                </label>
                {bannerUrl && (
                  <Badge variant="indigo" className="text-[10px]">
                    Custom Image
                  </Badge>
                )}
              </div>

              {/* Banner Live Preview */}
              <div className="relative w-full h-24 sm:h-28 rounded-lg overflow-hidden border border-slate-200 dark:border-dark-border shadow-2xs group">
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt="Cover banner preview"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div
                    className={cn(
                      'w-full h-full bg-gradient-to-r flex items-center justify-center relative',
                      bannerGradient
                    )}
                  >
                    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
                    <span className="relative z-10 px-2.5 py-1 rounded-full bg-black/25 backdrop-blur-xs text-white text-[11px] font-medium">
                      Theme Gradient Preset
                    </span>
                  </div>
                )}
              </div>

              {/* Banner Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isProcessingBanner}
                    onClick={() => bannerInputRef.current?.click()}
                    className="text-xs h-8 gap-1.5 cursor-pointer"
                  >
                    {isProcessingBanner ? (
                      <Loader2 size={13} className="animate-spin text-indigo-600" />
                    ) : (
                      <Upload size={13} />
                    )}
                    <span>{bannerUrl ? 'Change Cover' : 'Upload Cover'}</span>
                  </Button>

                  {bannerUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveBanner}
                      className="text-xs h-8 gap-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </Button>
                  )}
                </div>

                <span className="text-[11px] text-slate-400 dark:text-dark-text-muted">
                  PNG, JPG up to 6MB
                </span>
              </div>

              {bannerError && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle size={11} /> {bannerError}
                </p>
              )}

              {/* Banner Gradient Presets Picker */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-dark-border">
                <span className="text-[11px] font-medium text-slate-500 dark:text-dark-text-muted block mb-1.5">
                  Or select a styled gradient preset:
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {bannerPresets.map((preset) => {
                    const isSelected = !bannerUrl && bannerGradient === preset.gradient;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setBannerGradient(preset.gradient);
                          setBannerUrl(undefined);
                        }}
                        title={preset.name}
                        className={cn(
                          'relative h-9 rounded-md bg-gradient-to-r transition-all overflow-hidden cursor-pointer border',
                          preset.gradient,
                          isSelected
                            ? 'ring-2 ring-indigo-500 ring-offset-1 border-white dark:ring-offset-dark-card scale-95 shadow-xs'
                            : 'border-black/10 opacity-80 hover:opacity-100 hover:scale-[1.02]'
                        )}
                      >
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                            <Check size={14} className="text-white drop-shadow-xs" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Profile Avatar / PFP Section */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-dark-surface/40">
              <label className="text-xs font-semibold text-slate-700 dark:text-dark-text-main flex items-center gap-1.5 mb-2.5">
                <Camera size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span>Profile Picture (PFP)</span>
              </label>

              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <Avatar
                    src={avatarUrl}
                    initials={computeInitials(name || profile.name)}
                    size="xl"
                    alt={name || profile.name}
                    className="h-16 w-16 sm:h-20 sm:w-20 ring-4 ring-white dark:ring-dark-card shadow-sm text-lg font-bold"
                  />
                  {isProcessingAvatar && (
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                      <Loader2 size={18} className="animate-spin text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isProcessingAvatar}
                      onClick={() => avatarInputRef.current?.click()}
                      className="text-xs h-8 gap-1.5 cursor-pointer"
                    >
                      <Upload size={13} />
                      <span>{avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                    </Button>

                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveAvatar}
                        className="text-xs h-8 gap-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>Remove Photo</span>
                      </Button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-dark-text-muted leading-tight">
                    PNG, JPG, or WebP up to 5MB. If no custom photo is chosen, dynamic colored initials will display.
                  </p>

                  {avatarError && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <AlertCircle size={11} /> {avatarError}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Name & Username Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-dark-text-main flex items-center gap-1">
                  <User size={13} className="text-slate-400 dark:text-dark-text-muted" />
                  <span>Full Name *</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="e.g. Nayan Kalita"
                  className={errors.name ? 'border-rose-300 focus:border-rose-500' : ''}
                />
                {errors.name && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-0.5">
                    <AlertCircle size={11} /> {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-dark-text-main flex items-center gap-1">
                  <AtSign size={13} className="text-slate-400 dark:text-dark-text-muted" />
                  <span>Username / Handle *</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-semibold text-slate-400 dark:text-dark-text-muted">
                    @
                  </span>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => {
                      setHandle(e.target.value.replace(/^@/, ''));
                      if (errors.handle) setErrors((prev) => ({ ...prev, handle: undefined }));
                    }}
                    placeholder="nayankalita"
                    className={`flex h-9 w-full rounded-lg border bg-white dark:bg-dark-card pl-7 pr-3 py-1 text-sm text-slate-900 dark:text-dark-text-main shadow-xs transition-colors placeholder:text-slate-400 dark:placeholder:text-dark-text-muted focus-visible:outline-none focus-visible:border-indigo-500 focus-visible:ring-1 focus-visible:ring-indigo-500 ${
                      errors.handle ? 'border-rose-300 dark:border-rose-500' : 'border-slate-200 dark:border-dark-border'
                    }`}
                  />
                </div>
                {errors.handle && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-0.5">
                    <AlertCircle size={11} /> {errors.handle}
                  </p>
                )}
              </div>
            </div>

            {/* Department & Academic Year Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-dark-text-main flex items-center gap-1">
                  <GraduationCap size={13} className="text-slate-400 dark:text-dark-text-muted" />
                  <span>Department / Major *</span>
                </label>
                <Input
                  value={major}
                  onChange={(e) => {
                    setMajor(e.target.value);
                    if (errors.major) setErrors((prev) => ({ ...prev, major: undefined }));
                  }}
                  placeholder="e.g. Computer Science & HCI"
                  className={errors.major ? 'border-rose-300' : ''}
                />
                {errors.major && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-0.5">
                    <AlertCircle size={11} /> {errors.major}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-dark-text-main flex items-center gap-1">
                  <Calendar size={13} className="text-slate-400 dark:text-dark-text-muted" />
                  <span>Academic Year *</span>
                </label>
                <Input
                  value={academicYearTitle}
                  onChange={(e) => {
                    setAcademicYearTitle(e.target.value);
                    if (errors.academicYearTitle)
                      setErrors((prev) => ({ ...prev, academicYearTitle: undefined }));
                  }}
                  placeholder="e.g. Junior (Class of 2027)"
                  className={errors.academicYearTitle ? 'border-rose-300' : ''}
                />
                {errors.academicYearTitle && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-0.5">
                    <AlertCircle size={11} /> {errors.academicYearTitle}
                  </p>
                )}
              </div>
            </div>

            {/* Bio Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-dark-text-main flex items-center gap-1">
                  <FileText size={13} className="text-slate-400 dark:text-dark-text-muted" />
                  <span>Campus Bio</span>
                </label>
                <span className="text-[11px] text-slate-400 dark:text-dark-text-muted">{bio.length}/350</span>
              </div>
              <textarea
                rows={3}
                maxLength={350}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell other students about your interests, study circles, projects, or campus activities..."
                className="w-full resize-none rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card p-3 text-xs sm:text-sm text-slate-900 dark:text-dark-text-main placeholder:text-slate-400 dark:placeholder:text-dark-text-muted focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors leading-relaxed"
              />
            </div>

            {/* Skills Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-dark-text-main flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Code2 size={13} className="text-slate-400 dark:text-dark-text-muted" />
                  <span>Skills & Tools (Comma separated)</span>
                </span>
                <span className="text-[11px] text-slate-400 dark:text-dark-text-muted font-normal">
                  {parsedSkills.length} skills listed
                </span>
              </label>
              <Input
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="React, TypeScript, Figma, Python, UI/UX"
              />
              {parsedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {parsedSkills.map((skill) => (
                    <Badge key={skill} variant="indigo" className="text-[11px]">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Interests Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-dark-text-main flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Heart size={13} className="text-slate-400 dark:text-dark-text-muted" />
                  <span>Campus Interests & Hobbies (Comma separated)</span>
                </span>
                <span className="text-[11px] text-slate-400 dark:text-dark-text-muted font-normal">
                  {parsedInterests.length} interests
                </span>
              </label>
              <Input
                value={interestsInput}
                onChange={(e) => setInterestsInput(e.target.value)}
                placeholder="Human-Centered AI, Rock Climbing, Open Source, Specialty Coffee"
              />
              {parsedInterests.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {parsedInterests.map((interest) => (
                    <span
                      key={interest}
                      className="text-[11px] font-medium text-slate-700 dark:text-dark-text-main bg-slate-100 dark:bg-dark-surface border border-slate-200 dark:border-dark-border px-2 py-0.5 rounded-full"
                    >
                      {interest}
                    </span>
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
              className="gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Save Changes</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
