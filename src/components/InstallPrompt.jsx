import React, { useState } from 'react';
import { Box, Button, Card, CardContent, Typography, IconButton, Alert } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import GetAppIcon from '@mui/icons-material/GetApp';
import useInstallPrompt from '../hooks/useInstallPrompt';

/**
 * InstallPrompt component
 *
 * Displays PWA install prompt banner
 *
 * Features:
 * - Auto-detects if app is installable
 * - Dismissible banner
 * - Remembers dismissal (localStorage)
 * - Animated entrance
 *
 * Usage:
 * <InstallPrompt />
 */
const InstallPrompt = ({ position = 'bottom' }) => {
  const { isInstallable, promptInstall, isInstalled } = useInstallPrompt();
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('pwa-install-dismissed') === 'true';
  });

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) {
      console.log('[PWA] User accepted install');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if not installable, already installed, or dismissed
  if (!isInstallable || isInstalled || isDismissed) {
    return null;
  }

  const variants = {
    hidden: {
      y: position === 'bottom' ? 100 : -100,
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
      },
    },
    exit: {
      y: position === 'bottom' ? 100 : -100,
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <AnimatePresence>
      <Box
        component={motion.div}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={variants}
        sx={{
          position: 'fixed',
          [position]: 16,
          left: 16,
          right: 16,
          zIndex: 1400,
          maxWidth: 600,
          margin: '0 auto',
        }}
      >
        <Card
          elevation={8}
          sx={{
            backgroundColor: 'background.paper',
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ padding: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  backgroundColor: 'primary.main',
                  borderRadius: 2,
                  padding: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GetAppIcon sx={{ color: 'primary.contrastText', fontSize: 28 }} />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, marginBottom: 0.5 }}>
                  Install AIM Coach Portal
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Install our app for quick access, offline support, and a better experience.
                </Typography>

                <Box sx={{ marginTop: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={handleInstall}
                    startIcon={<GetAppIcon />}
                    sx={{ minHeight: 44 }}
                  >
                    Install
                  </Button>
                  <Button
                    variant="text"
                    onClick={handleDismiss}
                    sx={{ minHeight: 44 }}
                  >
                    Not now
                  </Button>
                </Box>
              </Box>

              <IconButton
                onClick={handleDismiss}
                aria-label="Close"
                sx={{ marginTop: -1, marginRight: -1 }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </AnimatePresence>
  );
};

/**
 * OfflineBanner component
 *
 * Shows when user goes offline
 */
export const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <Box
          component={motion.div}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1500,
          }}
        >
          <Alert
            severity="warning"
            sx={{
              borderRadius: 0,
              '& .MuiAlert-message': {
                width: '100%',
                textAlign: 'center',
              },
            }}
          >
            You are currently offline. Some features may be unavailable.
          </Alert>
        </Box>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
