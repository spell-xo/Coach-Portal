import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  activeContext: null, // { type: 'personal' | 'club', clubId: string | null, clubName: string | null, role: string | null, originalRole: string | null }
  availableContexts: [], // List of all contexts user can access
  isPlatformAdmin: false, // Flag to indicate if user is a platform admin
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken, refreshToken, activeContext, availableContexts } = action.payload;
      state.user = {
        ...user,
        roles: user.roles || [user.role], // Ensure roles array exists
        primaryRole: user.primaryRole || user.role, // Ensure primaryRole exists
      };
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      state.error = null;
      // Set context data if provided
      if (activeContext) {
        state.activeContext = activeContext;
      }
      if (availableContexts) {
        state.availableContexts = availableContexts;
      }
    },
    updateUserRole: (state, action) => {
      const { roles, primaryRole, accessToken } = action.payload;
      if (state.user) {
        state.user.roles = roles;
        state.user.primaryRole = primaryRole;
        state.user.role = primaryRole; // Update legacy role field
      }
      if (accessToken) {
        state.accessToken = accessToken;
      }
    },
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isPlatformAdmin = false;
      state.activeContext = null;
      state.availableContexts = [];
    },
    clearError: (state) => {
      state.error = null;
    },
    setAvailableContexts: (state, action) => {
      state.availableContexts = action.payload;
    },
    setActiveContext: (state, action) => {
      const { activeContext, accessToken } = action.payload;
      state.activeContext = activeContext;
      if (accessToken) {
        state.accessToken = accessToken;
      }
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;

      // Detect if user is a platform admin
      const isPlatformAdmin = action.payload?.isPlatformAdmin === true ||
                              action.payload?.roles?.includes('PLATFORM_ADMIN') ||
                              action.payload?.primaryRole === 'PLATFORM_ADMIN' ||
                              action.payload?.context === 'platformAdmin';
      state.isPlatformAdmin = isPlatformAdmin;
    },
    setActiveClub: (state, action) => {
      const club = action.payload;

      // Determine the role based on user type
      let contextRole = 'clubManager'; // Default for platform admins
      let originalRole = null;

      if (state.isPlatformAdmin) {
        // Platform admin: set role as clubManager for UI purposes, preserve original
        contextRole = 'clubManager';
        originalRole = 'PLATFORM_ADMIN';
      } else if (state.user?.primaryRole) {
        // Regular user: use their actual role
        contextRole = state.user.primaryRole;
        originalRole = state.user.primaryRole;
      }

      state.activeContext = {
        type: 'club',
        clubId: club.id,
        clubName: club.name,
        role: contextRole,
        originalRole: originalRole
      };
    },
  },
});

export const {
  setCredentials,
  updateUserRole,
  setAccessToken,
  setLoading,
  setError,
  logout,
  clearError,
  setAvailableContexts,
  setActiveContext,
  setUser,
  setActiveClub,
} = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectUserRoles = (state) => state.auth.user?.roles || [];
export const selectPrimaryRole = (state) => state.auth.user?.primaryRole || state.auth.user?.role;
export const selectHasMultipleRoles = (state) => (state.auth.user?.roles?.length || 0) > 1;
export const selectAccessToken = (state) => state.auth.accessToken;
export const selectRefreshToken = (state) => state.auth.refreshToken;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectActiveContext = (state) => state.auth.activeContext;
export const selectAvailableContexts = (state) => state.auth.availableContexts;
export const selectHasMultipleContexts = (state) => (state.auth.availableContexts?.length || 0) > 1;
export const selectIsClubContext = (state) => state.auth.activeContext?.type === 'club';
export const selectActiveClubRole = (state) => state.auth.activeContext?.role;
export const selectIsPlatformAdmin = (state) => state.auth.isPlatformAdmin;
export const selectOriginalRole = (state) => state.auth.activeContext?.originalRole;

// DAW access selectors
export const selectDawAccess = (state) => state.auth.user?.featureAccess?.daw;
export const selectHasDawAccess = (state) => state.auth.user?.featureAccess?.daw?.enabled === true;
export const selectDawTier = (state) => state.auth.user?.featureAccess?.daw?.tier;
export const selectIsPlatformEngineering = (state) => {
    const tier = state.auth.user?.featureAccess?.daw?.tier;
    return tier === 'platform_engineering' || tier === 'platform_engineering_admin';
};
