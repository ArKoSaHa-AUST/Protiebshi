import { getBackendOrigin, resolveMediaUrl } from '@/lib/mediaUrl';

export type FeedUser = {
  id: number;
  name: string;
};

export type FeedComment = {
  id: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user: FeedUser | null;
};

export type FeedPost = {
  id: number;
  title: string;
  short_description: string | null;
  content: string;
  label: string | null;
  image: string | null;
  post_type: string;
  visibility: string;
  likes_count: number;
  liked?: boolean;
  comments_count: number;
  shares_count?: number;
  moderation_status?: 'pending' | 'verified' | 'reported';
  moderation_source?: 'gemini' | 'admin' | null;
  is_event?: boolean;
  interaction_mode?: 'standard' | 'poll';
  event_vote_open?: boolean | null;
  event_vote_expires_at?: string | null;
  yes_votes_count?: number;
  no_votes_count?: number;
  current_user_vote?: 'yes' | 'no' | null;
  location: string | null;
  distance: number | null;
  created_at: string;
  updated_at: string;
  user: FeedUser | null;
  comments?: FeedComment[];
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: BodyInit;
  protected?: boolean;
  headers?: Record<string, string>;
};

type ApiErrorDetails = {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
};

export class FeedApiError extends Error {
  status: number;
  data: ApiErrorDetails | null;

  constructor(message: string, status: number, data: ApiErrorDetails | null) {
    super(message);
    this.name = 'FeedApiError';
    this.status = status;
    this.data = data;
  }
}

const getApiBaseUrl = () => {
  return getBackendOrigin();
};

const normalizeTokenValue = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
    return null;
  }

  return trimmed.startsWith('Bearer ') ? trimmed.slice(7).trim() : trimmed;
};

const parseJsonSafely = (value: string | null) => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const getNestedToken = (source: Record<string, unknown> | null): string | null => {
  if (!source) {
    return null;
  }

  const directCandidates = [
    source.token,
    source.authToken,
    source.accessToken,
    source.access_token,
    source.jwt,
    source.jwt_token,
  ];

  for (const candidate of directCandidates) {
    const token = normalizeTokenValue(candidate);
    if (token) {
      return token;
    }
  }

  const state = source.state;
  if (state && typeof state === 'object') {
    return getNestedToken(state as Record<string, unknown>);
  }

  return null;
};

const getToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const directKeys = ['token', 'auth_token', 'authToken', 'access_token', 'accessToken', 'jwt', 'jwt_token'];
  for (const key of directKeys) {
    const token = normalizeTokenValue(window.localStorage.getItem(key));
    if (token) {
      return token;
    }
  }

  const structuredKeys = ['auth', 'authStore', 'auth-storage', 'persist:auth'];
  for (const key of structuredKeys) {
    const parsed = parseJsonSafely(window.localStorage.getItem(key));
    const token = getNestedToken(parsed);
    if (token) {
      return token;
    }
  }

  for (const key of directKeys) {
    const token = normalizeTokenValue(window.sessionStorage.getItem(key));
    if (token) {
      return token;
    }
  }

  return null;
};

const buildHeaders = (isProtected: boolean, customHeaders?: Record<string, string>) => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(customHeaders || {}),
  };

  if (isProtected) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
};

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const {
    method = 'GET',
    body,
    protected: protectedRoute = false,
    headers: customHeaders,
  } = options;

  const response = await fetch(`${getApiBaseUrl()}/api${path}`, {
    method,
    headers: buildHeaders(protectedRoute, customHeaders),
    body,
  });

  let data: ApiErrorDetails | null = null;
  try {
    data = (await response.json()) as ApiErrorDetails;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMessage = data?.message || `Request failed with status ${response.status}`;
    throw new FeedApiError(errorMessage, response.status, data);
  }

  return data as T;
};

const normalizePosts = (payload: unknown): FeedPost[] => {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const typed = payload as { posts?: unknown };
  if (Array.isArray(typed.posts)) {
    return typed.posts as FeedPost[];
  }

  return [];
};

