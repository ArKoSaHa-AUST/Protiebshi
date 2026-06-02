export type AdminUserRecord = {
  id: number | string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  username: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  full_address?: string | null;
  profile_picture_url?: string | null;
  bio?: string | null;
  created_at?: string | null;
  email_verified?: boolean;
  verification_status?: 'verified' | 'unverified';
  is_banned?: boolean;
  banned_at?: string | null;
  banned_until?: string | null;
  banned_reason?: string | null;
  posts_count?: number;
  listings_count?: number;
  services_count?: number;
  rent_listings_count?: number;
  complaints_count?: number;
  reliefs_count?: number;
};

export type AdminUserSummary = {
  total_users: number;
  filtered_users: number;
  verified_users: number;
  banned_users: number;
};

export type AdminUsersResponse = {
  status: string;
  data: {
    users: AdminUserRecord[];
    summary: AdminUserSummary;
    available_neighborhoods: string[];
    available_cities: string[];
  };
};

type AdminUserMutationResponse = {
  status: string;
  message?: string;
  data?: {
    user?: AdminUserRecord;
  };
};

export type AdminUsersQuery = {
  q?: string;
  city?: string;
  neighborhood?: string;
  verified_only?: boolean;
  banned_only?: boolean;
};

/* ── localStorage helpers ─────────────────────────────────────── */
const USERS_KEY = 'protibeshi_admin_users_v1';

const readUsers = (): AdminUserRecord[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeUsers = (items: AdminUserRecord[]) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(items));
  }
};

const getMockUsers = (): AdminUserRecord[] => [
  {
    id: 1,
    full_name: 'Alice Johnson',
    first_name: 'Alice',
    last_name: 'Johnson',
    username: 'alice_j',
    email: 'alice@example.com',
    phone: '+8801111111111',
    city: 'Dhaka',
    neighborhood: 'Gulshan',
    full_address: '12 Gulshan Avenue, Dhaka',
    profile_picture_url: null,
    bio: 'Community volunteer.',
    created_at: new Date(Date.now() - 86400000 * 120).toISOString(),
    email_verified: true,
    verification_status: 'verified',
    is_banned: false,
    posts_count: 12,
    listings_count: 3,
    services_count: 1,
    rent_listings_count: 2,
    complaints_count: 0,
    reliefs_count: 1,
  },
  {
    id: 2,
    full_name: 'Bob Smith',
    first_name: 'Bob',
    last_name: 'Smith',
    username: 'bobsmith',
    email: 'bob@example.com',
    phone: '+8802222222222',
    city: 'Chattogram',
    neighborhood: 'Agrabad',
    full_address: '45 Agrabad C/A, Chattogram',
    profile_picture_url: null,
    bio: 'Local business owner.',
    created_at: new Date(Date.now() - 86400000 * 90).toISOString(),
    email_verified: true,
    verification_status: 'verified',
    is_banned: false,
    posts_count: 5,
    listings_count: 8,
    services_count: 2,
    rent_listings_count: 1,
    complaints_count: 2,
    reliefs_count: 0,
  },
  {
    id: 3,
    full_name: 'Carol White',
    first_name: 'Carol',
    last_name: 'White',
    username: 'carol_w',
    email: 'carol@example.com',
    phone: '+8803333333333',
    city: 'Dhaka',
    neighborhood: 'Dhanmondi',
    full_address: '7/A Dhanmondi, Dhaka',
    profile_picture_url: null,
    bio: null,
    created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
    email_verified: false,
    verification_status: 'unverified',
    is_banned: false,
    posts_count: 0,
    listings_count: 0,
    services_count: 0,
    rent_listings_count: 0,
    complaints_count: 0,
    reliefs_count: 0,
  },
  {
    id: 4,
    full_name: 'David Brown',
    first_name: 'David',
    last_name: 'Brown',
    username: 'david_brown',
    email: 'david@example.com',
    phone: '+8804444444444',
    city: 'Sylhet',
    neighborhood: 'Zindabazar',
    full_address: '22 Zindabazar, Sylhet',
    profile_picture_url: null,
    bio: 'Photographer.',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    email_verified: true,
    verification_status: 'verified',
    is_banned: true,
    banned_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    banned_until: null,
    banned_reason: 'Spamming community boards.',
    posts_count: 45,
    listings_count: 2,
    services_count: 0,
    rent_listings_count: 0,
    complaints_count: 3,
    reliefs_count: 1,
  },
  {
    id: 5,
    full_name: 'Eva Green',
    first_name: 'Eva',
    last_name: 'Green',
    username: 'eva_green',
    email: 'eva@example.com',
    phone: '+8805555555555',
    city: 'Rajshahi',
    neighborhood: 'Shaheb Bazar',
    full_address: '101 Shaheb Bazar, Rajshahi',
    profile_picture_url: null,
    bio: 'Student at RU.',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    email_verified: false,
    verification_status: 'unverified',
    is_banned: false,
    posts_count: 1,
    listings_count: 0,
    services_count: 0,
    rent_listings_count: 0,
    complaints_count: 0,
    reliefs_count: 0,
  },
];

