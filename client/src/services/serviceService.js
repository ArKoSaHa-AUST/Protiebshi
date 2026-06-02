import { ENV } from '@/config/env';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { servicesData as DEMO_SERVICES } from '@/features/services/mock/servicesData';

const getConfiguredApiHost = () => String(ENV.API_BASE_URL || '').trim().replace(/\/$/, '');
const SERVICE_STORAGE_KEY = 'protibeshi_services_v1';

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

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const hasWindow = () => typeof window !== 'undefined';

const parsePriceUnit = (value) => {
  if (value === 'hour' || value === 'session' || value === 'fixed') {
    return value;
  }

  if (value === 'per_hour') return 'hour';
  if (value === 'per_session') return 'session';
  return 'fixed';
};

const parseAvailability = (value) => {
  if (value === 'Available today' || value === 'Weekends only' || value === 'Flexible') {
    return value;
  }

  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('today')) return 'Available today';
  if (normalized.includes('weekend')) return 'Weekends only';
  return 'Flexible';
};

const defaultCoverFromId = (id) =>
  `https://picsum.photos/seed/protibeshi-service-${encodeURIComponent(String(id || 'demo'))}/960/640`;

const readStoredServices = () => {
  if (!hasWindow()) {
    return DEMO_SERVICES;
  }

  const rawValue = window.localStorage.getItem(SERVICE_STORAGE_KEY);
  if (!rawValue) {
    window.localStorage.setItem(SERVICE_STORAGE_KEY, JSON.stringify(DEMO_SERVICES));
    return DEMO_SERVICES;
  }

  const parsed = parseJsonString(rawValue);
  if (!Array.isArray(parsed)) {
    window.localStorage.setItem(SERVICE_STORAGE_KEY, JSON.stringify(DEMO_SERVICES));
    return DEMO_SERVICES;
  }

  return parsed;
};

const writeStoredServices = (services) => {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.setItem(SERVICE_STORAGE_KEY, JSON.stringify(services));
};

const readImageAsDataUrl = async (photoFile) => {
  if (!photoFile || typeof File === 'undefined' || !(photoFile instanceof File)) {
    return null;
  }

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => reject(new Error('Failed to read uploaded service image.'));
    reader.readAsDataURL(photoFile);
  });
};

const buildProviderName = (user) => {
  if (!user) {
    return 'Neighbor';
  }

  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return name || 'Neighbor';
};

export const normalizeService = (raw) => {
  const providedCover = raw?.coverPhotoUrl || raw?.cover_photo_url || raw?.coverPhoto || raw?.cover_photo;
  const userProfilePictureUrl =
    raw?.avatar
    || resolveMediaUrl(raw?.user?.profile_picture_url || raw?.user?.profile_picture)
    || null;
  const coverPhotoUrl =
    resolveMediaUrl(providedCover)
    || (typeof providedCover === 'string' && providedCover.startsWith('data:') ? providedCover : null)
    || defaultCoverFromId(raw?.id);

  return {
    id: String(raw?.id ?? ''),
    ownerId: raw?.ownerId ?? raw?.user?.id ?? null,
    providerName: raw?.providerName || buildProviderName(raw?.user),
    avatar: userProfilePictureUrl
      || coverPhotoUrl
      || 'https://i.pravatar.cc/120?img=11',
    coverPhoto: raw?.cover_photo || null,
    coverPhotoUrl,
    verified: Boolean(raw?.verified ?? raw?.verified_provider),
    rating: toNumber(raw?.rating, 4.6),
    reviews: toNumber(raw?.reviews, 0),
    distance: toNumber(raw?.distance ?? raw?.service_radius, 0),
    category: raw?.category || 'Other',
    title: raw?.title || 'Untitled service',
    shortDescription: raw?.short_description || '',
    fullDescription: raw?.full_description || '',
    price: toNumber(raw?.price, 0),
    priceUnit: parsePriceUnit(raw?.priceUnit || raw?.price_type),
    availability: parseAvailability(raw?.availability),
    experience: toNumber(raw?.experience ?? raw?.experience_years, 0),
    radius: toNumber(raw?.service_radius, 0),
    createdAt: raw?.createdAt || (raw?.created_at ? new Date(raw.created_at).getTime() : Date.now()),
    responseTime: raw?.responseTime || 'Usually replies in 20 mins',
    skills: Array.isArray(raw?.skills) ? raw.skills : (raw?.category ? [raw.category] : []),
    certifications: Array.isArray(raw?.certifications) ? raw.certifications : [],
    gallery: Array.isArray(raw?.gallery) ? raw.gallery : (coverPhotoUrl ? [coverPhotoUrl] : []),
    schedule: raw?.working_hours
      ? raw.working_hours.split(',').map((item) => item.trim()).filter(Boolean)
      : (Array.isArray(raw?.schedule) && raw.schedule.length > 0 ? raw.schedule : ['Flexible schedule']),
    location: raw?.location || '',
  };
};

