import { useState, useEffect, useCallback } from 'react';
import type { CampusPost, PostCategory, StudentUser } from '@/types';
import { initialPosts } from '@/data/mockData';

export const POSTS_STORAGE_KEY = 'campus_connect_posts';
const POSTS_UPDATED_EVENT = 'campus_connect_posts_updated';

/**
 * Safely reads stored posts from localStorage or returns initial mock posts
 */
function getStoredPosts(): CampusPost[] {
  if (typeof window === 'undefined') return initialPosts;

  try {
    const raw = localStorage.getItem(POSTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((post) => ({
          ...post,
          comments: Array.isArray(post.comments) ? post.comments : [],
          tags: Array.isArray(post.tags) ? post.tags : [],
        }));
      }
    }
  } catch (error) {
    console.error('Failed to parse campus posts from localStorage:', error);
  }

  return initialPosts;
}

/**
 * Custom hook to manage campus feed posts with persistent localStorage synchronization
 */
export function useCampusPosts() {
  const [posts, setPosts] = useState<CampusPost[]>(getStoredPosts);

  useEffect(() => {
    const handlePostsUpdated = () => {
      setPosts(getStoredPosts());
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === POSTS_STORAGE_KEY) {
        setPosts(getStoredPosts());
      }
    };

    window.addEventListener(POSTS_UPDATED_EVENT, handlePostsUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(POSTS_UPDATED_EVENT, handlePostsUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  /**
   * Adds a new post to the top of the feed and saves to localStorage
   */
  const addPost = useCallback(
    (
      postData: { content: string; category: PostCategory; tags: string[] },
      author: StudentUser
    ): CampusPost => {
      const current = getStoredPosts();
      const newPost: CampusPost = {
        id: `post_${Date.now()}`,
        author,
        category: postData.category,
        content: postData.content,
        createdAt: 'Just now',
        likesCount: 0,
        isLiked: false,
        tags: postData.tags,
        comments: [],
      };

      const updated = [newPost, ...current];

      try {
        localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent(POSTS_UPDATED_EVENT));
        setPosts(updated);
      } catch (error) {
        console.error('Failed to save new post to localStorage:', error);
      }

      return newPost;
    },
    []
  );

  /**
   * Toggles like status on a post and updates likes count in localStorage
   */
  const toggleLike = useCallback((postId: string) => {
    const current = getStoredPosts();
    const updated = current.map((post) => {
      if (post.id === postId) {
        const isLiked = !post.isLiked;
        return {
          ...post,
          isLiked,
          likesCount: isLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1),
        };
      }
      return post;
    });

    try {
      localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(POSTS_UPDATED_EVENT));
      setPosts(updated);
    } catch (error) {
      console.error('Failed to save like update to localStorage:', error);
    }
  }, []);

  /**
   * Adds a new comment to a post and saves to localStorage
   */
  const addComment = useCallback(
    (postId: string, commentText: string, author: StudentUser) => {
      const current = getStoredPosts();
      const updated = current.map((post) => {
        if (post.id === postId) {
          const newComment = {
            id: `c_${Date.now()}`,
            author,
            content: commentText,
            createdAt: 'Just now',
          };
          return {
            ...post,
            comments: [...post.comments, newComment],
          };
        }
        return post;
      });

      try {
        localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent(POSTS_UPDATED_EVENT));
        setPosts(updated);
      } catch (error) {
        console.error('Failed to save comment to localStorage:', error);
      }
    },
    []
  );

  /**
   * Reset posts back to initial mock state
   */
  const resetPostsToDefault = useCallback(() => {
    try {
      localStorage.removeItem(POSTS_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent(POSTS_UPDATED_EVENT));
      setPosts(initialPosts);
    } catch (error) {
      console.error('Failed to reset posts in localStorage:', error);
    }
  }, []);

  return {
    posts,
    addPost,
    toggleLike,
    addComment,
    resetPostsToDefault,
  };
}
