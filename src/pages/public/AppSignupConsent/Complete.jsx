import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import appSignupConsentService from '../../../api/appSignupConsentService';

/**
 * Step 4: Complete
 * - Shows success message
 * - Completes the consent flow
 * - Shows child name and handle
 */
const Complete = ({ consent, token }) => {
  const [loading, setLoading] = useState(true);
  const [completionData, setCompletionData] = useState(null);

  useEffect(() => {
    const completeFlow = async () => {
      try {
        // If consent is already completed (e.g., from teen flow), skip the API call
        if (consent?.status === 'completed') {
          setCompletionData({
            childName: consent.child?.name,
            childHandle: consent.child?.handle || consent.child?.email?.split('@')[0]
          });
          setLoading(false);
          return;
        }

        const result = await appSignupConsentService.completeConsent(token);
        setCompletionData(result.data);
      } catch (err) {
        console.error('Error completing consent:', err);
        // Still show success since accounts are created
        // Set completion data from consent object as fallback
        setCompletionData({
          childName: consent?.child?.name,
          childHandle: consent?.child?.handle || consent?.child?.email?.split('@')[0]
        });
      } finally {
        setLoading(false);
      }
    };

    completeFlow();
  }, [token, consent]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f7',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f7',
        p: 3,
      }}
    >
      <Box
        sx={{
          maxWidth: 500,
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: 3,
          p: { xs: 4, md: 6 },
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Footballer illustration */}
        <Box
          component="img"
          src="/images/footballer-celebration.png"
          alt="Success"
          sx={{
            width: 200,
            height: 'auto',
            mb: 3,
            opacity: 0.9,
            filter: 'grayscale(100%)',
          }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />

        {/* Success icon */}
        <CheckCircleIcon
          sx={{
            fontSize: 64,
            color: '#4caf50',
            mb: 2,
          }}
        />

        {/* Success message */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: '#1a1a2e',
            mb: 2,
            textDecoration: 'underline',
            textDecorationColor: '#6366f1',
            textUnderlineOffset: 8,
          }}
        >
          Account Approved
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: '#666',
            mb: 4,
          }}
        >
          Thank you! You can now use AIM and finish
          <br />
          your child's account set up
        </Typography>

        {/* Child info */}
        {completionData && (
          <Box
            sx={{
              backgroundColor: '#f5f5f7',
              borderRadius: 2,
              p: 2,
              mb: 3,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Child's Account
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              {completionData.childName || consent.child.name}
            </Typography>
            {completionData.childHandle && (
              <Typography variant="body2" color="text.secondary">
                @{completionData.childHandle}
              </Typography>
            )}
          </Box>
        )}

        {/* Instructions */}
        <Typography variant="body2" color="text.secondary">
          Your child can now log in to the AIM app using their handle and password.
          You can manage their account from your parent dashboard.
        </Typography>
      </Box>
    </Box>
  );
};

export default Complete;
