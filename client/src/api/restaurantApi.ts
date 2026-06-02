import { getBackendOrigin, resolveMediaUrl } from '@/lib/mediaUrl';
import { getStoredToken } from '@/features/auth/utils/tokenStorage';
import type { Restaurant, RestaurantCategory, PriceRange } from '@/components/food-corner/types';
import type { RestaurantFormValues } from '@/components/food-corner/RestaurantForm';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80';

export type ApiRestaurant = {
  id: number;
  name: string;
  slug: string;
  category: string;
  location: string;
  address: string;
  phone: string;
  website: string | null;
  opening_time: string | null;
  closing_time: string | null;
  price_range: string;
  delivery_available: boolean;
  image_url: string | null;
  cover_image_url: string | null;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  status: string;
  views_count: number;
  is_favorited?: boolean;
  created_at: string;
};

type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    pagination?: PaginationMeta;
  };
  errors?: Record<string, string[]>;
};

export class RestaurantApiError extends Error {
  status: number;
  data: ApiEnvelope<unknown> | null;

  constructor(message: string, status: number, data: ApiEnvelope<unknown> | null) {
    super(message);
    this.name = 'RestaurantApiError';
    this.status = status;
    this.data = data;
  }
}

export type RestaurantListParams = {
  q?: string;
  category?: string;
  location?: string;
  price_range?: string;
  delivery_available?: boolean;
  verified_only?: boolean;
  top_rated?: boolean;
  newest?: boolean;
  per_page?: number;
  page?: number;
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: BodyInit;
  protected?: boolean;
  headers?: Record<string, string>;
};

const getApiBaseUrl = () => getBackendOrigin();

const buildHeaders = (isProtected: boolean, customHeaders?: Record<string, string>) => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(customHeaders || {}),
  };

  if (isProtected) {
    const token = getStoredToken();
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

  let data: ApiEnvelope<unknown> | null = null;
  try {
    data = (await response.json()) as ApiEnvelope<unknown>;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message || `Request failed with status ${response.status}`;
    throw new RestaurantApiError(message, response.status, data);
  }

  return data as T;
};

const parseTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const isRestaurantOpen = (
  openingTime: string | null | undefined,
  closingTime: string | null | undefined,
): boolean => {
  if (!openingTime || !closingTime) {
    return true;
  }

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = parseTimeToMinutes(openingTime);
  const closeMinutes = parseTimeToMinutes(closingTime);

  if (openMinutes <= closeMinutes) {
    return nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
  }

  return nowMinutes >= openMinutes || nowMinutes <= closeMinutes;
};

export const mapApiRestaurantToUi = (api: ApiRestaurant): Restaurant => {
  const imageUrl =
    resolveMediaUrl(api.image_url) ||
    resolveMediaUrl(api.cover_image_url) ||
    FALLBACK_IMAGE;

  return {
    id: String(api.id),
    name: api.name,
    category: api.category as RestaurantCategory,
    location: api.location,
    rating: Number(api.rating) || 0,
    reviews: Number(api.total_reviews) || 0,
    eta: api.delivery_available ? 'Delivery available' : 'Pickup only',
    distanceKm: 0,
    priceRange: (api.price_range || '$$') as PriceRange,
    imageUrl,
    isOpen: isRestaurantOpen(api.opening_time, api.closing_time),
    isTrending: api.is_verified || Number(api.rating) >= 4.5,
    tags: [
      ...(api.delivery_available ? ['Delivery'] : []),
      ...(api.is_verified ? ['Verified'] : []),
    ],
    isSaved: Boolean(api.is_favorited),
  };
};

