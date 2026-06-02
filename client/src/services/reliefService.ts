type DismissReportsResponse = {
  message: string;
  relief: unknown;
  clearedReports: number;
};

type RemoveReliefResponse = {
  message: string;
  deletedRelief: unknown;
  notificationSent: boolean;
};

/* ── localStorage helpers ─────────────────────────────────────── */
const RELIEFS_KEY = 'protibeshi_relief_requests';

const readReliefs = (): any[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RELIEFS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeReliefs = (items: any[]) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(RELIEFS_KEY, JSON.stringify(items));
  }
};

const resolveReliefId = (reliefId: number | string): number => {
  return Number(reliefId);
};

const enrichReliefItem = (item: any): any => {
  const id = item.id ?? item.backendId ?? item._id ?? Math.random().toString(36).slice(2);
  const backendId = item.backendId ?? item.id ?? item._id ?? id;
  const postedByName = item.postedBy || item.requesterName || item.user?.name || item.user?.full_name || 'Unknown';
  const dummyUser = {
    id: backendId,
    name: postedByName,
    full_name: postedByName,
    email: item.email || '',
  };

  return {
    ...item,
    id,
    backendId,
    user: item.user || dummyUser,
    requester: item.requester || dummyUser,
    reports: Array.isArray(item.reports) ? item.reports : [],
    report_count: typeof item.report_count === 'number' ? item.report_count : 0,
  };
};

/* ── Admin relief functions (localStorage-only) ─────────────── */

export const getAdminReliefs = async (token?: string): Promise<any[]> => {
  const raw = readReliefs();
  return raw.map(enrichReliefItem);
};

export const dismissAdminReliefReports = async (
  reliefId: number | string,
  token?: string,
): Promise<DismissReportsResponse> => {
  const resolvedReliefId = resolveReliefId(reliefId);
  if (!Number.isFinite(resolvedReliefId) || resolvedReliefId <= 0) {
    throw new Error('Invalid relief request selected.');
  }

  const items = readReliefs().map(enrichReliefItem);
  const idx = items.findIndex((item) => Number(item.id) === resolvedReliefId || Number(item.backendId) === resolvedReliefId);

  if (idx === -1) {
    throw new Error('Relief request not found.');
  }

  const clearedReports = items[idx].reports.length;
  items[idx].reports = [];
  items[idx].report_count = 0;

  writeReliefs(items);
  return {
    message: 'Relief reports dismissed successfully',
    relief: items[idx],
    clearedReports,
  };
};

export const removeAdminReliefRequest = async (
  reliefId: number | string,
  reason: string = '',
  token?: string,
): Promise<RemoveReliefResponse> => {
  const resolvedReliefId = resolveReliefId(reliefId);
  if (!Number.isFinite(resolvedReliefId) || resolvedReliefId <= 0) {
    throw new Error('Invalid relief request selected for removal.');
  }

  const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
  if (!trimmedReason) {
    throw new Error('Please provide a moderation reason before removing this request.');
  }

  const items = readReliefs().map(enrichReliefItem);
  const idx = items.findIndex((item) => Number(item.id) === resolvedReliefId || Number(item.backendId) === resolvedReliefId);

  if (idx === -1) {
    throw new Error('Relief request not found.');
  }

  const deletedRelief = items[idx];
  const filtered = items.filter((_, i) => i !== idx);
  writeReliefs(filtered);

  return {
    message: 'Relief request removed successfully',
    deletedRelief,
    notificationSent: false,
  };
};
