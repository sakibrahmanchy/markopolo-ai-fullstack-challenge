import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5900',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  conversationId?: string;
  metadata?: any;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface ChatResponse {
  message: ChatMessage;
  recommendations?: Array<{
    id: string;
    description: string;
    confidence: number;
  }>;
  campaigns?: Array<{
    id: string;
    name: string;
    channels: string[];
  }>;
}

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery,
  tagTypes: ['ChatMessage', 'Conversation'],
  endpoints: (builder) => ({
    sendMessage: builder.mutation<ChatResponse, { content: string; role: 'user' | 'assistant'; conversationId?: string }>({
      query: (body) => ({
        url: '/conversations/messages',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ChatMessage'],
    }),
    getConversations: builder.query<Conversation[], void>({
      query: () => '/conversations',
      providesTags: ['Conversation'],
    }),
    getConversation: builder.query<Conversation, string>({
      query: (id: string) => `/conversations/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'ChatMessage', id }],
    }),
    createConversation: builder.mutation<Conversation, string>({
      query: (title: string) => ({
        url: '/conversations',
        method: 'POST',
        body: { title },
      }),
      invalidatesTags: ['Conversation'],
    }),
    streamResponse: builder.query<any, string>({
      query: (conversationId: string) => `/conversations/${conversationId}/stream`,
      // This will be handled by WebSocket/SSE
    }),
  }),
});

export const {
  useSendMessageMutation,
  useGetConversationsQuery,
  useGetConversationQuery,
  useCreateConversationMutation,
} = chatApi;
