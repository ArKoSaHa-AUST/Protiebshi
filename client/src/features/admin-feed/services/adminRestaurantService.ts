export type AdminRestaurantStatus = 'pending' | 'approved' | 'rejected';

export type AdminRestaurantRecord = {
  id: number;
  name: string;
  category: string;
  location: string;
  address: string;
  owner_name: string | null;
  phone: string;
  website: string | null;
  status: AdminRestaurantStatus;
  is_verified: boolean;
  created_at: string;
};

type AdminRestaurantListResponse = {
  success?: boolean;
  message?: string;
  data?: AdminRestaurantRecord[];
};

type AdminRestaurantUpdateResponse = {
  success?: boolean;
  message?: string;
  data?: {
    restaurant?: AdminRestaurantRecord;
  };
};

const LOCAL_RESTAURANTS_KEY = 'protibeshi_restaurants_api';

const getLocalRestaurants = (): AdminRestaurantRecord[] => {
  try {
    const raw = localStorage.getItem(LOCAL_RESTAURANTS_KEY);
    return raw ? (JSON.parse(raw) as AdminRestaurantRecord[]) : [];
  } catch {
    return [];
  }
};

const setLocalRestaurants = (restaurants: AdminRestaurantRecord[]): void => {
  localStorage.setItem(LOCAL_RESTAURANTS_KEY, JSON.stringify(restaurants));
};

export const fetchAdminRestaurants = async (
  mode: 'requests' | 'all',
): Promise<AdminRestaurantRecord[]> => {
  const list = getLocalRestaurants();

  if (mode === 'requests') {
    return list.filter((item) => item.status === 'pending');
  }

  return list;
};

export const updateAdminRestaurantStatus = async (
  restaurantId: number,
  status: AdminRestaurantStatus,
): Promise<AdminRestaurantRecord> => {
  const list = getLocalRestaurants();
  const index = list.findIndex((r) => r.id === restaurantId);

  if (index === -1) {
    throw new Error('Restaurant not found.');
  }

  list[index].status = status;
  setLocalRestaurants(list);
  return list[index];
};