const getLocalRestaurants = (): ApiRestaurant[] => {
  if (typeof window === 'undefined') return [];
  const stored = window.localStorage.getItem('protibeshi_restaurants_api');
  if (stored) {
    try {
      return JSON.parse(stored) as ApiRestaurant[];
    } catch {}
  }
  
  const initialData: ApiRestaurant[] = [
    {
      id: 1, name: "Kacchi Bhai", slug: "kacchi-bhai", category: "local", location: "Main Street",
      address: "123 Main Street", phone: "01700000001", website: null, opening_time: "11:00", closing_time: "23:00",
      price_range: "$$", delivery_available: true, image_url: null, cover_image_url: null,
      rating: 4.8, total_reviews: 132, is_verified: true, status: "active", views_count: 500, created_at: new Date().toISOString()
    },
    {
      id: 2, name: "Cafe Retro", slug: "cafe-retro", category: "cafe", location: "Sector 3",
      address: "45 Cafe Lane", phone: "01700000002", website: null, opening_time: "08:00", closing_time: "22:00",
      price_range: "$$", delivery_available: false, image_url: null, cover_image_url: null,
      rating: 4.5, total_reviews: 42, is_verified: true, status: "active", views_count: 300, created_at: new Date().toISOString()
    },
    {
      id: 3, name: "Burgerology", slug: "burgerology", category: "fast-food", location: "Food Court",
      address: "1 Food Court", phone: "01700000003", website: null, opening_time: "12:00", closing_time: "23:00",
      price_range: "$$$", delivery_available: true, image_url: null, cover_image_url: null,
      rating: 4.6, total_reviews: 88, is_verified: true, status: "active", views_count: 450, created_at: new Date().toISOString()
    },
    {
      id: 4, name: "Sweet Tooth Bakery", slug: "sweet-tooth-bakery", category: "bakery", location: "Block A",
      address: "15 Block A", phone: "01700000004", website: null, opening_time: "07:00", closing_time: "20:00",
      price_range: "$$", delivery_available: true, image_url: null, cover_image_url: null,
      rating: 4.9, total_reviews: 31, is_verified: true, status: "active", views_count: 200, created_at: new Date().toISOString()
    },
    {
      id: 5, name: "Dhaka Diner", slug: "dhaka-diner", category: "local", location: "Sector 6",
      address: "88 Sector 6", phone: "01700000005", website: null, opening_time: "18:00", closing_time: "04:00",
      price_range: "$$$", delivery_available: true, image_url: null, cover_image_url: null,
      rating: 4.7, total_reviews: 65, is_verified: true, status: "active", views_count: 600, created_at: new Date().toISOString()
    }
  ];

  window.localStorage.setItem('protibeshi_restaurants_api', JSON.stringify(initialData));
  return initialData;
};

const setLocalRestaurants = (restaurants: ApiRestaurant[]) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('protibeshi_restaurants_api', JSON.stringify(restaurants));
  }
};

export const getRestaurants = async (
  params: RestaurantListParams = {},
): Promise<{ restaurants: Restaurant[]; pagination: PaginationMeta | null }> => {
  let restaurants = getLocalRestaurants();

  if (params.q) {
    const q = params.q.toLowerCase();
    restaurants = restaurants.filter((r) => r.name.toLowerCase().includes(q));
  }

  return {
    restaurants: restaurants.map(mapApiRestaurantToUi),
    pagination: null,
  };
};

export const createRestaurant = async (values: RestaurantFormValues): Promise<Restaurant> => {
  const restaurants = getLocalRestaurants();

  const newRestaurant: ApiRestaurant = {
    id: Date.now(),
    name: values.name.trim(),
    slug: values.name.trim().toLowerCase().replace(/\s+/g, '-'),
    category: values.category,
    location: values.location,
    address: values.address.trim(),
    phone: values.phone.trim(),
    website: values.website.trim() || null,
    opening_time: values.openingTime || null,
    closing_time: values.closingTime || null,
    price_range: "$$",
    delivery_available: true,
    image_url: null,
    cover_image_url: null,
    rating: 0,
    total_reviews: 0,
    is_verified: true,
    status: "active",
    views_count: 0,
    is_favorited: false,
    created_at: new Date().toISOString()
  };

  setLocalRestaurants([newRestaurant, ...restaurants]);
  return mapApiRestaurantToUi(newRestaurant);
};

export const addRestaurantFavorite = async (restaurantId: string | number): Promise<void> => {
  const restaurants = getLocalRestaurants();
  const updated = restaurants.map(r => String(r.id) === String(restaurantId) ? { ...r, is_favorited: true } : r);
  setLocalRestaurants(updated);
};

export const removeRestaurantFavorite = async (restaurantId: string | number): Promise<void> => {
  const restaurants = getLocalRestaurants();
  const updated = restaurants.map(r => String(r.id) === String(restaurantId) ? { ...r, is_favorited: false } : r);
  setLocalRestaurants(updated);
};
