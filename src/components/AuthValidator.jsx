import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { PURGE } from 'redux-persist';
import { selectAccessToken, selectIsAuthenticated, logout } from '../store/authSlice';

// Routes that should skip auth validation (public routes)
const PUBLIC_ROUTES = ['/login', '/signup', '/register', '/invite', '/onboarding', '/admin-launch'];

/**
 * AuthValidator Component
 * Validates JWT token on mount and redirects to login if invalid/expired
 * Skips validation for public routes
 */
const AuthValidator = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const accessToken = useSelector(selectAccessToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const clearedForRoute = useRef(null);

  // Log on EVERY render to confirm component is mounting - using warn to make it more visible
  console.warn('[AuthValidator] Component render - pathname:', location.pathname, 'token:', !!accessToken, 'auth:', isAuthenticated);

  useEffect(() => {
    console.warn('[AuthValidator] useEffect Running - pathname:', location.pathname, 'hasToken:', !!accessToken, 'isAuth:', isAuthenticated);

    // Check if this is a public route
    const isPublicRoute = PUBLIC_ROUTES.some(route => location.pathname.startsWith(route));

    if (isPublicRoute) {
      console.warn('[AuthValidator] Public route detected, skipping all validation and redirects');
      // DO NOT clear auth state - just skip validation entirely
      return;
    }

    console.log('[AuthValidator] Private route - validating token');

    // Reset the cleared flag when leaving public routes
    clearedForRoute.current = null;

    const validateToken = () => {
      // If user is marked as authenticated but has no token, logout
      if (isAuthenticated && !accessToken) {
        console.warn('Auth state inconsistent: authenticated but no token. Logging out.');
        dispatch(logout());
        navigate('/login', { replace: true });
        return;
      }

      // If there's a token, validate it's not expired
      if (accessToken) {
        try {
          // Decode JWT to check expiration
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          const expirationTime = payload.exp * 1000; // Convert to milliseconds
          const currentTime = Date.now();

          if (currentTime >= expirationTime) {
            console.warn('Token expired. Logging out.');
            dispatch(logout());
            navigate('/login', { replace: true });
          }
        } catch (error) {
          console.error('Failed to validate token:', error);
          // If token is malformed, logout
          dispatch(logout());
          navigate('/login', { replace: true });
        }
      }
    };

    validateToken();
  }, [accessToken, isAuthenticated, dispatch, navigate, location.pathname]);

  return children;
};

export default AuthValidator;
