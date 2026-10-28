import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CampusCommunity } from '@/types';
import { initialCampusCommunities } from '@/data/mockData';

export const COMMUNITIES_STORAGE_KEY = 'campus_connect_joined_communities';
const COMMUNITIES_UPDATED_EVENT = 'campus_connect_communities_updated';

/**
 * Reads stored joined community IDs set from localStorage
 */
function getStoredJoinedIds(): Set<string> {
  if (typeof window === 'undefined') {
    return new Set(initialCampusCommunities.filter((c) => c.isJoined).map((c) => c.id));
  }

  try {
    const raw = localStorage.getItem(COMMUNITIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch (error) {
    console.error('Failed to parse joined communities from localStorage:', error);
  }

  // Default initial joined IDs from mock data (comm_coding, comm_entrepreneurship, comm_design)
  const defaultJoined = initialCampusCommunities.filter((c) => c.isJoined).map((c) => c.id);
  return new Set(defaultJoined);
}

/**
 * Builds merged communities list with current joined status and adjusted member count from localStorage
 */
function getHydratedCommunities(): CampusCommunity[] {
  const joinedIds = getStoredJoinedIds();

  return initialCampusCommunities.map((community) => {
    const isJoined = joinedIds.has(community.id);
    const baseCount = community.membersCount;
    let membersCount = baseCount;

    if (isJoined && !community.isJoined) {
      membersCount = baseCount + 1;
    } else if (!isJoined && community.isJoined) {
      membersCount = Math.max(0, baseCount - 1);
    }

    return {
      ...community,
      isJoined,
      membersCount,
    };
  });
}

/**
 * Custom hook for student communities management with persistent localStorage synchronization
 */
export function useCampusCommunities() {
  const [communities, setCommunities] = useState<CampusCommunity[]>(getHydratedCommunities);

  useEffect(() => {
    const handleCommunitiesUpdated = () => {
      setCommunities(getHydratedCommunities());
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === COMMUNITIES_STORAGE_KEY) {
        setCommunities(getHydratedCommunities());
      }
    };

    window.addEventListener(COMMUNITIES_UPDATED_EVENT, handleCommunitiesUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(COMMUNITIES_UPDATED_EVENT, handleCommunitiesUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const joinedCount = useMemo(() => {
    return communities.filter((c) => c.isJoined).length;
  }, [communities]);

  const toggleJoin = useCallback((communityId: string): { isJoined: boolean; communityName: string } => {
    const joinedIds = getStoredJoinedIds();
    const currentlyJoined = joinedIds.has(communityId);
    let nextJoined = false;

    if (currentlyJoined) {
      joinedIds.delete(communityId);
      nextJoined = false;
    } else {
      joinedIds.add(communityId);
      nextJoined = true;
    }

    // Persist to localStorage
    try {
      localStorage.setItem(
        COMMUNITIES_STORAGE_KEY,
        JSON.stringify(Array.from(joinedIds))
      );
    } catch (error) {
      console.error('Failed to save joined community to localStorage:', error);
    }

    // Update state and dispatch custom notification event
    const updated = getHydratedCommunities();
    setCommunities(updated);
    window.dispatchEvent(new CustomEvent(COMMUNITIES_UPDATED_EVENT));

    const target = updated.find((c) => c.id === communityId);
    return {
      isJoined: nextJoined,
      communityName: target?.name || 'Community',
    };
  }, []);

  const isJoined = useCallback(
    (communityId: string) => {
      return communities.some((c) => c.id === communityId && c.isJoined);
    },
    [communities]
  );

  return {
    communities,
    joinedCount,
    toggleJoin,
    isJoined,
  };
}
