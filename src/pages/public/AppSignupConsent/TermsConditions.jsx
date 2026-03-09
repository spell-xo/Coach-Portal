import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import ConsentLayout from './ConsentLayout';
import appSignupConsentService from '../../../api/appSignupConsentService';

// Privacy Policy content
const PRIVACY_POLICY = `AIM.io Privacy Policy

Issued by: AIMREL TECHNOLOGY L.L.C S.O.C, a limited liability company with trade licence number 1575457, and registered office at Mashreq-101, Al Suq Al Kabeer, Dubai, United Arab Emirates and AIMREL Technology Limited, a limited liability company with registration number HE 471163, and registered office at Agiou Alexiou 1, 1st Floor, Strovolos, 2054, Nicosia, Cyprus (together "AIM.io", "we", "us", "our"), a sports training technology group who provides the AI-powered platform that analyses training videos, generates performance metrics and provides AI-powered personalised coaching feedback. For purposes of UAE law, AIM.io act as "Data Controllers" of your personal data, meaning they determine how and why the data is processed.

By using our App or Site, you agree to the collection and use of information in accordance with this Privacy Policy and our Terms and Conditions.

Introduction and Purpose

This Privacy Policy describes how we collect, use, share, and safeguard personal information when you use our football-focused AI training application ("App") and related services. We are committed to protecting your privacy and ensuring transparency in how we handle your data.

Information We Collect

Personal Information:
- Name, email address, and contact details
- Date of birth and age verification data
- Profile photos and videos you upload
- Performance metrics and training data
- Device information and usage statistics

How We Use Your Information

We use your information to:
- Provide and improve our AI-powered training services
- Analyze your performance and generate personalized feedback
- Communicate with you about your account and services
- Ensure compliance with age restrictions and parental consent requirements
- Protect the security and integrity of our platform

Data Sharing

We may share your information with:
- Coaches and team administrators (with your consent)
- Service providers who assist in operating our platform
- Legal authorities when required by law

Your Rights

You have the right to:
- Access your personal data
- Request correction of inaccurate data
- Request deletion of your data
- Object to certain processing activities
- Data portability

Children's Privacy

We take children's privacy seriously. For users under 18, we require parental consent and implement additional safeguards to protect their information.

Contact Us

For privacy-related inquiries, contact us at privacy@aim.io`;

// Terms of Service content
const TERMS_OF_SERVICE = `AIM.io Terms of Service

Issued by: AIMREL TECHNOLOGY L.L.C S.O.C, a limited liability company with trade licence number 1575457, and registered office at Mashreq-101, Al Suq Al Kabeer, Dubai, United Arab Emirates and AIMREL Technology Limited, a limited liability company with registration number HE 471163, and registered office at Agiou Alexiou 1, 1st Floor, Strovolos, 2054, Nicosia, Cyprus (together "AIM.io", "we", "us", "our"), a sports training technology group who provides the AI-powered platform that analyses training videos, generates performance metrics and provides AI-powered personalised coaching feedback.

By using our App or Site, you agree to be bound by these Terms and Conditions and our Privacy Policy.

1. Acceptance of Terms

By accessing or using the AIM.io application and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.

2. Service Description

AIM.io provides an AI-powered football training platform that:
- Analyzes training videos
- Generates performance metrics
- Provides personalized coaching feedback
- Connects players with coaches and teams

3. User Accounts

- You must provide accurate information when creating an account
- You are responsible for maintaining the security of your account
- You must be at least 18 years old, or have parental consent if under 18

4. Parental Consent for Minors

Users under 18 require parental or guardian consent to use our services. Parents/guardians are responsible for:
- Providing valid consent
- Monitoring their child's use of the platform
- Ensuring compliance with these terms

5. Content and Conduct

You agree not to:
- Upload inappropriate or offensive content
- Violate any applicable laws or regulations
- Interfere with the operation of our services
- Attempt to access other users' accounts

6. Intellectual Property

All content, features, and functionality of AIM.io are owned by us and protected by intellectual property laws.

7. Limitation of Liability

AIM.io is provided "as is" without warranties. We are not liable for any indirect, incidental, or consequential damages.

8. Changes to Terms

We may update these terms from time to time. Continued use of our services constitutes acceptance of updated terms.

9. Contact

For questions about these terms, contact us at legal@aim.io`;

/**
 * Step 2: Terms & Conditions
 * - Shows privacy policy and terms side by side (desktop) or stacked (mobile)
 * - User must scroll to bottom before checkbox is enabled
 * - Checkbox must be checked before continue button is enabled
 */
