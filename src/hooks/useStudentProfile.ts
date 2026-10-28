import { useState, useEffect, useCallback } from 'react';
import type { StudentProfile } from '@/types';
import { defaultUserProfile } from '@/data/mockData';

export const PROFILE_STORAGE_KEY = 'campus_connect_student_profile';
const PROFILE_UPDATED_EVENT = 'campus_connect_profile_updated';

/**
 * Helper to safely read profile from localStorage
 */
export function getStoredStudentProfile(): StudentProfile {
  if (typeof window === 'undefined') return defaultUserProfile;

  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        // Seamlessly upgrade legacy demo identity 'Alex Rivera' to 'Nayan Kalita'
        if (parsed.name === 'Alex Rivera' || parsed.handle === '@alexrivera') {
          const upgraded: StudentProfile = {
            ...defaultUserProfile,
            avatarUrl: parsed.avatarUrl,
            bannerUrl: parsed.bannerUrl,
            bannerGradient: parsed.bannerGradient,
          };
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(upgraded));
          return upgraded;
        }

        return {
          ...defaultUserProfile,
          ...parsed,
          skills: Array.isArray(parsed.skills) && parsed.skills.length > 0 ? parsed.skills : defaultUserProfile.skills,
          interests: Array.isArray(parsed.interests) && parsed.interests.length > 0 ? parsed.interests : defaultUserProfile.interests,
        };
      }
    }
  } catch (error) {
    console.error('Failed to load profile from localStorage:', error);
  }

  return defaultUserProfile;
}

/**
 * Computes uppercase initials from a name (e.g. "Nayan Kalita" -> "NK")
 */
export function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'ST';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Hook to read and update student profile with reactive localStorage persistence
 */
export function useStudentProfile() {
  const [profile, setProfile] = useState<StudentProfile>(getStoredStudentProfile);

  useEffect(() => {
    const handleProfileUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<StudentProfile>;
      if (customEvent.detail) {
        setProfile(customEvent.detail);
      } else {
        setProfile(getStoredStudentProfile());
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === PROFILE_STORAGE_KEY) {
        setProfile(getStoredStudentProfile());
      }
    };

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const updateProfile = useCallback((updatedFields: Partial<StudentProfile>): StudentProfile => {
    const current = getStoredStudentProfile();

    // Auto-calculate initials if name was modified
    const initials = updatedFields.name
      ? computeInitials(updatedFields.name)
      : current.initials;

    // Ensure handle starts with '@'
    let handle = updatedFields.handle ?? current.handle;
    if (handle && !handle.startsWith('@')) {
      handle = `@${handle}`;
    }

    const newProfile: StudentProfile = {
      ...current,
      ...updatedFields,
      initials,
      handle,
      // Allow clearing avatarUrl or bannerUrl by passing empty string or null/undefined explicitly
      avatarUrl: 'avatarUrl' in updatedFields ? (updatedFields.avatarUrl || undefined) : current.avatarUrl,
      bannerUrl: 'bannerUrl' in updatedFields ? (updatedFields.bannerUrl || undefined) : current.bannerUrl,
      bannerGradient: updatedFields.bannerGradient ?? current.bannerGradient,
    };

    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
      // Dispatch custom event to notify all components (Header, Sidebar, Feed, Profile)
      window.dispatchEvent(
        new CustomEvent(PROFILE_UPDATED_EVENT, { detail: newProfile })
      );
    } catch (error) {
      console.error('Failed to save profile to localStorage:', error);
    }

    setProfile(newProfile);
    return newProfile;
  }, []);

  return {
    profile,
    updateProfile,
  };
}
