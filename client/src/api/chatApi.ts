import { ENV } from '@/config/env';
import { getStoredToken } from '@/features/auth/utils/tokenStorage';

export type ChatUser = {
  id: number;
  name: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  profile_picture?: string | null;
};

export type ChatConversation = {
  id: number;
  listing_id: number | null;
  last_message: string | null;
  unread_count: number;
  is_admin_inbox?: boolean;
  is_gemini_inbox?: boolean;
  is_read_only?: boolean;
  admin_contact_email?: string | null;
  created_at?: string;
  updated_at?: string;
  user: ChatUser | null;
};

export type ChatMessage = {
  id: number | string;
  conversation_id: number;
  message: string;
  sender_id: number;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
  sender: ChatUser | null;
};

export type ConversationCallSession = {
  id: number;
  conversation_id: number;
  initiator_id: number;
  call_type: string;
  status: string;
  room_name: string;
  jitsi_join_url: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  initiator: ChatUser | null;
};

export type CallSignalType = 'offer' | 'answer' | 'ice-candidate' | 'leave';

export type CallSignalPayload = Record<string, unknown>;

type JsonRecord = Record<string, unknown>;

const getApiBaseUrl = () => {
  const configuredBaseUrl = String(ENV.API_BASE_URL || '').trim().replace(/\/$/, '');

  if (configuredBaseUrl) {
    return `${configuredBaseUrl}/api`;
  }

  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }

  return 'http://127.0.0.1:8000/api';
};

const parseJsonSafely = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const throwIfJsonMissing = (data: unknown): void => {
  if (data !== null) {
    return;
  }

  throw new Error('Invalid API response. Check VITE_API_URL and deployment API routing.');
};

