import { ENV } from '@/config/env';
import { resolveMediaUrl } from '@/lib/mediaUrl';

const getConfiguredApiHost = () => String(ENV.API_BASE_URL || '').trim().replace(/\/$/, '');
const MARKETPLACE_STORAGE_KEY = 'protibeshi_marketplace_listings_v2';

const DEMO_MARKETPLACE_LISTINGS = [
  {
    id: 'demo-1',
    title: 'Chuwi HeroBook Pro',
    price: 29900,
    location: 'Mirpur',
    is_active: true,
    category: 'Electronics',
    details: 'Model: Chuwi HeroBook Pro\nIntel Celeron Processor N4020 (4M Cache, 1.10 GHz up to 2.80 GHz)\n8GB LPDDR4 RAM\n256GB SSD\n14.1 Inch(1920 x 1080) IPS Anti-Glare Display',
    photo_url: 'https://picsum.photos/400/300?random=101',
  },
  {
    id: 'demo-2',
    title: 'iPhone 17 Pro Max',
    price: 147000,
    location: 'Dhaka',
    is_active: true,
    category: 'Electronics',
    details: 'The iPhone 17 Pro Max is Apple’s most advanced flagship smartphone, featuring a large 6.9-inch Super Retina XDR OLED display with 120Hz ProMotion...',
    photo_url: 'https://picsum.photos/400/300?random=102',
  },
  {
    id: 'demo-3',
    title: 'Ryzen 3 2200G Desktop PC',
    price: 32000,
    location: 'Chattogram',
    is_active: true,
    category: 'Electronics',
    details: 'AMD Ryzen 3 2200G Quad-Core Processor With Radeon Vega 8 Graphics\nASRock B450M-HDV R4.0 AMD Motherboard...',
    photo_url: 'https://picsum.photos/400/300?random=103',
  },
  {
    id: 'demo-4',
    title: 'Sony Alpha a7 III Camera',
    price: 165000,
    location: 'Gulshan',
    is_active: true,
    category: 'Electronics',
    details: 'Full-frame mirrorless camera with 24.2MP, 4K HDR video, and amazing low-light performance. Comes with a 28-70mm lens.',
    photo_url: 'https://picsum.photos/400/300?random=104',
  },
  {
    id: 'demo-5',
    title: 'Honda CBR 150R',
    price: 450000,
    location: 'Banani',
    is_active: true,
    category: 'Vehicles',
    details: 'Excellent condition Honda CBR 150R. Only driven 12,000 km. Papers are completely up to date until 2026.',
    photo_url: 'https://picsum.photos/400/300?random=105',
  },
  {
    id: 'demo-6',
    title: 'Modern L-Shaped Sofa',
    price: 45000,
    location: 'Uttara',
    is_active: true,
    category: 'Furniture',
    details: 'Premium quality fabric sofa with comfortable cushions. Less than a year old, no stains or damages.',
    photo_url: 'https://picsum.photos/400/300?random=106',
  },
  {
    id: 'demo-7',
    title: 'Men\'s Leather Jacket',
    price: 4500,
    location: 'Dhanmondi',
    is_active: true,
    category: 'Fashion',
    details: 'Genuine leather jacket for men. Size: L. Brand new condition, worn only a couple of times.',
    photo_url: 'https://picsum.photos/400/300?random=107',
  },
  {
    id: 'demo-8',
    title: 'Professional Web Development Services',
    price: 15000,
    location: 'Remote',
    is_active: true,
    category: 'Services',
    details: 'I offer custom web development using React, Node.js, and MongoDB. Fast delivery and reliable support.',
    photo_url: 'https://picsum.photos/400/300?random=108',
  },
  {
    id: 'demo-9',
    title: 'Yamaha FZS V3',
    price: 235000,
    location: 'Mirpur',
    is_active: true,
    category: 'Vehicles',
    details: 'Yamaha FZS V3 in pristine condition. ABS breaking system, smooth engine, regularly serviced.',
    photo_url: 'https://picsum.photos/400/300?random=109',
  },
  {
    id: 'demo-10',
    title: 'Solid Wood Dining Table',
    price: 32000,
    location: 'Bashundhara',
    is_active: true,
    category: 'Furniture',
    details: '6-seater dining table made of pure Segun wood. Includes glass top and 6 chairs.',
    photo_url: 'https://picsum.photos/400/300?random=110',
  }
];

