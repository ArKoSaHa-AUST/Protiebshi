/** 
 * src/features/relief/types/relief.types.ts 
*/

// ─── Enumerations ───────────────────────────────────────────────────────────── 

export const reliefHelpTypes = [
    'Food',
    'Medical',
    'Shelter',
    'Transportation',
    'Financial',
    'Utilities',
    'Disaster Relief',
    'Other',
] as const;

export const reliefUrgencyLevels = ['Normal', 'Important', 'Urgent',
    'Critical'] as const;

export const reliefStatuses = [
    'Open',
    'Assigned',
    'Completed',
] as const;

export const reliefVisibilityOptions = ['Public', 'Only verified neighbors'] as const;

export const reliefContactPreferences = ['In-app message', 'Phone'] as
    const;

export const reliefTimeSensitivities = ['Immediate', 'Within 24 hours',
    'Flexible'] as const;

export const reliefTimeRanges = ['Today', 'This week', 'This month',
    'All'] as const;

export const reliefAvailabilities = [
    'Today only',
    'This week',
    'Weekends',
    'On-call',
    'Recurring',
] as const;

// ─── Derived Types ──────────────────────────────────────────────────────────── 

export type ReliefHelpType = (typeof reliefHelpTypes)[number];
export type ReliefUrgency = (typeof reliefUrgencyLevels)[number];
export type ReliefStatus = (typeof reliefStatuses)[number];
export type ReliefVisibility = (typeof
    reliefVisibilityOptions)[number];
export type ReliefContactPreference = (typeof
    reliefContactPreferences)[number];
export type ReliefTimeSensitivity = (typeof
    reliefTimeSensitivities)[number];
export type ReliefTimeRange = (typeof reliefTimeRanges)[number];
export type ReliefAvailability = (typeof reliefAvailabilities)[number];

export type ReliefTabView = 'requests' | 'offers';

// ─── Domain Models ──────────────────────────────────────────────────────────── 

export interface ReliefTimelineEntry {
    stage: string;
    date: string;
    note?: string;
}

export interface ReliefComment {
    id: string;
    author: string;
    avatarInitials: string;
    avatarUrl?: string | null;
    message: string;
    createdAt: string;
}

export interface ReliefVolunteer {
    id: string;
    name: string;
    avatarInitials: string;
    verifiedNeighbor: boolean;
    joinedAt: string;
}

export interface ReliefRequest {
    id: string;
    backendId?: number;
    userId?: number;
    type: 'request';
    helpType: ReliefHelpType;
    title: string;
    description: string;
    urgency: ReliefUrgency;
    status: ReliefStatus;
    visibility: ReliefVisibility;
    contactPreference: ReliefContactPreference;
    timeSensitivity: ReliefTimeSensitivity;
    location: string;
    distance: number; // metres 
    createdAt: string;
    updatedAt: string;
    postedBy: string;
    avatarInitials: string;
    avatarUrl?: string | null;
    verified: boolean;
    anonymous: boolean;
    hasOfferedHelp?: boolean;
    volunteerCount: number;
    volunteers: ReliefVolunteer[];
    timeline: ReliefTimelineEntry[];
    comments: ReliefComment[];
    photos: string[];
    resolutionSummary?: string;
}

export interface HelpOffer {
    id: string;
    type: 'offer';
    helpType: ReliefHelpType;
    title: string;
    description: string;
    availability: ReliefAvailability;
    serviceRadius: number; // km 
    contactPreference: ReliefContactPreference;
    isRecurring: boolean;
    location: string;
    distance: number; // metres 
    createdAt: string;
    postedBy: string;
    avatarInitials: string;
    verified: boolean;
}

// Union type for cards 
export type ReliefPost = ReliefRequest | HelpOffer;

// ─── Filter State ───────────────────────────────────────────────────────────── 

export interface ReliefFilterState {
    helpTypes: ReliefHelpType[];
    urgencies: ReliefUrgency[];
    statuses: ReliefStatus[];
    distance: number;
    timeRange: ReliefTimeRange;
    verifiedOnly: boolean;
    tab: ReliefTabView;
}

// ─── Form States ────────────────────────────────────────────────────────────── 

export interface ReliefRequestFormState {
    title: string;
    helpType: ReliefHelpType | '';
    description: string;
    urgency: ReliefUrgency | '';
    location: string;
    visibility: ReliefVisibility;
    contactPreference: ReliefContactPreference;
    timeSensitivity: ReliefTimeSensitivity;
    photo?: File | null;
    phone?: string;
}

export interface HelpOfferFormState {
    title: string;
    helpType: ReliefHelpType | '';
    description: string;
    availability: ReliefAvailability | '';
    serviceRadius: number;
    contactPreference: ReliefContactPreference;
    isRecurring: boolean;
    phone?: string;
}

export type ReliefFormErrors<T> = Partial<Record<keyof T, string>>;

// ─── Raw API Shapes (used by useReliefBoard normalization helpers) ─────────────

export interface ReliefApiUser {
  id?: number | string;
  name?: string;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  profile_picture?: string | null;
  profile_picture_url?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
}

export interface ReliefApiComment {
  id?: number | string;
  message?: string;
  body?: string;
  content?: string;
  created_at?: string;
  createdAt?: string;
  user?: ReliefApiUser | null;
  author?: ReliefApiUser | null;
}

export interface ReliefApiItem {
  id?: number | string;
  title?: string;
  description?: string;
  body?: string;
  help_type?: string;
  helpType?: string;
  urgency?: string;
  status?: string;
  location?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: ReliefApiUser | null;
  author?: ReliefApiUser | null;
  comments?: ReliefApiComment[];
}

export interface OfferApiItem {
  id?: number | string;
  title?: string;
  description?: string;
  help_type?: string;
  availability?: string;
  service_radius?: number;
  location?: string;
  created_at?: string;
  createdAt?: string;
  user?: ReliefApiUser | null;
  author?: ReliefApiUser | null;
}

