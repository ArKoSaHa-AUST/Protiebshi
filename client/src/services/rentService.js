// src/services/rentService.js
import { ENV } from '@/config/env';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { rentListings as DEMO_RENT_LISTINGS } from '@/features/rent/mock/rentData';

const getConfiguredApiHost = () => String(ENV.API_BASE_URL || '').trim().replace(/\/$/, '');
const RENT_STORAGE_KEY = 'protibeshi_rent_listings_v2';

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

const extractApiErrorMessage = (data, fallback) => {
  if (!data) return fallback;

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }

  if (data.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors)[0];
    if (Array.isArray(first) && first.length > 0) return first[0];
    if (typeof first === 'string' && first.trim()) return first;
  }

  return fallback;
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

const hasWindow = () => typeof window !== 'undefined';

const readRentStorage = () => {
  if (!hasWindow()) {
    return DEMO_RENT_LISTINGS.slice();
  }

  const rawValue = window.localStorage.getItem(RENT_STORAGE_KEY);
  if (!rawValue) {
    window.localStorage.setItem(RENT_STORAGE_KEY, JSON.stringify(DEMO_RENT_LISTINGS));
    return DEMO_RENT_LISTINGS.slice();
  }

  const parsedValue = parseJsonString(rawValue);
  if (!Array.isArray(parsedValue)) {
    window.localStorage.setItem(RENT_STORAGE_KEY, JSON.stringify(DEMO_RENT_LISTINGS));
    return DEMO_RENT_LISTINGS.slice();
  }

  return parsedValue;
};

const writeRentStorage = (listings) => {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.setItem(RENT_STORAGE_KEY, JSON.stringify(listings));
};

const readLocalPhotoDataUrl = async (photoFile) => {
  if (!photoFile || typeof File === 'undefined' || !(photoFile instanceof File)) {
    return null;
  }

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => reject(new Error('Failed to read uploaded photo.'));
    reader.readAsDataURL(photoFile);
  });
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

/**
 * Normalize a raw API rent listing into the shape expected by RentListingCard.
 */
export const normalizeRentListing = (raw) => {
  const createdAt = raw.created_at ? new Date(raw.created_at) : null;
  const listedDays = createdAt
    ? Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 86_400_000))
    : 0;
  const rawPhoto = raw?.photo_url || raw?.photo || raw?.image || null;
  const imageUrl =
    typeof rawPhoto === 'string' && rawPhoto.startsWith('/') && !rawPhoto.startsWith('/storage/')
      ? rawPhoto
      : resolveMediaUrl(raw?.photo_url) || resolveMediaUrl(raw?.photo) || resolveMediaUrl(raw?.image);

  return {
    ...raw,
    image: imageUrl,
    sqft: raw.size_sqft ?? raw.sqft ?? null,
    verified: Boolean(raw.verified_landlord),
    views: 0,
    listedDays,
  };
};

export const createRentListing = async (formData, token) => {
  const title = String(formData.get('title') || '').trim();
  const location = String(formData.get('location') || '').trim();
  const price = Number(formData.get('price') || 0);
  const deposit = Number(formData.get('deposit') || 0);
  const distance = Number(formData.get('distance') || 0);
  const sqft = Number(formData.get('size_sqft') || 0);
  const beds = Number(formData.get('beds') || 0);
  const baths = Number(formData.get('baths') || 0);
  const type = String(formData.get('type') || 'apartment').trim();
  const furnishing = String(formData.get('furnishing') || 'semi-furnished').trim();
  const availability = String(formData.get('availability') || 'now').trim();
  const badge = String(formData.get('badge') || 'verified').trim();
  const verifiedLandlord = String(formData.get('verified_landlord') || '1') === '1';
  const photoFile = formData.get('photo');

  if (!title || !location || !Number.isFinite(price) || price <= 0 || !Number.isFinite(deposit) || !Number.isFinite(distance) || !Number.isFinite(sqft)) {
    throw new Error('Please complete all required property fields.');
  }

  const nextId = readRentStorage().reduce((max, item) => Math.max(max, Number(item?.id) || 0), 0) + 1;
  const photoDataUrl = await readLocalPhotoDataUrl(photoFile);

  const listing = normalizeRentListing({
    id: nextId,
    title,
    price,
    deposit,
    location,
    distance,
    beds,
    baths,
    sqft,
    type,
    furnishing,
    availability,
    availabilityDate: availability === 'dated' ? String(formData.get('availabilityDate') || '').trim() : null,
    badge,
    verified: verifiedLandlord,
    verified_landlord: verifiedLandlord,
    views: 0,
    listedDays: 0,
    user: {
      id: null,
      first_name: 'You',
      last_name: '',
      profile_picture: '/profilePicture.png',
    },
    photo_url: photoDataUrl,
    image: photoDataUrl,
  });

  const currentListings = readRentStorage();
  writeRentStorage([listing, ...currentListings.filter((item) => Number(item?.id) !== Number(listing.id))]);

  return {
    message: 'Rent listing created successfully',
    listing,
  };
};

