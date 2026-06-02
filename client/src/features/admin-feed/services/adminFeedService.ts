import type { AdminFeedPost } from '../types/adminFeed.types';

export type AdminFeedApiPayload = {
  success?: boolean;
  message?: string;
  posts?: AdminFeedPost[];
  post?: AdminFeedPost;
  gemini_review?: {
    allow?: boolean;
    reason?: string | null;
    model?: string | null;
    provider?: string | null;
  };
};

export type AdminFeedQuery = {
  queue?: 'all' | 'gemini';
};

const LOCAL_FEED_KEY = 'protibeshi_feed_posts_api';

const getLocalFeedPosts = (): AdminFeedPost[] => {
  try {
    const raw = localStorage.getItem(LOCAL_FEED_KEY);
    return raw ? (JSON.parse(raw) as AdminFeedPost[]) : [];
  } catch {
    return [];
  }
};

const setLocalFeedPosts = (posts: AdminFeedPost[]): void => {
  localStorage.setItem(LOCAL_FEED_KEY, JSON.stringify(posts));
};

const withDefaults = (post: AdminFeedPost): AdminFeedPost => ({
  ...post,
  status: post.status ?? 'verified',
  is_deleted: post.is_deleted ?? false,
  pinned: post.pinned ?? false,
});

export const fetchAdminFeedPosts = async (): Promise<AdminFeedPost[]> => {
  const posts = getLocalFeedPosts().map(withDefaults);
  return posts;
};

export const fetchAdminFeedPostsWithQuery = async (query: AdminFeedQuery): Promise<AdminFeedPost[]> => {
  let posts = getLocalFeedPosts().map(withDefaults);

  if (query.queue && query.queue !== 'all') {
    posts = posts.filter((p) => p.moderation_source === query.queue);
  }

  return posts;
};

export const verifyAdminFeedPost = async (postId: string): Promise<AdminFeedPost> => {
  const posts = getLocalFeedPosts().map(withDefaults);
  const index = posts.findIndex((p) => String(p.id) === String(postId));

  if (index === -1) {
    throw new Error('Post not found.');
  }

  posts[index].status = 'verified';
  setLocalFeedPosts(posts);
  return posts[index];
};

export const ignoreAdminFeedReports = async (postId: string): Promise<AdminFeedPost> => {
  const posts = getLocalFeedPosts().map(withDefaults);
  const index = posts.findIndex((p) => String(p.id) === String(postId));

  if (index === -1) {
    throw new Error('Post not found.');
  }

  posts[index].status = 'verified';
  setLocalFeedPosts(posts);
  return posts[index];
};

export const deleteAdminFeedPost = async (postId: string): Promise<AdminFeedPost> => {
  const posts = getLocalFeedPosts().map(withDefaults);
  const index = posts.findIndex((p) => String(p.id) === String(postId));

  if (index === -1) {
    throw new Error('Post not found.');
  }

  posts[index].is_deleted = true;
  setLocalFeedPosts(posts);
  return posts[index];
};

export const reviewAdminFeedPostWithGemini = async (postId: string): Promise<AdminFeedApiPayload> => {
  const posts = getLocalFeedPosts().map(withDefaults);
  const index = posts.findIndex((p) => String(p.id) === String(postId));

  if (index === -1) {
    throw new Error('Post not found.');
  }

  posts[index].moderation_source = 'gemini';
  setLocalFeedPosts(posts);

  return {
    post: posts[index],
    gemini_review: { allow: true, reason: null },
  };
};

export const rejectAdminFeedPostWithAI = async (postId: string): Promise<AdminFeedPost> => {
  const posts = getLocalFeedPosts().map(withDefaults);
  const index = posts.findIndex((p) => String(p.id) === String(postId));

  if (index === -1) {
    throw new Error('Post not found.');
  }

  posts[index].status = 'rejected';
  setLocalFeedPosts(posts);
  return posts[index];
};