export const resolvePostImageUrl = (imagePath: string | null | undefined): string | null => {
  return resolveMediaUrl(imagePath, { defaultStoragePrefix: 'posts' });
};

// --- MOCK LOCAL STORAGE LOGIC ---
const getLocalPosts = (): FeedPost[] => {
  if (typeof window === 'undefined') return [];
  const stored = window.localStorage.getItem('protibeshi_feed_posts_api');
  if (stored) {
    try {
      return JSON.parse(stored) as FeedPost[];
    } catch {}
  }
  
  const initialData: FeedPost[] = [
    {
      id: 101, title: "Gas leak detected in Block A basement - evacuate immediately", short_description: null,
      content: "Emergency services have been notified. Please exit the building calmly using the nearest stairwell. Do not use the elevator. Assembly point is at the main gate.",
      label: "Emergency", image: null, post_type: "emergency", visibility: "public",
      likes_count: 185, comments_count: 34, location: "Block A", distance: 10,
      created_at: new Date(Date.now() - 15 * 60000).toISOString(), updated_at: new Date().toISOString(),
      user: { id: 1, name: "Building Association" }
    },
    {
      id: 102, title: "Suspicious activity near West Gate", short_description: null,
      content: "Security caught a glimpse of two unidentified individuals trying to force open the West Gate locks. Police are investigating. Please ensure all your doors and windows are locked tonight.",
      label: "Emergency", image: null, post_type: "emergency", visibility: "public",
      likes_count: 152, comments_count: 41, location: "West Gate", distance: 50,
      created_at: new Date(Date.now() - 120 * 60000).toISOString(), updated_at: new Date().toISOString(),
      user: { id: 2, name: "Community Watch" }
    },
    {
      id: 103, title: "Main water line burst on 3rd Avenue", short_description: null,
      content: "A major water line has burst causing severe flooding on 3rd Avenue. Water supply to Sector 4 and 5 will be suspended for the next 12 hours. Please conserve water.",
      label: "Emergency", image: null, post_type: "emergency", visibility: "public",
      likes_count: 210, comments_count: 55, location: "3rd Avenue", distance: 0,
      created_at: new Date(Date.now() - 180 * 60000).toISOString(), updated_at: new Date().toISOString(),
      user: { id: 3, name: "WASA Update" }
    },
    {
      id: 104, title: "Dengue outbreak warning", short_description: null,
      content: "We have had 4 confirmed cases of Dengue in our block this week. Please clear all stagnant water from your balconies and use mosquito repellents. If you have high fever, contact a doctor immediately.",
      label: "Emergency", image: null, post_type: "emergency", visibility: "public",
      likes_count: 340, comments_count: 89, location: "Sector 7", distance: 120,
      created_at: new Date(Date.now() - 24 * 60 * 60000).toISOString(), updated_at: new Date().toISOString(),
      user: { id: 4, name: "Dr. Shafiq" }
    },
    {
      id: 105, title: "Major accident on Main Road - avoid route", short_description: null,
      content: "A multi-vehicle collision has completely blocked the Main Road intersection. Emergency responders are on the scene. Expect severe delays and use alternative routes.",
      label: "Emergency", image: null, post_type: "emergency", visibility: "public",
      likes_count: 195, comments_count: 28, location: "Main Road", distance: 800,
      created_at: new Date(Date.now() - 24 * 60 * 60000).toISOString(), updated_at: new Date().toISOString(),
      user: { id: 5, name: "Traffic Police Dept" }
    },
    {
      id: 201, title: "Free textbooks for class 8 (National Curriculum)", short_description: null,
      content: "Have a full set of class 8 books in excellent condition. Happy to give them away to any student in the neighborhood who needs them. Please DM.",
      label: "Community", image: null, post_type: "community", visibility: "public",
      likes_count: 165, comments_count: 24, location: "Block A", distance: 60,
      created_at: new Date(Date.now() - 240 * 60000).toISOString(), updated_at: new Date().toISOString(),
      user: { id: 6, name: "Moumita Hasan" }
    },
    {
      id: 202, title: "Looking for a carpool to Gulshan", short_description: null,
      content: "I drive to Gulshan-1 every morning at 8:30 AM and return at 6:00 PM. Looking for 2-3 people to share the ride and fuel costs. Let me know if interested!",
      label: "Community", image: null, post_type: "community", visibility: "public",
      likes_count: 145, comments_count: 31, location: "Block C", distance: 150,
      created_at: new Date(Date.now() - 300 * 60000).toISOString(), updated_at: new Date().toISOString(),
      user: { id: 7, name: "Tanvir Ahmed" }
    },
    {
      id: 203, title: "Lost Golden Retriever puppy", short_description: null,
      content: "Our 6-month-old Golden Retriever, Max, slipped out of his collar near the park. He is very friendly. Please check your garages and alleys. We are heartbroken.",
      label: "Community", image: null, post_type: "community", visibility: "public",
      likes_count: 420, comments_count: 112, location: "Sector 4", distance: 200,
      created_at: new Date(Date.now() - 24 * 60 * 60000).toISOString(), updated_at: new Date().toISOString(),
      user: { id: 8, name: "Nusrat Jahan" }
    },
    {
      id: 204, title: "Plant cutting exchange this Saturday!", short_description: null,
      content: "Hey plant lovers! I'm organizing a small cutting exchange in my front yard this Saturday at 4 PM. Bring your pothos, monsteras, and succulents. Let's green up our spaces!",
      label: "Community", image: null, post_type: "community", visibility: "public",
      likes_count: 178, comments_count: 45, location: "Block B", distance: 90,
      created_at: new Date(Date.now() - 24 * 60 * 60000).toISOString(), updated_at: new Date().toISOString(),
      user: { id: 9, name: "Rashed Khan" }
    },
    {
      id: 205, title: "Recommendations for a good pediatrician?", short_description: null,
      content: "We just moved to the area and are looking for a reliable, patient pediatrician for our 2-year-old. Any strong recommendations for doctors nearby?",
      label: "Community", image: null, post_type: "community", visibility: "public",
      likes_count: 155, comments_count: 67, location: "Sector 5", distance: 300,
      created_at: new Date(Date.now() - 48 * 60 * 60000).toISOString(), updated_at: new Date().toISOString(),
      user: { id: 10, name: "Sabrina Rahman" }
    },
    {
      id: 301, title: "Monthly residents meeting - June", short_description: null,
      content: "Join us for the monthly residents meeting at the community center. Agenda: Security upgrades, monsoon preparedness, and the upcoming neighborhood festival.",
      label: "Event", image: null, post_type: "event", visibility: "public", is_event: true,
      likes_count: 210, comments_count: 22, location: "Community Center", distance: 0,
      created_at: new Date(Date.now() - 120 * 60000).toISOString(), updated_at: new Date().toISOString(),
      user: { id: 11, name: "Community Council" }
    },
    {
      id: 302, title: "Weekend Cricket Tournament", short_description: null,
      content: "The annual inter-block cricket tournament is kicking off this weekend! Block A vs Block C on Saturday morning. Come down to the central field and support your team!",
      label: "Event", image: null, post_type: "event", visibility: "public", is_event: true,
      likes_count: 285, comments_count: 54, location: "Block D", distance: 400,
      created_at: new Date(Date.now() - 240 * 60000).toISOString(), updated_at: new Date().toISOString(),
      user: { id: 12, name: "Youth Club" }
    },
    {
      id: 303, title: "Charity Bake Sale", short_description: null,
      content: "Hosting a bake sale this Friday after Jummah prayers outside the local mosque. All proceeds will go to the orphanage in Sector 7. Cookies, cakes, and brownies available!",
      label: "Event", image: null, post_type: "event", visibility: "public", is_event: true,
      likes_count: 310, comments_count: 48, location: "Block B", distance: 100,
      created_at: new Date(Date.now() - 24 * 60 * 60000).toISOString(), updated_at: new Date().toISOString(),
      user: { id: 13, name: "Farhana Akter" }
    },
    {
      id: 304, title: "Neighborhood Clean-up Drive", short_description: null,
      content: "Let's prepare for the monsoon! Join us on Sunday morning at 8 AM to clear the street drains and pick up plastic waste around the park. Gloves and bags will be provided.",
      label: "Event", image: null, post_type: "event", visibility: "public", is_event: true,
      likes_count: 245, comments_count: 36, location: "Park", distance: 50,
      created_at: new Date(Date.now() - 24 * 60 * 60000).toISOString(), updated_at: new Date().toISOString(),
      user: { id: 14, name: "Environmental Society" }
    },
    {
      id: 305, title: "Open Mic Night & Poetry Reading", short_description: null,
      content: "Calling all poets, musicians, and storytellers! We are hosting an open mic night at the rooftop garden this Saturday at 7 PM. Bring your art and your friends.",
      label: "Event", image: null, post_type: "event", visibility: "public", is_event: true,
      likes_count: 198, comments_count: 29, location: "Rooftop Garden", distance: 20,
      created_at: new Date(Date.now() - 48 * 60 * 60000).toISOString(), updated_at: new Date().toISOString(),
      user: { id: 15, name: "Cultural Committee" }
    },
    {
      id: 401, title: "Grand Opening Offer - 50% Off Kacchi!", short_description: null,
      content: "We are finally open in your neighborhood! To celebrate, we are offering a flat 50% discount on our signature Kacchi Biryani for the first 100 dine-in customers today.",
      label: "Restaurant", image: null, post_type: "community", visibility: "public",
      likes_count: 540, comments_count: 132, location: "Main Street", distance: 450,
      created_at: new Date(Date.now() - 60 * 60000).toISOString(), updated_at: new Date().toISOString(),
      user: { id: 16, name: "Kacchi Bhai" }
    },
    {
      id: 402, title: "New Monsoons Menu is Here", short_description: null,
      content: "Rainy days call for hot snacks! Stop by for our new monsoon menu featuring crispy Pakoras, spicy Fuchka, and hot Masala Chai. Cozy seating available.",
      label: "Restaurant", image: null, post_type: "community", visibility: "public",
      likes_count: 215, comments_count: 42, location: "Sector 3", distance: 200,
      created_at: new Date(Date.now() - 180 * 60000).toISOString(), updated_at: new Date().toISOString(),
      user: { id: 17, name: "Cafe Retro" }
    },
    {
      id: 403, title: "Introducing the 'Beast Burger'", short_description: null,
      content: "Think you have a big appetite? Try our new Triple Beef Beast Burger with extra jalapeños and melted cheddar. Tag a friend who can finish this alone!",
      label: "Restaurant", image: null, post_type: "community", visibility: "public",
      likes_count: 380, comments_count: 88, location: "Food Court", distance: 800,
      created_at: new Date(Date.now() - 300 * 60000).toISOString(), updated_at: new Date().toISOString(),
      user: { id: 18, name: "Burgerology" }
    },
    {
      id: 404, title: "Freshly Baked Sourdough & Croissants", short_description: null,
      content: "Good morning neighbors! We just pulled fresh sourdough loaves and butter croissants from the oven. Limited supply, grab yours before they run out!",
      label: "Restaurant", image: null, post_type: "community", visibility: "public",
      likes_count: 290, comments_count: 31, location: "Block A", distance: 50,
      created_at: new Date(Date.now() - 24 * 60 * 60000).toISOString(), updated_at: new Date().toISOString(),
      user: { id: 19, name: "Sweet Tooth Bakery" }
    },
    {
      id: 405, title: "Late Night Delivery Now Available", short_description: null,
      content: "Craving something delicious at 2 AM? We are excited to announce that Dhaka Diner now offers late-night delivery until 4 AM exclusively for this neighborhood.",
      label: "Restaurant", image: null, post_type: "community", visibility: "public",
      likes_count: 410, comments_count: 65, location: "Sector 6", distance: 600,
      created_at: new Date(Date.now() - 48 * 60 * 60000).toISOString(), updated_at: new Date().toISOString(),
      user: { id: 20, name: "Dhaka Diner" }
    }
  ];
  
  window.localStorage.setItem('protibeshi_feed_posts_api', JSON.stringify(initialData));
  return initialData;
};

