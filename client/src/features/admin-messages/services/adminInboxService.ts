import type { ChatConversation, ChatMessage } from '@/api/chatApi';
import type { AdminInboxUser } from '../types/adminInbox.types';

const ADMIN_INBOX_CONVERSATIONS_KEY = 'protibeshi_admin_inbox_conversations';
const ADMIN_INBOX_MESSAGES_KEY = 'protibeshi_admin_inbox_messages';

const getMockConversations = (): ChatConversation[] => [
  {
    id: 1,
    user: {
      id: 1,
      name: 'Alice Johnson',
      full_name: 'Alice Johnson',
      email: 'alice@example.com',
      profile_picture: null,
      username: 'alice_j',
    },
    latest_message: {
      id: 1,
      conversation_id: 1,
      sender_id: 1,
      receiver_id: 'admin',
      message: 'Hello, I have a question about my listing.',
      is_read: false,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    unread_count: 1,
  },
  {
    id: 2,
    user: {
      id: 2,
      name: 'Bob Smith',
      full_name: 'Bob Smith',
      email: 'bob@example.com',
      profile_picture: null,
      username: 'bobsmith',
    },
    latest_message: {
      id: 2,
      conversation_id: 2,
      sender_id: 'admin',
      receiver_id: 2,
      message: 'Your service request has been approved.',
      is_read: true,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    unread_count: 0,
  }
];

const readConversations = (): ChatConversation[] => {
  if (typeof window === 'undefined') return getMockConversations();
  try {
    const raw = window.localStorage.getItem(ADMIN_INBOX_CONVERSATIONS_KEY);
    return raw ? JSON.parse(raw) : getMockConversations();
  } catch {
    return getMockConversations();
  }
};

const writeConversations = (conversations: ChatConversation[]) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ADMIN_INBOX_CONVERSATIONS_KEY, JSON.stringify(conversations));
  }
};

const readMessages = (conversationId: number): ChatMessage[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(`${ADMIN_INBOX_MESSAGES_KEY}_${conversationId}`);
    if (raw) return JSON.parse(raw);
    
    // Default messages
    if (conversationId === 1) {
      return [{
        id: 1,
        conversation_id: 1,
        sender_id: 1,
        receiver_id: 'admin',
        message: 'Hello, I have a question about my listing.',
        is_read: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      }];
    }
    if (conversationId === 2) {
      return [{
        id: 2,
        conversation_id: 2,
        sender_id: 'admin',
        receiver_id: 2,
        message: 'Your service request has been approved.',
        is_read: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      }];
    }
    return [];
  } catch {
    return [];
  }
};

const writeMessages = (conversationId: number, messages: ChatMessage[]) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(`${ADMIN_INBOX_MESSAGES_KEY}_${conversationId}`, JSON.stringify(messages));
  }
};

export const fetchAdminInboxConversations = async (): Promise<ChatConversation[]> => {
  return readConversations();
};

export const searchAdminInboxUsers = async (query: string): Promise<AdminInboxUser[]> => {
  const users = [
    { id: 1, name: 'Alice Johnson', username: 'alice_j', profile_picture: null },
    { id: 2, name: 'Bob Smith', username: 'bobsmith', profile_picture: null },
    { id: 3, name: 'Carol White', username: 'carol_w', profile_picture: null },
  ];
  return users.filter(u => u.name.toLowerCase().includes(query.toLowerCase()) || (u.username && u.username.toLowerCase().includes(query.toLowerCase())));
};

export const startAdminInboxConversation = async (userId: number): Promise<ChatConversation> => {
  const conversations = readConversations();
  const existing = conversations.find(c => c.user.id === userId);
  if (existing) return existing;

  const users = await searchAdminInboxUsers('');
  const user = users.find(u => u.id === userId) || { id: userId, name: `User ${userId}`, username: `user_${userId}`, profile_picture: null };
  
  const newConversation: ChatConversation = {
    id: Date.now(),
    user: {
      id: user.id,
      name: user.name,
      full_name: user.name,
      email: `${user.username || 'user'}@example.com`,
      profile_picture: user.profile_picture,
      username: user.username,
    },
    latest_message: null as any,
    unread_count: 0,
  };
  
  conversations.push(newConversation);
  writeConversations(conversations);
  return newConversation;
};

export const fetchAdminInboxMessages = async (conversationId: number): Promise<ChatMessage[]> => {
  return readMessages(conversationId);
};

export const sendAdminInboxMessage = async (
  conversationId: number,
  message: string,
): Promise<ChatMessage> => {
  const conversations = readConversations();
  const convIndex = conversations.findIndex(c => c.id === conversationId);
  if (convIndex === -1) throw new Error('Conversation not found');

  const messages = readMessages(conversationId);
  const newMessage: ChatMessage = {
    id: Date.now(),
    conversation_id: conversationId,
    sender_id: 'admin',
    receiver_id: conversations[convIndex].user.id,
    message,
    is_read: true,
    created_at: new Date().toISOString(),
  };
  
  messages.push(newMessage);
  writeMessages(conversationId, messages);
  
  conversations[convIndex].latest_message = newMessage;
  writeConversations(conversations);
  
  return newMessage;
};

export const markAdminInboxRead = async (conversationId: number): Promise<number> => {
  const conversations = readConversations();
  const convIndex = conversations.findIndex(c => c.id === conversationId);
  if (convIndex === -1) return 0;
  
  const unreadCount = conversations[convIndex].unread_count;
  conversations[convIndex].unread_count = 0;
  writeConversations(conversations);
  
  const messages = readMessages(conversationId);
  let updatedCount = 0;
  messages.forEach(m => {
    if (m.receiver_id === 'admin' && !m.is_read) {
      m.is_read = true;
      updatedCount++;
    }
  });
  writeMessages(conversationId, messages);
  
  return unreadCount > 0 ? unreadCount : updatedCount;
};