export const createService = async (formData, token) => {
  const title = String(formData.get('title') || '').trim();
  const category = String(formData.get('category') || 'Other').trim();
  const shortDescription = String(formData.get('short_description') || '').trim();
  const fullDescription = String(formData.get('full_description') || '').trim();
  const location = String(formData.get('location') || '').trim();
  const price = toNumber(formData.get('price'), 0);
  const experience = toNumber(formData.get('experience_years'), 0);
  const serviceRadius = toNumber(formData.get('service_radius'), 0);
  const workingHours = String(formData.get('working_hours') || '').trim();

  if (!title || !shortDescription || !fullDescription || !location || price <= 0) {
    throw new Error('Please complete all required service fields.');
  }

  const coverPhotoDataUrl = await readImageAsDataUrl(formData.get('cover_photo'));
  const nextId = `svc-${Date.now()}`;

  const listing = normalizeService({
    id: nextId,
    ownerId: null,
    providerName: 'You',
    avatar: '/profilePicture.png',
    verified: true,
    rating: 4.9,
    reviews: 0,
    distance: serviceRadius,
    category,
    title,
    shortDescription,
    fullDescription,
    price,
    priceUnit: formData.get('price_type') || 'hour',
    availability: formData.get('availability') || 'Flexible',
    experience,
    service_radius: serviceRadius,
    createdAt: Date.now(),
    responseTime: 'Usually replies in 5 mins',
    certifications: [],
    skills: [category],
    working_hours: workingHours,
    location,
    coverPhotoUrl: coverPhotoDataUrl || defaultCoverFromId(nextId),
  });

  const currentServices = readStoredServices().map(normalizeService);
  writeStoredServices([listing, ...currentServices.filter((item) => item.id !== listing.id)]);

  return {
    message: 'Service created successfully',
    service: listing,
  };
};

export const getServices = async () => {
  return readStoredServices().map(normalizeService);
};

export const deleteService = async (id, token) => {
  const current = readStoredServices().map(normalizeService);
  const next = current.filter((service) => service.id !== String(id));
  writeStoredServices(next);

  return {
    message: 'Service deleted successfully',
  };
};

export const reportService = async (serviceId, reason = '', token) => {
  const resolvedServiceId = String(serviceId || '').trim();
  if (!resolvedServiceId) {
    throw new Error('Invalid service selected for report.');
  }

  return {
    message: 'Service reported successfully',
    reportId: Date.now(),
  };
};

export const getAdminServices = async (token) => {
  const services = readStoredServices();

  return services.map((service) => {
    const id = service.id || 'x';
    return {
      ...service,
      seller: {
        id: Number(id) + 300 || 300,
        first_name: service.providerName || 'Provider',
        last_name: '',
        username: 'provider_' + id,
        email: 'provider@example.com',
        profile_picture: null,
        is_banned: false,
        banned_until: null,
      },
      reports: [],
      report_count: 0,
      verified_provider: Boolean(service.verified),
    };
  });
};