const setLocalPosts = (posts: FeedPost[]) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('protibeshi_feed_posts_api', JSON.stringify(posts));
  }
};

export const getPosts = async (): Promise<FeedPost[]> => {
  return getLocalPosts().filter((p: any) => !p.is_deleted);
};

export const getMyPosts = async (): Promise<FeedPost[]> => {
  const posts = getLocalPosts();
  return posts.filter((p) => p.user?.id === 999);
};

export const getPost = async (id: number | string): Promise<FeedPost> => {
  const posts = getLocalPosts();
  const found = posts.find((p) => String(p.id) === String(id));
  return found || ({} as FeedPost);
};

export const createPost = async (formData: FormData): Promise<FeedPost> => {
  const posts = getLocalPosts();
  const title = formData.get('title') as string || '';
  const content = formData.get('content') as string || '';
  const short_description = formData.get('short_description') as string | null;
  const label = formData.get('label') as string || '';
  const location = formData.get('location') as string | null;
  const post_type = formData.get('post_type') as string || 'community';

  const newPost: FeedPost = {
    id: Date.now(),
    title,
    content,
    short_description,
    label,
    location,
    post_type,
    visibility: 'public',
    likes_count: 0,
    comments_count: 0,
    image: null,
    distance: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: { id: 999, name: 'Current User' },
    moderation_status: 'verified',
    is_event: post_type === 'event',
    comments: [],
  };

  setLocalPosts([newPost, ...posts]);
  return newPost;
};