export const getRentListings = async () => {
  return readRentStorage().map(normalizeRentListing);
};

export const deleteRentListing = async (id, token) => {
  const resolvedListingId = Number(id);
  const listings = readRentStorage();
  const nextListings = listings.filter((item) => Number(item?.id) !== resolvedListingId);
  writeRentStorage(nextListings);

  return { message: 'Rent listing deleted successfully' };
};

export const reportRentListing = async (listingId, reason = '', token) => {
  const resolvedListingId = Number(listingId);
  if (!Number.isFinite(resolvedListingId) || resolvedListingId <= 0) {
    throw new Error('Invalid rent listing selected for report.');
  }

  return {
    message: 'Rent listing reported successfully',
    reportId: resolvedListingId,
  };
};

export const getAdminRentListings = async (token) => {
  const listings = readRentStorage();

  return listings.map((listing) => {
    const seller = listing.user
      ? {
          id: listing.user.id,
          first_name: listing.user.first_name,
          last_name: listing.user.last_name,
          username: listing.user.username || 'user_' + listing.user.id,
          email: listing.user.email || 'owner@example.com',
          profile_picture: listing.user.profile_picture || null,
          is_banned: false,
          total_active_rent_listings: 1,
        }
      : {
          id: Number(listing.id || 0) + 100,
          first_name: 'Owner',
          last_name: String(listing.id || 0),
          username: 'owner_' + (listing.id || 0),
          email: 'owner@example.com',
          profile_picture: null,
          is_banned: false,
          total_active_rent_listings: 1,
        };

    return {
      ...listing,
      seller,
      reports: [],
      report_count: 0,
    };
  });
};

export const hideAdminRentListing = async (listingId, reason = '', token) => {
  const resolvedListingId = Number(listingId);
  if (!Number.isFinite(resolvedListingId) || resolvedListingId <= 0) {
    throw new Error('Invalid rent listing selected for deletion.');
  }

  const listings = readRentStorage();
  const listing = listings.find((item) => Number(item?.id) === resolvedListingId);
  const nextListings = listings.filter((item) => Number(item?.id) !== resolvedListingId);
  writeRentStorage(nextListings);

  return {
    message: 'Rent listing removed from feed',
    listing: listing || null,
  };
};

export const banRentListingOwner = async (listingId, reason = '', token) => {
  const resolvedListingId = Number(listingId);
  if (!Number.isFinite(resolvedListingId) || resolvedListingId <= 0) {
    throw new Error('Invalid rent listing selected for user ban.');
  }

  const listings = readRentStorage();
  const target = listings.find((item) => Number(item?.id) === resolvedListingId);
  if (!target) {
    throw new Error('Rent listing not found.');
  }

  const targetUser = target.user;
  const targetFirstName = targetUser?.first_name || '';
  const targetLastName = targetUser?.last_name || '';
  const targetUserId = targetUser?.id;

  const nextListings = listings.filter((item) => {
    const user = item.user;
    if (!user) return true;
    if (targetUserId != null && user.id === targetUserId) return false;
    if (user.first_name === targetFirstName && user.last_name === targetLastName) return false;
    return true;
  });

  const removedCount = listings.length - nextListings.length;
  writeRentStorage(nextListings);

  const seller = target.user
    ? {
        id: target.user.id,
        first_name: target.user.first_name,
        last_name: target.user.last_name,
        username: target.user.username || 'user_' + target.user.id,
        email: target.user.email || 'owner@example.com',
        profile_picture: target.user.profile_picture || null,
        is_banned: false,
        total_active_rent_listings: 1,
      }
    : {
        id: resolvedListingId + 100,
        first_name: 'Owner',
        last_name: String(resolvedListingId),
        username: 'owner_' + resolvedListingId,
        email: 'owner@example.com',
        profile_picture: null,
        is_banned: false,
        total_active_rent_listings: 1,
      };

  return {
    message: 'Landlord banned successfully',
    affectedListings: removedCount,
    seller,
  };
};