export const hideAdminService = async (serviceId, reason = '', token) => {
  const resolvedServiceId = String(serviceId || '').trim();
  if (!resolvedServiceId) {
    throw new Error('Invalid service selected for moderation.');
  }

  const services = readStoredServices();
  const service = services.find((item) => String(item?.id) === resolvedServiceId);
  if (!service) {
    throw new Error('Service not found.');
  }

  const updatedServices = services.map((item) => {
    if (String(item?.id) === resolvedServiceId) {
      return { ...item, is_active: false };
    }
    return item;
  });

  writeStoredServices(updatedServices);

  return {
    message: 'Service hidden successfully',
    service: { ...service, is_active: false },
  };
};

export const verifyAdminService = async (serviceId, token) => {
  const resolvedServiceId = String(serviceId || '').trim();
  if (!resolvedServiceId) {
    throw new Error('Invalid service selected for verification.');
  }

  const services = readStoredServices();
  const service = services.find((item) => String(item?.id) === resolvedServiceId);
  if (!service) {
    throw new Error('Service not found.');
  }

  const updatedServices = services.map((item) => {
    if (String(item?.id) === resolvedServiceId) {
      return { ...item, verified: true };
    }
    return item;
  });

  writeStoredServices(updatedServices);

  return {
    message: 'Service verified successfully',
    service: { ...service, verified: true, verified_provider: true },
    clearedReports: 0,
  };
};

export const flagAdminService = async (serviceId, reason = '', token) => {
  const resolvedServiceId = String(serviceId || '').trim();
  if (!resolvedServiceId) {
    throw new Error('Invalid service selected for flagging.');
  }

  const services = readStoredServices();
  const service = services.find((item) => String(item?.id) === resolvedServiceId);
  if (!service) {
    throw new Error('Service not found.');
  }

  const updatedServices = services.map((item) => {
    if (String(item?.id) === resolvedServiceId) {
      return { ...item, is_flagged: true };
    }
    return item;
  });

  writeStoredServices(updatedServices);

  return {
    message: 'Service flagged for moderation',
    service: { ...service, is_flagged: true },
  };
};

export const dismissAdminServiceReports = async (serviceId, token) => {
  const resolvedServiceId = String(serviceId || '').trim();
  if (!resolvedServiceId) {
    throw new Error('Invalid service selected for report dismissal.');
  }

  const services = readStoredServices();
  const service = services.find((item) => String(item?.id) === resolvedServiceId);
  if (!service) {
    throw new Error('Service not found.');
  }

  const updatedServices = services.map((item) => {
    if (String(item?.id) === resolvedServiceId) {
      return { ...item, reports: [], report_count: 0 };
    }
    return item;
  });

  writeStoredServices(updatedServices);

  return {
    message: 'Service reports dismissed successfully',
    service: { ...service, reports: [], report_count: 0 },
    clearedReports: 0,
  };
};

export const banServiceProvider = async (serviceId, reason = '', token) => {
  const resolvedServiceId = String(serviceId || '').trim();
  if (!resolvedServiceId) {
    throw new Error('Invalid service selected for provider ban.');
  }

  const services = readStoredServices();
  const target = services.find((item) => String(item?.id) === resolvedServiceId);
  if (!target) {
    throw new Error('Service not found.');
  }

  const providerName = target.providerName || 'Provider';
  const providerId = target.user?.id || target.ownerId;

  const nextServices = services.filter((item) => {
    if (providerId != null && (item.user?.id === providerId || item.ownerId === providerId)) {
      return false;
    }
    if (item.providerName === providerName) return false;
    return true;
  });

  const count = services.length - nextServices.length;
  writeStoredServices(nextServices);

  const provider = {
    id: Number(target.id || 0) + 300 || 300,
    first_name: target.providerName || 'Provider',
    last_name: '',
    username: 'provider_' + (target.id || 'x'),
    email: 'provider@example.com',
    profile_picture: null,
    is_banned: false,
    banned_until: null,
  };

  return {
    message: 'Provider banned successfully',
    affectedServices: count,
    seller: provider,
  };
};
