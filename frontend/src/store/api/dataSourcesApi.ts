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

export const dataSourcesApi = createApi({
  reducerPath: 'dataSourcesApi',
  baseQuery,
  tagTypes: ['DataSource', 'DataEvent'],
  endpoints: (builder) => ({
    getDataSources: builder.query({
      query: () => '/data-sources',
      providesTags: ['DataSource'],
    }),
    getDataSource: builder.query({
      query: (id: string) => `/data-sources/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'DataSource', id }],
    }),
    createDataSource: builder.mutation({
      query: (dataSource) => ({
        url: '/data-sources',
        method: 'POST',
        body: dataSource,
      }),
      invalidatesTags: ['DataSource'],
    }),
    updateDataSource: builder.mutation({
      query: ({ id, ...dataSource }) => ({
        url: `/data-sources/${id}`,
        method: 'PUT',
        body: dataSource,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'DataSource', id }],
    }),
    deleteDataSource: builder.mutation({
      query: (id: string) => ({
        url: `/data-sources/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DataSource'],
    }),
    testConnection: builder.mutation({
      query: (id: string) => ({
        url: `/data-sources/${id}/test`,
        method: 'POST',
      }),
    }),
    syncDataSource: builder.mutation({
      query: (id: string) => ({
        url: `/data-sources/${id}/sync`,
        method: 'POST',
      }),
      invalidatesTags: ['DataEvent'],
    }),
    getDataSourceEvents: builder.query({
      query: (id: string) => `/data-sources/${id}/events`,
      providesTags: (_result, _error, id) => [{ type: 'DataEvent', id }],
    }),
  }),
});

export const {
  useGetDataSourcesQuery,
  useGetDataSourceQuery,
  useCreateDataSourceMutation,
  useUpdateDataSourceMutation,
  useDeleteDataSourceMutation,
  useTestConnectionMutation,
  useSyncDataSourceMutation,
  useGetDataSourceEventsQuery,
} = dataSourcesApi;