const TermsConditions = ({ consent, token, onNext, onBack, onError }) => {
  const isDemoMode = token === 'demo' || token === 'test' || token === '1';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasScrolledPrivacy, setHasScrolledPrivacy] = useState(false);
  const [hasScrolledTerms, setHasScrolledTerms] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const privacyRef = useRef(null);
  const termsRef = useRef(null);

  // Check scroll position for both documents
  const handleScroll = (ref, setScrolled) => {
    if (ref.current) {
      const { scrollTop, scrollHeight, clientHeight } = ref.current;
      // Consider scrolled if within 50px of bottom
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        setScrolled(true);
      }
    }
  };

  useEffect(() => {
    const privacyEl = privacyRef.current;
    const termsEl = termsRef.current;

    const handlePrivacyScroll = () => handleScroll(privacyRef, setHasScrolledPrivacy);
    const handleTermsScroll = () => handleScroll(termsRef, setHasScrolledTerms);

    if (privacyEl) {
      privacyEl.addEventListener('scroll', handlePrivacyScroll);
      // Check initial state (in case content fits without scrolling)
      if (privacyEl.scrollHeight <= privacyEl.clientHeight) {
        setHasScrolledPrivacy(true);
      }
    }

    if (termsEl) {
      termsEl.addEventListener('scroll', handleTermsScroll);
      if (termsEl.scrollHeight <= termsEl.clientHeight) {
        setHasScrolledTerms(true);
      }
    }

    return () => {
      if (privacyEl) privacyEl.removeEventListener('scroll', handlePrivacyScroll);
      if (termsEl) termsEl.removeEventListener('scroll', handleTermsScroll);
    };
  }, []);

  const canAgree = hasScrolledPrivacy && hasScrolledTerms;
  const canContinue = agreed;

  const handleSubmit = async () => {
    if (!canContinue) return;

    try {
      setLoading(true);
      setError(null);

      // In demo mode, skip API calls
      if (isDemoMode) {
        onNext();
        return;
      }

      const result = await appSignupConsentService.acceptTerms(token, {
        termsAccepted: true,
        privacyAccepted: true,
      });

      // For 13-17 flow, grant consent directly (no child account creation needed)
      // The teen has already signed up via mobile app, we just need to update their consent status
      if (result.data?.isTeenFlow) {
        try {
          await appSignupConsentService.grantTeenConsent(token);
          // Complete the flow
          await appSignupConsentService.completeConsent(token);
        } catch (teenErr) {
          // If teen consent fails, show a specific error message
          const errorMsg = teenErr.response?.data?.error || teenErr.message;
          setError(errorMsg);
          setLoading(false);
          return;
        }
      }

      onNext();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConsentLayout
      title="Accept Terms & Conditions"
      showBackButton
      onBack={onBack}
      academy={consent?.academy}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          mb: 3,
        }}
      >
        {/* Privacy Policy */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            AIM.io Privacy Policy
          </Typography>
          <Paper
            ref={privacyRef}
            elevation={0}
            sx={{
              height: 300,
              overflow: 'auto',
              p: 2,
              backgroundColor: '#f9f9f9',
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              fontSize: '0.875rem',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}
          >
            {PRIVACY_POLICY}
          </Paper>
        </Box>

        {/* Terms of Service */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            AIM.io Terms of Service
          </Typography>
          <Paper
            ref={termsRef}
            elevation={0}
            sx={{
              height: 300,
              overflow: 'auto',
              p: 2,
              backgroundColor: '#f9f9f9',
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              fontSize: '0.875rem',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}
          >
            {TERMS_OF_SERVICE}
          </Paper>
        </Box>
      </Box>

      {!canAgree && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
          Please scroll to the bottom of both documents to continue
        </Typography>
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <FormControlLabel
          control={
            <Checkbox
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={!canAgree}
            />
          }
          label="I have read and agree with privacy policy"
          sx={{ color: canAgree ? 'text.primary' : 'text.disabled' }}
        />

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canContinue || loading}
          sx={{
            py: 1.5,
            px: 4,
            backgroundColor: canContinue ? '#1a1a2e' : '#9e9e9e',
            '&:hover': {
              backgroundColor: canContinue ? '#16213e' : '#9e9e9e',
            },
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Accept & Continue'}
        </Button>
      </Box>
    </ConsentLayout>
  );
};

export default TermsConditions;
