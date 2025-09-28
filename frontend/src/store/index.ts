import { configureStore } from '@reduxjs/toolkit';
import { authApi } from './api/authApi';
import { dataSourcesApi } from './api/dataSourcesApi';
import { oauthApi } from './api/oauthApi';
import { chatApi } from './api/chatApi';
import authSlice from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    [authApi.reducerPath]: authApi.reducer,
    [dataSourcesApi.reducerPath]: dataSourcesApi.reducer,
    [oauthApi.reducerPath]: oauthApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    })
      .concat(authApi.middleware)
      .concat(dataSourcesApi.middleware)
      .concat(oauthApi.middleware)
      .concat(chatApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
