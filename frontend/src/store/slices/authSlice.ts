import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const getInitialAuthState = (): AuthState => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const tokenExpiry = localStorage.getItem('tokenExpiry') ? parseInt(localStorage.getItem('tokenExpiry')!) : null;
  const userStr = localStorage.getItem('user');
  
  // Check if we have valid tokens and they're not expired
  const isTokenValid = accessToken && refreshToken && tokenExpiry && Date.now() < tokenExpiry;
  
  // Parse user data with error handling
  let user = null;
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      // Clear invalid user data
      localStorage.removeItem('user');
    }
  }
  
  const state = {
    user,
    accessToken,
    refreshToken,
    tokenExpiry,
    isAuthenticated: !!isTokenValid,
    isLoading: false,
  };

  return state;
};

const initialState: AuthState = getInitialAuthState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; accessToken: string; refreshToken: string; tokenExpiry: number }>) => {
      const { user, accessToken, refreshToken, tokenExpiry } = action.payload;

      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.tokenExpiry = tokenExpiry;
      state.isAuthenticated = true;
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('tokenExpiry', tokenExpiry.toString());
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.tokenExpiry = null;
      state.isAuthenticated = false;
      
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenExpiry');
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    updateTokens: (state, action: PayloadAction<{ accessToken: string; tokenExpiry: number }>) => {
      const { accessToken, tokenExpiry } = action.payload;
      state.accessToken = accessToken;
      state.tokenExpiry = tokenExpiry;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('tokenExpiry', tokenExpiry.toString());
    },
  },
});

export const { setCredentials, logout, setLoading, updateTokens } = authSlice.actions;
export default authSlice.reducer;