const getUsers = (): AdminUserRecord[] => {
  let users = readUsers();
  if (users.length === 0) {
    users = getMockUsers();
    writeUsers(users);
  }
  return users;
};

const uniqueStrings = (arr: (string | null | undefined)[]): string[] => {
  const set = new Set<string>();
  for (const s of arr) {
    if (s) set.add(s);
  }
  return Array.from(set).sort();
};

/* ── Admin user functions (localStorage-only) ───────────────── */

export const getAdminUserErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
};

export const fetchAdminUsers = async (query: AdminUsersQuery = {}): Promise<AdminUsersResponse['data']> => {
  const all = getUsers();

  let filtered = [...all];

  const q = typeof query.q === 'string' ? query.q.trim().toLowerCase() : '';
  if (q) {
    filtered = filtered.filter((user) => {
      const haystack = [user.full_name, user.email, user.username, user.city]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  if (query.city) {
    filtered = filtered.filter((user) => user.city === query.city);
  }

  if (query.neighborhood) {
    filtered = filtered.filter((user) => user.neighborhood === query.neighborhood);
  }

  if (query.verified_only) {
    filtered = filtered.filter((user) => user.verification_status === 'verified');
  }

  if (query.banned_only) {
    filtered = filtered.filter((user) => user.is_banned === true);
  }

  const summary: AdminUserSummary = {
    total_users: all.length,
    filtered_users: filtered.length,
    verified_users: all.filter((u) => u.verification_status === 'verified').length,
    banned_users: all.filter((u) => u.is_banned === true).length,
  };

  const available_neighborhoods = uniqueStrings(all.map((u) => u.neighborhood));
  const available_cities = uniqueStrings(all.map((u) => u.city));

  return {
    users: filtered,
    summary,
    available_neighborhoods,
    available_cities,
  };
};

export const banAdminUser = async (
  userId: number | string,
  payload: { reason: string; duration_days?: number },
): Promise<AdminUserRecord> => {
  const users = getUsers();
  const idx = users.findIndex((u) => String(u.id) === String(userId));

  if (idx === -1) {
    throw new Error('User not found.');
  }

  users[idx].is_banned = true;
  users[idx].banned_at = new Date().toISOString();
  users[idx].banned_reason = payload.reason;

  if (typeof payload.duration_days === 'number' && payload.duration_days > 0) {
    const until = new Date();
    until.setDate(until.getDate() + payload.duration_days);
    users[idx].banned_until = until.toISOString();
  }

  writeUsers(users);
  return users[idx];
};

export const unbanAdminUser = async (userId: number | string): Promise<AdminUserRecord> => {
  const users = getUsers();
  const idx = users.findIndex((u) => String(u.id) === String(userId));

  if (idx === -1) {
    throw new Error('User not found.');
  }

  users[idx].is_banned = false;
  users[idx].banned_at = null;
  users[idx].banned_until = null;
  users[idx].banned_reason = null;

  writeUsers(users);
  return users[idx];
};
