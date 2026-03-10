import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';
import { setCredentials, setAvailableContexts, selectAccessToken } from '../store/authSlice';
import authService from '../api/authService';
import contextService from '../api/contextService';

const DEMO_EMAIL = 'headcoach@sk.com';
const DEMO_PASSWORD = 'Aim@2025';

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

        if (cancelled || !response?.success) return;

        dispatch(setCredentials({
          ...response.data,
          activeContext: response.data?.user?.activeContext,
        }));

        try {
          const ctxRes = await contextService.listContexts();
          if (ctxRes?.success && ctxRes.data?.contexts?.length) {
            dispatch(setAvailableContexts(ctxRes.data.contexts));
          }
        } catch (e) {
          console.warn('[AutoLogin] Could not fetch contexts:', e?.message);
        }

        const activeContext = response.data?.user?.activeContext;
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
        console.warn('[AutoLogin] Login failed, showing dashboard without auth:', err?.message);
        navigate('/dashboard', { replace: true });
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