const getAuthHeaders = (includeJsonContentType = true): Record<string, string> => {
  const token = getStoredToken();

  return {
    ...(includeJsonContentType ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const throwIfNotOk = (response: Response, data: unknown, fallbackMessage: string): void => {
  if (response.ok) {
    return;
  }

  const payload = data as { message?: string } | null;

  const message =
    (typeof payload?.message === 'string' && payload.message.trim())
      ? payload.message
      : fallbackMessage;

  throw new Error(message);
};

const CHAT_CONVERSATIONS_KEY = 'protibeshi_chat_conversations_v1';
const CHAT_MESSAGES_KEY = 'protibeshi_chat_messages_v1';

const DEMO_USER_1: ChatUser = { id: 2, name: 'Alice Smith', profile_picture: 'https://picsum.photos/100/100?random=11' };
const DEMO_USER_2: ChatUser = { id: 3, name: 'Bob Jones', profile_picture: 'https://picsum.photos/100/100?random=12' };
const DEMO_USER_3: ChatUser = { id: 4, name: 'Tech Repair Shop', profile_picture: 'https://picsum.photos/100/100?random=13' };
const DEMO_USER_GEMINI: ChatUser = { id: 99, name: 'Gemini Assistant', username: 'gemini_ai', profile_picture: 'https://picsum.photos/100/100?random=14' };

const INITIAL_CONVERSATIONS: ChatConversation[] = [
  {
    id: 1, listing_id: null, last_message: 'Hi! Is the Chuwi HeroBook still available?', unread_count: 0,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user: DEMO_USER_1
  },
  {
    id: 2, listing_id: null, last_message: 'Sure, I will come by tomorrow to check the apartment.', unread_count: 2,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user: DEMO_USER_2
  },
  {
    id: 3, listing_id: null, last_message: 'Your laptop repair is completed. You can pick it up today.', unread_count: 0,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user: DEMO_USER_3
  },
  {
    id: 4, listing_id: null, last_message: 'Hello! How can I help you today?', unread_count: 0,
    is_gemini_inbox: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user: DEMO_USER_GEMINI
  }
];

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 101, conversation_id: 1, message: 'Hi! Is the Chuwi HeroBook still available?', sender_id: 2, is_read: true, created_at: new Date().toISOString(), sender: DEMO_USER_1 },
  { id: 102, conversation_id: 2, message: 'Is the apartment fully furnished?', sender_id: 3, is_read: false, created_at: new Date().toISOString(), sender: DEMO_USER_2 },
  { id: 103, conversation_id: 2, message: 'Sure, I will come by tomorrow to check the apartment.', sender_id: 3, is_read: false, created_at: new Date().toISOString(), sender: DEMO_USER_2 },
  { id: 104, conversation_id: 3, message: 'Your laptop repair is completed. You can pick it up today.', sender_id: 4, is_read: true, created_at: new Date().toISOString(), sender: DEMO_USER_3 },
  { id: 105, conversation_id: 4, message: 'Hello! How can I help you today?', sender_id: 99, is_read: true, created_at: new Date().toISOString(), sender: DEMO_USER_GEMINI }
];

const readChatStorage = <T>(key: string, initialData: T): T => {
  if (typeof window === 'undefined') return initialData;
  const data = window.localStorage.getItem(key);
  if (!data) {
    window.localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  }
  try { return JSON.parse(data); } catch { return initialData; }
};

const writeChatStorage = <T>(key: string, data: T) => {
  if (typeof window !== 'undefined') window.localStorage.setItem(key, JSON.stringify(data));
};

export const startConversation = async (
  receiver_id: number,
  listing_id?: number | null,
): Promise<{ success: boolean; conversation: ChatConversation }> => {
  const convos = readChatStorage<ChatConversation[]>(CHAT_CONVERSATIONS_KEY, INITIAL_CONVERSATIONS);
  
  let existing = convos.find(c => c.user?.id === receiver_id);
  if (!existing) {
    existing = {
      id: Date.now(),
      listing_id: listing_id ?? null,
      last_message: '',
      unread_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: { id: receiver_id, name: 'User ' + receiver_id }
    };
    convos.unshift(existing);
    writeChatStorage(CHAT_CONVERSATIONS_KEY, convos);
  }
  
  return { success: true, conversation: existing };
};

export const getConversations = async (): Promise<ChatConversation[]> => {
  return readChatStorage<ChatConversation[]>(CHAT_CONVERSATIONS_KEY, INITIAL_CONVERSATIONS);
};

export const getMessages = async (conversationId: number | string): Promise<ChatMessage[]> => {
  const msgs = readChatStorage<ChatMessage[]>(CHAT_MESSAGES_KEY, INITIAL_MESSAGES);
  return msgs.filter(m => String(m.conversation_id) === String(conversationId));
};

export const sendMessage = async (
  conversation_id: number,
  message: string,
): Promise<{ success: boolean; message: ChatMessage }> => {
  const msgs = readChatStorage<ChatMessage[]>(CHAT_MESSAGES_KEY, INITIAL_MESSAGES);
  const convos = readChatStorage<ChatConversation[]>(CHAT_CONVERSATIONS_KEY, INITIAL_CONVERSATIONS);
  
  const newMessage: ChatMessage = {
    id: Date.now(),
    conversation_id,
    message,
    sender_id: 1, // current user
    is_read: true,
    created_at: new Date().toISOString(),
    sender: { id: 1, name: 'You' }
  };
  
  msgs.push(newMessage);
  writeChatStorage(CHAT_MESSAGES_KEY, msgs);
  
  const updatedConvos = convos.map(c => {
    if (String(c.id) === String(conversation_id)) {
      return { ...c, last_message: message, updated_at: new Date().toISOString() };
    }
    return c;
  });
  writeChatStorage(CHAT_CONVERSATIONS_KEY, updatedConvos);
  
  return { success: true, message: newMessage };
};

export const startAudioCall = async (
  conversation_id: number,
): Promise<{ success: boolean; call_session: ConversationCallSession }> => {
  return {
    success: true,
    call_session: {
      id: Date.now(), conversation_id, initiator_id: 1, call_type: 'audio', status: 'initiated',
      room_name: 'demo_room', jitsi_join_url: '', started_at: new Date().toISOString(), ended_at: null,
      duration_seconds: 0, initiator: { id: 1, name: 'You' }
    }
  };
};

export const getConversationCallSessions = async (
  conversationId: number | string,
): Promise<ConversationCallSession[]> => {
  return [];
};

export const getCallSession = async (
  callSessionId: number | string,
): Promise<{ success: boolean; call_session: ConversationCallSession }> => {
  throw new Error('Not implemented');
};

export const getActiveIncomingCallSession = async (): Promise<{ success: boolean; call_session: ConversationCallSession | null }> => {
  return { success: true, call_session: null };
};

export const endCallSession = async (
  callSessionId: number | string,
): Promise<{ success: boolean; call_session: ConversationCallSession }> => {
  return { success: true, call_session: { id: Number(callSessionId) } as ConversationCallSession };
};

export const acceptCallSession = async (
  callSessionId: number | string,
): Promise<{ success: boolean; call_session: ConversationCallSession }> => {
  return { success: true, call_session: { id: Number(callSessionId) } as ConversationCallSession };
};

export const sendCallSignal = async (
  callSessionId: number | string,
  signal_type: CallSignalType,
  signal_payload: CallSignalPayload,
): Promise<{ success: boolean; recipient_id: number }> => {
  return { success: true, recipient_id: 2 };
};

export const saveGeminiReply = async (
  conversation_id: number,
  message: string,
): Promise<{ success: boolean; message: ChatMessage }> => {
  return sendMessage(conversation_id, message);
};

export const markAsRead = async (
  conversation_id: number,
): Promise<{ success: boolean; updated_count: number }> => {
  const msgs = readChatStorage<ChatMessage[]>(CHAT_MESSAGES_KEY, INITIAL_MESSAGES);
  const convos = readChatStorage<ChatConversation[]>(CHAT_CONVERSATIONS_KEY, INITIAL_CONVERSATIONS);
  
  let updatedCount = 0;
  const updatedMsgs = msgs.map(m => {
    if (String(m.conversation_id) === String(conversation_id) && !m.is_read) {
      updatedCount++;
      return { ...m, is_read: true };
    }
    return m;
  });
  writeChatStorage(CHAT_MESSAGES_KEY, updatedMsgs);
  
  const updatedConvos = convos.map(c => {
    if (String(c.id) === String(conversation_id)) {
      return { ...c, unread_count: 0 };
    }
    return c;
  });
  writeChatStorage(CHAT_CONVERSATIONS_KEY, updatedConvos);
  
  return { success: true, updated_count: updatedCount };
};
