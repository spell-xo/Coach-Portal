import React from 'react';
import { Box, Container, Typography, IconButton, useMediaQuery, useTheme } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { icons } from '../../../styles/icons';
import loginBg from '../../../assets/images/login-bg.webp';

/**
 * Shared layout component for consent flow pages
 * Responsive design: desktop shows footballer image on right, mobile hides it
 */
const ConsentLayout = ({ children, title, subtitle, showBackButton, onBack, academy }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: '#f5f5f7',
      }}
    >
      {/* Form Section */}
      <Box
        sx={{
          flex: isMobile ? 1 : '0 0 55%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          position: 'relative',
        }}
      >
        {/* Header with back button */}
        {showBackButton && (
          <IconButton
            onClick={onBack}
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              color: '#666',
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        )}

        {/* Content */}
        <Container
          maxWidth="sm"
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            py: 4,
            px: { xs: 2, sm: 4 },
          }}
        >
          {/* Logo and tagline */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 2,
              '& svg': {
                width: { xs: 120, md: 150 },
                height: 'auto',
                color: '#1a1a2e',
              }
            }}>
              {icons['aim-full']}
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: '#6366f1',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontSize: '0.75rem',
                fontWeight: 500,
              }}
            >
              AI-Powered Football Training
            </Typography>
            {academy && (
              <Typography
                variant="subtitle1"
                sx={{
                  mt: 1,
                  color: '#1a1a2e',
                  fontWeight: 600,
                }}
              >
                {academy.clubName}{academy.teamName ? ` - ${academy.teamName}` : ''}
              </Typography>
            )}
          </Box>

          {/* Page title */}
          {title && (
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                textAlign: 'center',
                mb: subtitle ? 1 : 3,
                color: '#1a1a2e',
              }}
            >
              {title}
            </Typography>
          )}

          {/* Subtitle */}
          {subtitle && (
            <Typography
              variant="body2"
              sx={{
                textAlign: 'center',
                mb: 3,
                color: '#666',
              }}
            >
              {subtitle}
            </Typography>
          )}

          {/* Page content */}
          {children}
        </Container>
      </Box>

      {/* Image Section - Desktop only */}
      {!isMobile && (
        <Box
          sx={{
            flex: '0 0 45%',
            position: 'relative',
            overflow: 'hidden',
            backgroundImage: `url(${loginBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center right',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Dark overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.5) 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
            }}
          >
            {/* AIM Logo in white */}
            <Box sx={{
              mb: 4,
              '& svg': {
                width: 200,
                height: 'auto',
                color: '#ffffff',
              }
            }}>
              {icons['aim-full']}
            </Box>

            {/* Feature highlights */}
            <Box sx={{ color: '#ffffff', textAlign: 'center', maxWidth: 320 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Join the Future of Football Training
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mb: 4, lineHeight: 1.6 }}>
                AI-powered analysis and personalized coaching to help young players reach their full potential
              </Typography>

              {/* Feature list */}
              <Box sx={{ textAlign: 'left' }}>
                {[
                  { icon: '📊', text: 'Real-time Performance Analytics' },
                  { icon: '🎥', text: 'AI-Powered Video Analysis' },
                  { icon: '🎯', text: 'Personalized Training Plans' },
                  { icon: '🏆', text: 'Track Progress & Achievements' },
                ].map((feature) => (
                  <Box key={feature.text} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ fontSize: '1.25rem', mr: 1.5 }}>{feature.icon}</Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {feature.text}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Footer */}
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                bottom: 24,
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              Trusted by coaches and clubs worldwide
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ConsentLayout;
