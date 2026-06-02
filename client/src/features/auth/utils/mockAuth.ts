export const MOCK_SIGN_IN_EMAIL = 'user@gmail.com';
export const MOCK_SIGN_IN_PASSWORD = 'User@123';
export const MOCK_SIGN_IN_TOKEN = 'protibeshi-mock-user-token';
export const MOCK_SIGN_UP_STORAGE_KEY = 'protibeshi_mock_signups';

export type MockSignupSubmission = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  city: string;
  neighborhood: string;
  bio: string;
  createdAt: string;
};

const canUseStorage = () => typeof window !== 'undefined' && Boolean(window.localStorage);

export const isMockSignInCredential = (email: string, password: string) => {
  return email.trim().toLowerCase() === MOCK_SIGN_IN_EMAIL && password === MOCK_SIGN_IN_PASSWORD;
};

export const getMockSignUpSubmissions = (): MockSignupSubmission[] => {
  if (!canUseStorage()) {
    return [];
  }

  const raw = window.localStorage.getItem(MOCK_SIGN_UP_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is MockSignupSubmission => {
      return Boolean(item)
        && typeof item === 'object'
        && typeof item.firstName === 'string'
        && typeof item.lastName === 'string'
        && typeof item.username === 'string'
        && typeof item.email === 'string'
        && typeof item.phone === 'string'
        && typeof item.city === 'string'
        && typeof item.neighborhood === 'string'
        && typeof item.bio === 'string'
        && typeof item.createdAt === 'string';
    });
  } catch {
    return [];
  }
};

export const saveMockSignUpSubmission = (submission: Omit<MockSignupSubmission, 'createdAt'>) => {
  if (!canUseStorage()) {
    return;
  }

  const existing = getMockSignUpSubmissions();
  const nextSubmission: MockSignupSubmission = {
    ...submission,
    createdAt: new Date().toISOString(),
  };

  window.localStorage.setItem(MOCK_SIGN_UP_STORAGE_KEY, JSON.stringify([...existing, nextSubmission]));
};