import React from 'react';
import { Box } from '@mui/material';

/**
 * SkipNavigation component
 *
 * Provides skip links for keyboard users to bypass repetitive content
 *
 * Features:
 * - Visible only on keyboard focus
 * - Allows quick navigation to main content
 * - WCAG 2.1 AA compliant
 * - Customizable target sections
 *
 * Usage:
 * <SkipNavigation
 *   links={[
 *     { href: '#main', label: 'Skip to main content' },
 *     { href: '#nav', label: 'Skip to navigation' },
 *   ]}
 * />
 */
const SkipNavigation = ({
  links = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#primary-navigation', label: 'Skip to navigation' },
  ],
}) => {
  return (
    <Box
      component="nav"
      aria-label="Skip links"
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 9999,
      }}
    >
      {links.map((link, index) => (
        <Box
          key={index}
          component="a"
          href={link.href}
          sx={{
            position: 'absolute',
            left: '-9999px',
            top: '0',
            zIndex: 9999,
            padding: '1rem 1.5rem',
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            textDecoration: 'none',
            fontWeight: 600,
            borderRadius: '0 0 8px 0',
            boxShadow: 3,
            '&:focus': {
              left: 0,
              outline: '3px solid',
              outlineColor: 'secondary.main',
              outlineOffset: '2px',
            },
          }}
        >
          {link.label}
        </Box>
      ))}
    </Box>
  );
};

export default SkipNavigation;
