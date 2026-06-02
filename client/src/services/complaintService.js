import { ENV } from '@/config/env';

const getConfiguredApiHost = () => String(ENV.API_BASE_URL || '').trim().replace(/\/$/, '');

const getApiBaseUrl = () => {
  return `${getConfiguredApiHost()}/api`;
};

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const normalizeTokenValue = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
    return null;
  }

  return trimmed.startsWith('Bearer ') ? trimmed.slice(7).trim() : trimmed;
};

const parseJsonString = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const getNestedToken = (source) => {
  if (!source || typeof source !== 'object') {
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

  if (source.state && typeof source.state === 'object') {
    return getNestedToken(source.state);
  }

  return null;
};

const resolveAuthToken = (providedToken) => {
  const explicitToken = normalizeTokenValue(providedToken);
  if (explicitToken) {
    return explicitToken;
  }

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
    const parsed = parseJsonString(window.localStorage.getItem(key));
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

const extractApiErrorMessage = (data, fallbackMessage) => {
  if (!data) {
    return fallbackMessage;
  }

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }

  if (data.errors && typeof data.errors === 'object') {
    const firstFieldErrors = Object.values(data.errors)[0];

    if (Array.isArray(firstFieldErrors) && firstFieldErrors.length > 0) {
      return firstFieldErrors[0];
    }

    if (typeof firstFieldErrors === 'string' && firstFieldErrors.trim()) {
      return firstFieldErrors;
    }
  }

  return fallbackMessage;
};

/* ── localStorage helpers ─────────────────────────────────────── */
const COMPLAINTS_KEY = 'protibeshi_complaints';

const readComplaints = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(COMPLAINTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  
  // Initialize with dummy data if empty
  const initialData = [
    {
      id: 'CMP-1001',
      recordId: 1001,
      title: 'Pothole on Road 5',
      description: 'There is a massive pothole in front of House 21 causing traffic issues.',
      category: 'Road damage',
      priority: 'High',
      status: 'In Progress',
      visibility: 'Public',
      location: 'Road 5, Block B',
      distance: 120,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      user: { id: 1, name: 'Tarek Hasan' }
    },
    {
      id: 'CMP-1002',
      recordId: 1002,
      title: 'Streetlight not working',
      description: 'The streetlight at the corner of the park has been out for 3 days.',
      category: 'Electricity',
      priority: 'Medium',
      status: 'Pending',
      visibility: 'Public',
      location: 'Sector 4 Park',
      distance: 300,
      created_at: new Date(Date.now() - 259200000).toISOString(),
      user: { id: 2, name: 'Sadia Alam' }
    }
  ];
  window.localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(initialData));
  return initialData;
};

const writeComplaints = (items) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(items));
  }
};

