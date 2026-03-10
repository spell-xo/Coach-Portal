import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';
import { setCredentials, setAvailableContexts, selectAccessToken } from '../store/authSlice';
import authService from '../api/authService';
import contextService from '../api/contextService';

const DEMO_EMAIL = 'headcoach@sk.com';
const DEMO_PASSWORD = 'Aim@2025';

const DEFAULT_CLUB_ID = process.env.REACT_APP_DEFAULT_CLUB_ID;

/**
 * When login fails, show Club Dashboard UI with mock context (no API data).
 * Set REACT_APP_DEFAULT_CLUB_ID in Vercel to your club ID for data to load.
 */
const applyFallbackClubContext = (dispatch, navigate) => {
  if (!DEFAULT_CLUB_ID) return false;
  const mockContext = {
    type: 'club',
    clubId: DEFAULT_CLUB_ID,
    clubName: 'SK Academy',
    role: 'clubManager',
    originalRole: 'clubManager',
  };
  dispatch(setCredentials({
    user: {
      activeContext: mockContext,
      primaryRole: 'clubManager',
      role: 'clubManager',
      roles: [{ role: 'clubManager' }],
    },
    accessToken: null,
    refreshToken: null,
    activeContext: mockContext,
    availableContexts: [{ type: 'club', clubId: DEFAULT_CLUB_ID, clubName: 'SK Academy', role: 'clubManager' }],
  }));
  navigate(`/clubs/${DEFAULT_CLUB_ID}/dashboard`, { replace: true });
  return true;
};

/**
 * Auto-login with demo credentials on first load so Vercel/deployed app
 * shows Club Dashboard (same as localhost when logged in).
 */
const AutoLoginBootstrap = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const accessToken = useSelector(selectAccessToken);
  const [bootstrapped, setBootstrapped] = useState(!!accessToken);

  useEffect(() => {
    if (accessToken || bootstrapped) {
      setBootstrapped(true);
      return;
    }

    let cancelled = false;
    const runAutoLogin = async () => {
      try {
        const response = await authService.login({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
        });

        const ok = response?.success === true || response?.data?.success === true;
        if (cancelled || !ok) {
          if (DEFAULT_CLUB_ID && applyFallbackClubContext(dispatch, navigate)) {
            setBootstrapped(true);
          }
          return;
        }

        const data = response.data || response;
        dispatch(setCredentials({
          ...data,
          activeContext: data?.user?.activeContext,
        }));

        try {
          const ctxRes = await contextService.listContexts();
          if (ctxRes?.success && ctxRes.data?.contexts?.length) {
            dispatch(setAvailableContexts(ctxRes.data.contexts));
          }
        } catch (e) {
          console.warn('[AutoLogin] Could not fetch contexts:', e?.message);
        }

        const activeContext = data?.user?.activeContext;
        const redirectParam = new URLSearchParams(location.search).get('redirect');

        let redirectTo;
        if (redirectParam) {
          redirectTo = redirectParam;
        } else if (activeContext?.type === 'club' && activeContext?.clubId) {
          redirectTo = `/clubs/${activeContext.clubId}/dashboard`;
        } else {
          redirectTo = '/dashboard';
        }

        if (redirectTo && redirectTo !== location.pathname) {
          navigate(redirectTo, { replace: true });
        }
      } catch (err) {
        console.warn('[AutoLogin] Login failed:', err?.message);
        if (applyFallbackClubContext(dispatch, navigate)) {
          // Fallback applied
        } else {
          navigate('/dashboard', { replace: true });
        }
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    };

    runAutoLogin();
    return () => { cancelled = true; };
  }, [accessToken, bootstrapped, dispatch, navigate, location.pathname, location.search]);

  if (!bootstrapped && !accessToken) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          bgcolor: '#0a0a0a',
        }}
      >
        <CircularProgress sx={{ color: '#24ff00' }} size={48} />
      </Box>
    );
  }

  return children;
};

export default AutoLoginBootstrap;
