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

export const oauthApi = createApi({
  reducerPath: 'oauthApi',
  baseQuery,
  tagTypes: ['OAuthSession'],
  endpoints: (builder) => ({
    getOAuthSessions: builder.query({
      query: () => '/oauth/sessions',
      providesTags: ['OAuthSession'],
    }),
    connectGTM: builder.query({
      query: () => '/oauth/gtm/connect',
    }),
    connectFacebook: builder.query({
      query: () => '/oauth/facebook/connect',
    }),
    connectShopify: builder.query({
      query: (shop: string) => `/oauth/shopify/connect?shop=${shop}`,
    }),
    revokeOAuthSession: builder.mutation({
      query: (id: string) => ({
        url: `/oauth/sessions/${id}/revoke`,
        method: 'POST',
      }),
      invalidatesTags: ['OAuthSession'],
    }),
  }),
});

export const {
  useGetOAuthSessionsQuery,
  useLazyConnectGTMQuery,
  useLazyConnectFacebookQuery,
  useLazyConnectShopifyQuery,
  useRevokeOAuthSessionMutation,
} = oauthApi;