const applyFilters = (items, options) => {
  let result = [...items];

  const search = typeof options.search === 'string' ? options.search.trim().toLowerCase() : '';
  if (search) {
    result = result.filter((item) => {
      const haystack = [
        item.title,
        item.description,
        item.location,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }

  const status = typeof options.status === 'string' ? options.status.trim() : '';
  if (status) {
    result = result.filter((item) => item.status === status);
  }

  const priority = typeof options.priority === 'string' ? options.priority.trim() : '';
  if (priority) {
    result = result.filter((item) => item.priority === priority);
  }

  const category = typeof options.category === 'string' ? options.category.trim() : '';
  if (category) {
    result = result.filter((item) => item.category === category);
  }

  const visibility = typeof options.visibility === 'string' ? options.visibility.trim() : '';
  if (visibility) {
    result = result.filter((item) => item.visibility === visibility);
  }

  const tab = typeof options.tab === 'string' ? options.tab.trim().toLowerCase() : '';
  if (tab === 'urgent') {
    result = result.filter((item) => ['Urgent', 'High'].includes(item.priority));
  } else if (tab === 'private') {
    result = result.filter((item) => item.visibility === 'Only admins');
  } else if (tab === 'unresolved') {
    result = result.filter((item) => !['Resolved', 'Rejected'].includes(item.status));
  }

  return result;
};

const applySorting = (items, sort) => {
  if (!sort) return items;
  const sorted = [...items];
  const sortStr = String(sort).toLowerCase();

  if (sortStr.includes('date')) {
    sorted.sort((a, b) => {
      const da = new Date(a.created_at || a.date || 0).getTime();
      const db = new Date(b.created_at || b.date || 0).getTime();
      return sortStr.includes('asc') ? da - db : db - da;
    });
  } else if (sortStr.includes('priority')) {
    const priorityOrder = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
    sorted.sort((a, b) => {
      const pa = priorityOrder[a.priority] || 0;
      const pb = priorityOrder[b.priority] || 0;
      return sortStr.includes('asc') ? pa - pb : pb - pa;
    });
  } else if (sortStr.includes('status')) {
    sorted.sort((a, b) => {
      const sa = String(a.status || '').toLowerCase();
      const sb = String(b.status || '').toLowerCase();
      return sortStr.includes('asc') ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  }

  return sorted;
};

const applyPagination = (items, options) => {
  const page = Number.isFinite(Number(options.page)) && Number(options.page) > 0 ? Number(options.page) : 1;
  const perPage = Number.isFinite(Number(options.perPage)) && Number(options.perPage) > 0 ? Number(options.perPage) : 15;
  const total = items.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, lastPage);
  const from = total === 0 ? 0 : (safePage - 1) * perPage + 1;
  const to = Math.min(safePage * perPage, total);
  const paginatedItems = items.slice((safePage - 1) * perPage, safePage * perPage);

  return {
    complaints: paginatedItems,
    pagination: {
      current_page: safePage,
      last_page: lastPage,
      per_page: perPage,
      total,
      from,
      to,
    },
  };
};

const mapStatusPayload = (raw) => {
  const map = {
    under_review: 'Under Review',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    rejected: 'Rejected',
  };
  return map[raw] || raw;
};

/* ── Admin complaint functions (localStorage-only) ──────────── */

export const getAdminComplaints = async (token, options = {}) => {
  let items = readComplaints();
  items = applyFilters(items, options);
  items = applySorting(items, options.sort);
  return applyPagination(items, options);
};

export const getAdminComplaintDetails = async (complaintId, token) => {
  const resolvedComplaintId = Number(complaintId);
  if (!Number.isFinite(resolvedComplaintId) || resolvedComplaintId <= 0) {
    throw new Error('Invalid complaint selected for details view.');
  }

  const items = readComplaints();
  const item = items.find((c) => Number(c.recordId) === resolvedComplaintId || Number(c.id) === resolvedComplaintId);

  if (!item) {
    throw new Error('Complaint not found.');
  }

  return { complaint: item };
};

export const updateAdminComplaintStatus = async (complaintId, payload, token) => {
  const resolvedComplaintId = Number(complaintId);
  if (!Number.isFinite(resolvedComplaintId) || resolvedComplaintId <= 0) {
    throw new Error('Invalid complaint selected for status update.');
  }

  const statusRaw = typeof payload?.status === 'string' ? payload.status.trim() : '';
  const note = typeof payload?.note === 'string' ? payload.note.trim() : '';

  if (!statusRaw) {
    throw new Error('Please provide a valid complaint status.');
  }

  const items = readComplaints();
  const idx = items.findIndex((c) => Number(c.recordId) === resolvedComplaintId || Number(c.id) === resolvedComplaintId);

  if (idx === -1) {
    throw new Error('Complaint not found.');
  }

  const newStatus = mapStatusPayload(statusRaw);
  items[idx].status = newStatus;

  if (!Array.isArray(items[idx].updates)) {
    items[idx].updates = [];
  }

  items[idx].updates.push({
    stage: newStatus,
    date: new Date().toISOString(),
    note: note || undefined,
  });

  writeComplaints(items);
  return { complaint: items[idx] };
};

export const bulkUpdateAdminComplaintStatus = async (complaintIds, payload, token) => {
  const normalizedIds = Array.isArray(complaintIds)
    ? Array.from(new Set(complaintIds.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0)))
    : [];

  if (normalizedIds.length === 0) {
    throw new Error('Select at least one complaint for bulk moderation update.');
  }

  const statusRaw = typeof payload?.status === 'string' ? payload.status.trim() : '';
  const note = typeof payload?.note === 'string' ? payload.note.trim() : '';

  if (!statusRaw) {
    throw new Error('Please provide a valid complaint status.');
  }

  const newStatus = mapStatusPayload(statusRaw);
  const items = readComplaints();
  const updatedItems = [];

  for (const id of normalizedIds) {
    const idx = items.findIndex((c) => Number(c.recordId) === id || Number(c.id) === id);
    if (idx === -1) continue;

    items[idx].status = newStatus;

    if (!Array.isArray(items[idx].updates)) {
      items[idx].updates = [];
    }

    items[idx].updates.push({
      stage: newStatus,
      date: new Date().toISOString(),
      note: note || undefined,
    });

    updatedItems.push(items[idx]);
  }

  writeComplaints(items);
  return { complaints: updatedItems };
};

/* ── Non-admin functions (Now using localStorage) ───── */

export const createComplaint = async (formData, token) => {
  const items = readComplaints();
  
  let title = '';
  let description = '';
  let category = '';
  let priority = '';
  let visibility = '';
  let location = '';
  
  if (formData instanceof FormData) {
    title = formData.get('title') || '';
    description = formData.get('description') || '';
    category = formData.get('category') || 'Other';
    priority = formData.get('priority') || 'Medium';
    visibility = formData.get('visibility') || 'Public';
    location = formData.get('location') || '';
  } else {
    title = formData.title || '';
    description = formData.description || '';
    category = formData.category || 'Other';
    priority = formData.priority || 'Medium';
    visibility = formData.visibility || 'Public';
    location = formData.location || '';
  }

  const newId = Date.now();
  const newComplaint = {
    id: `CMP-${newId}`,
    recordId: newId,
    title,
    description,
    category,
    priority,
    status: 'Pending',
    visibility,
    location,
    distance: 0,
    created_at: new Date().toISOString(),
    user: { id: 999, name: 'Current User' },
    updates: [{ stage: 'Pending', date: new Date().toISOString() }]
  };

  writeComplaints([newComplaint, ...items]);
  return { message: 'Complaint created successfully', data: newComplaint };
};

export const getComplaints = async () => {
  const items = readComplaints();
  return { data: items };
};

export const deleteComplaint = async (id, token) => {
  const resolvedId = String(id).replace('CMP-', '');
  const items = readComplaints();
  const filtered = items.filter(c => String(c.recordId) !== resolvedId && String(c.id) !== id);
  writeComplaints(filtered);
  return { message: 'Complaint deleted successfully' };
};
