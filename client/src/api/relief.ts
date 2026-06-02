import axios, { AxiosError } from 'axios';
import { ENV } from '@/config/env';
import { getBearerTokenHeader } from '@/features/auth/utils/tokenStorage';

export type ReliefApiUser = {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
  profile_picture?: string | null;
  profile_picture_url?: string | null;
};

export type ReliefApiComment = {
  id: number;
  relief_id: number;
  user_id: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user?: ReliefApiUser | null;
};

export type ReliefApiItem = {
  id: number;
  user_id: number;
  title: string;
  type: string;
  description: string;
  urgency: string;
  time_sensitivity: string | null;
  visibility: string;
  contact_preference: string;
  location: string;
  status: string;
  helpers_count: number;
  has_offered_help?: boolean;
  comments?: ReliefApiComment[];
  created_at: string;
  updated_at: string;
  user?: ReliefApiUser | null;
};

export type CreateReliefPayload = {
  title: string;
  type: string;
  description: string;
  urgency: string;
  time_sensitivity?: string;
  visibility: string;
  contact_preference: string;
  location: string;
};

export class ReliefApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ReliefApiError';
    this.status = status;
    this.data = data;
  }
}

const RELIEFS_KEY = 'protibeshi_relief_requests';

const getLocalReliefs = (): ReliefApiItem[] => {
  if (typeof window === 'undefined') return [];
  const stored = window.localStorage.getItem(RELIEFS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as ReliefApiItem[];
    } catch {}
  }
  
  const initialData: ReliefApiItem[] = [
    {
      id: 1,
      user_id: 1,
      title: 'Need emergency blood donation (O+)',
      type: 'Medical',
      description: 'Patient is in critical condition at Square Hospital. We need 2 bags of O+ blood by tonight.',
      urgency: 'Critical',
      time_sensitivity: 'Immediate',
      visibility: 'Public',
      contact_preference: 'Phone',
      location: 'Square Hospital, Panthapath',
      status: 'Open',
      helpers_count: 0,
      has_offered_help: false,
      comments: [],
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
      user: { id: 1, name: 'Rafiqul Islam', username: 'rafiq123', email: 'rafiq@example.com' },
    },
    {
      id: 2,
      user_id: 2,
      title: 'Donating warm clothes for winter',
      type: 'Donation',
      description: 'I have 2 boxes of slightly used warm clothes (sweaters, jackets) suitable for children aged 5-10. Looking to hand them over to someone organizing a distribution.',
      urgency: 'Normal',
      time_sensitivity: 'Within a week',
      visibility: 'Public',
      contact_preference: 'Message',
      location: 'Mirpur DOHS',
      status: 'Open',
      helpers_count: 3,
      has_offered_help: false,
      comments: [],
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
      user: { id: 2, name: 'Sadia Rahman', username: 'sadiar', email: 'sadia@example.com' },
    }
  ];
  
  window.localStorage.setItem(RELIEFS_KEY, JSON.stringify(initialData));
  return initialData;
};

const setLocalReliefs = (reliefs: ReliefApiItem[]) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(RELIEFS_KEY, JSON.stringify(reliefs));
  }
};

export const getReliefs = async (): Promise<ReliefApiItem[]> => {
  return getLocalReliefs();
};

export const getRelief = async (id: number | string): Promise<ReliefApiItem | null> => {
  const reliefs = getLocalReliefs();
  const found = reliefs.find((r) => String(r.id) === String(id));
  return found || null;
};

export const createRelief = async (data: CreateReliefPayload): Promise<ReliefApiItem | null> => {
  const reliefs = getLocalReliefs();
  const newRelief: ReliefApiItem = {
    id: Date.now(),
    user_id: 999, // Current user
    title: data.title,
    type: data.type,
    description: data.description,
    urgency: data.urgency,
    time_sensitivity: data.time_sensitivity || null,
    visibility: data.visibility,
    contact_preference: data.contact_preference,
    location: data.location,
    status: 'Open',
    helpers_count: 0,
    has_offered_help: false,
    comments: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: { id: 999, name: 'Current User', username: 'current_user', email: 'user@example.com' },
  };

  setLocalReliefs([newRelief, ...reliefs]);
  return newRelief;
};

export const offerHelp = async (id: number | string): Promise<ReliefApiItem | null> => {
  const reliefs = getLocalReliefs();
  const updated = reliefs.map((r) => {
    if (String(r.id) === String(id)) {
      return { ...r, helpers_count: r.helpers_count + 1, has_offered_help: true };
    }
    return r;
  });

  setLocalReliefs(updated);
  const found = updated.find((r) => String(r.id) === String(id));
  return found || null;
};

export const addReliefComment = async (
  id: number | string,
  comment: string,
): Promise<ReliefApiComment | null> => {
  const reliefs = getLocalReliefs();
  const newComment: ReliefApiComment = {
    id: Date.now(),
    relief_id: Number(id),
    user_id: 999,
    comment,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: { id: 999, name: 'Current User' },
  };

  const updated = reliefs.map((r) => {
    if (String(r.id) === String(id)) {
      return { ...r, comments: [...(r.comments || []), newComment] };
    }
    return r;
  });

  setLocalReliefs(updated);
  return newComment;
};

export const reportRelief = async (
  id: number | string,
  reason: string,
): Promise<{ success?: boolean; message?: string; report_id?: number }> => {
  const reliefs = getLocalReliefs();
  const updated = reliefs.map((r) => {
    if (String(r.id) === String(id)) {
      // Add report info for admin
      const currentReports = (r as any).reports || [];
      return { 
        ...r, 
        report_count: ((r as any).report_count || 0) + 1,
        reports: [...currentReports, { reason, severity: 'medium', created_at: new Date().toISOString(), reporter: { name: 'Current User' } }]
      };
    }
    return r;
  });

  setLocalReliefs(updated);
  return { success: true, message: 'Report submitted successfully' };
};

export const deleteRelief = async (id: number | string): Promise<{ success?: boolean; message?: string }> => {
  const reliefs = getLocalReliefs();
  const updated = reliefs.filter((r) => String(r.id) !== String(id));
  setLocalReliefs(updated);
  return { success: true, message: 'Deleted successfully' };
};