export const deletePost = async (id: number | string): Promise<{ success: boolean; message: string }> => {
  const posts = getLocalPosts();
  const updated = posts.filter((p) => String(p.id) !== String(id));
  setLocalPosts(updated);
  return { success: true, message: 'Deleted' };
};

export const likePost = async (id: number | string): Promise<{ liked: boolean; likes_count: number }> => {
  const posts = getLocalPosts();
  let result = { liked: true, likes_count: 1 };
  
  const updated = posts.map((p) => {
    if (String(p.id) === String(id)) {
      const nextLiked = !p.liked;
      const nextLikesCount = nextLiked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1);
      result = { liked: nextLiked, likes_count: nextLikesCount };
      return { ...p, liked: nextLiked, likes_count: nextLikesCount };
    }
    return p;
  });

  setLocalPosts(updated);
  return result;
};

export const commentPost = async (
  id: number | string,
  comment: string,
): Promise<{ comments_count: number; comment: FeedComment }> => {
  const posts = getLocalPosts();
  
  const newComment: FeedComment = {
    id: Date.now(),
    comment,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: { id: 999, name: 'Current User' },
  };

  let newCount = 1;

  const updated = posts.map((p) => {
    if (String(p.id) === String(id)) {
      const c = [...(p.comments || []), newComment];
      newCount = p.comments_count + 1;
      return { ...p, comments_count: newCount, comments: c };
    }
    return p;
  });

  setLocalPosts(updated);
  return { comments_count: newCount, comment: newComment };
};

export const savePost = async (id: number | string): Promise<{ saved: boolean }> => {
  return { saved: true };
};

export const reportPost = async (id: number | string, reason: string): Promise<{ success: boolean; message: string }> => {
  return { success: true, message: 'Reported' };
};

export const votePost = async (
  id: number | string,
  vote: 'yes' | 'no',
): Promise<{ success: boolean; message: string; yes_votes_count: number; no_votes_count: number; current_user_vote: 'yes' | 'no' | null }> => {
  return {
    success: true,
    message: 'Voted',
    yes_votes_count: vote === 'yes' ? 1 : 0,
    no_votes_count: vote === 'no' ? 1 : 0,
    current_user_vote: vote,
  };
};