const getApiBaseUrl = () => {
  return `${getConfiguredApiHost()}/api`;
};

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch (error) {
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

const hasWindow = () => typeof window !== 'undefined';

const readMarketplaceStorage = () => {
  if (!hasWindow()) {
    return DEMO_MARKETPLACE_LISTINGS.slice();
  }

  const rawValue = window.localStorage.getItem(MARKETPLACE_STORAGE_KEY);
  if (!rawValue) {
    window.localStorage.setItem(MARKETPLACE_STORAGE_KEY, JSON.stringify(DEMO_MARKETPLACE_LISTINGS));
    return DEMO_MARKETPLACE_LISTINGS.slice();
  }

  const parsedValue = parseJsonString(rawValue);
  if (!Array.isArray(parsedValue)) {
    window.localStorage.setItem(MARKETPLACE_STORAGE_KEY, JSON.stringify(DEMO_MARKETPLACE_LISTINGS));
    return DEMO_MARKETPLACE_LISTINGS.slice();
  }

  return parsedValue;
};

const writeMarketplaceStorage = (listings) => {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.setItem(MARKETPLACE_STORAGE_KEY, JSON.stringify(listings));
};

const readPhotoDataUrl = async (photoFile) => {
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

const normalizeListingMedia = (listing) => {
  if (!listing || typeof listing !== 'object') {
    return listing;
  }

  const rawPhotoUrl = listing.photo_url || listing.photo || null;
  const resolvedPhotoUrl =
    typeof rawPhotoUrl === 'string' && rawPhotoUrl.startsWith('/') && !rawPhotoUrl.startsWith('/storage/')
      ? rawPhotoUrl
      : resolveMediaUrl(listing.photo_url) || resolveMediaUrl(listing.photo);

  return {
    ...listing,
    photo_url: resolvedPhotoUrl,
  };
};

const normalizeListingCollection = (listings) => {
  if (!Array.isArray(listings)) {
    return [];
  }

  return listings.map((listing) => normalizeListingMedia(listing));
};

export const createListing = async (formData, token) => {
  const title = String(formData.get('title') || '').trim();
  const priceValue = String(formData.get('price') || '').trim();
  const category = String(formData.get('category') || '').trim();
  const location = String(formData.get('location') || '').trim();
  const details = String(formData.get('details') || '').trim();
  const photoFile = formData.get('photo');

  if (!title || !priceValue || !category || !location) {
    throw new Error('Please complete all required listing fields.');
  }

  const normalizedPrice = Number(priceValue);
  if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
    throw new Error('Please enter a valid numeric price.');
  }

  const existingListings = readMarketplaceStorage();
  const photoUrl = await readPhotoDataUrl(photoFile);

  const storedListing = normalizeListingMedia({
    id: `local-${Date.now()}`,
    title,
    price: normalizedPrice,
    category,
    location,
    details,
    is_active: true,
    photo_url: photoUrl,
    created_at: new Date().toISOString(),
    user_id: null,
  });

  const nextListings = [storedListing, ...existingListings.filter((item) => item?.id !== storedListing.id)];
  writeMarketplaceStorage(nextListings);

  return {
    message: 'Listing created successfully',
    listing: storedListing,
  };
};

export const getListings = async () => {
  return normalizeListingCollection(readMarketplaceStorage());
};

export const deleteListing = async (listingId, token) => {
  const resolvedListingId = String(listingId);
  const listings = readMarketplaceStorage();
  const nextListings = listings.filter((item) => String(item?.id) !== resolvedListingId);
  writeMarketplaceStorage(nextListings);

  return {
    message: 'Listing deleted successfully',
    listing: { id: resolvedListingId },
  };
};

export const getAdminListings = async (token) => {
  const listings = readMarketplaceStorage();

  return listings.map((listing) => {
    const id = listing.id || 0;
    return {
      ...listing,
      seller: {
        id: Number(id) + 200,
        first_name: 'Seller',
        last_name: String(id),
        username: 'seller_' + id,
        email: 'seller@example.com',
        profile_picture: null,
        is_banned: false,
        total_active_listings: 1,
        total_listings: 1,
        warning_count: 0,
      },
      reports: [],
      report_count: 0,
    };
  });
};

export const deleteAdminListing = async (listingId, reason = '', token) => {
  const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
  if (!trimmedReason) {
    throw new Error('Please provide a moderation message before removing this listing.');
  }

  const listings = readMarketplaceStorage();
  const listing = listings.find((item) => String(item?.id) === String(listingId));
  const nextListings = listings.filter((item) => String(item?.id) !== String(listingId));
  writeMarketplaceStorage(nextListings);

  return {
    message: 'Listing removed from marketplace',
    listing: normalizeListingMedia(listing || null),
  };
};

export const banListingSeller = async (listingId, reason = '', token) => {
  const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
  if (!trimmedReason) {
    throw new Error('Please provide a moderation message before banning this user.');
  }

  const listings = readMarketplaceStorage();
  const target = listings.find((item) => String(item?.id) === String(listingId));
  if (!target) {
    throw new Error('Listing not found.');
  }

  const dummySellerId = Number(target.id || 0) + 200;
  const nextListings = listings.filter((item) => Number(item.id || 0) + 200 !== dummySellerId);
  const removedCount = listings.length - nextListings.length;

  writeMarketplaceStorage(nextListings);

  const seller = {
    id: dummySellerId,
    first_name: 'Seller',
    last_name: String(target.id || 0),
    username: 'seller_' + (target.id || 0),
    email: 'seller@example.com',
    profile_picture: null,
    is_banned: false,
    total_active_listings: 1,
    total_listings: 1,
    warning_count: 0,
  };

  return {
    message: 'User banned successfully',
    affectedListings: removedCount,
    seller,
  };
};

export const reportListing = async (listingId, reason = '', token) => {
  return {
    message: 'Listing reported successfully',
    reportId: Date.now(),
  };
};
