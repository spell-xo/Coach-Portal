import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  MenuItem,
} from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import AppLayout from '../../components/AppLayout';
import RequireRole from '../../components/RequireRole';
import ImageUploadField from '../../components/ImageUploadField';
import clubService from '../../api/clubService';
import { setActiveContext, selectActiveContext, setAvailableContexts, selectAvailableContexts } from '../../store/authSlice';

const validationSchema = Yup.object({
  name: Yup.string().required('Club name is required'),
  type: Yup.string().required('Club type is required'),
  contactEmail: Yup.string().email('Invalid email').required('Contact email is required'),
  contactPhone: Yup.string(),
  website: Yup.string().url('Invalid URL'),
  description: Yup.string(),
  foundedDate: Yup.date().nullable(),
});

const ClubProfile = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const activeContext = useSelector(selectActiveContext);
  const availableContexts = useSelector(selectAvailableContexts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [club, setClub] = useState(null);

  useEffect(() => {
    loadClubData();
  }, [clubId]);

  const loadClubData = async () => {
    try {
      setLoading(true);
      const response = await clubService.getClubById(clubId);
      setClub(response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading club:', err);
      setError(err.response?.data?.message || 'Failed to load club data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setSuccess(null);
      setError(null);

      const profileData = {
        name: values.name,
        type: values.type,
        description: values.description,
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone,
        website: values.website,
        foundedDate: values.foundedDate || null,
        address: {
          street: values.street,
          city: values.city,
          state: values.state,
          country: values.country,
          postalCode: values.postalCode,
        },
        branding: {
          primaryColor: values.primaryColor,
          secondaryColor: values.secondaryColor,
          badgeUrl: values.badgeUrl,
        },
        kits: {
          homeKitUrl: values.homeKitUrl,
          awayKitUrl: values.awayKitUrl,
          thirdKitUrl: values.thirdKitUrl,
        },
        socialMedia: {
          instagram: values.instagram,
          twitter: values.twitter,
          facebook: values.facebook,
          youtube: values.youtube,
        },
      };

      await clubService.updateClubProfile(clubId, profileData);
      setSuccess('Club profile updated successfully!');

      // Update Redux store with new club name if it changed
      if (activeContext && values.name !== activeContext.clubName) {
        // Update active context
        dispatch(setActiveContext({
          activeContext: {
            ...activeContext,
            clubName: values.name
          }
        }));

        // Update available contexts array
        const updatedContexts = availableContexts.map(context => {
          if (context.type === 'club' && context.clubId === clubId) {
            return {
              ...context,
              clubName: values.name
            };
          }
          return context;
        });
        dispatch(setAvailableContexts(updatedContexts));
      }

      // Reload club data to show updated values
      await loadClubData();
    } catch (err) {
      console.error('Error updating club profile:', err);
      setError(err.response?.data?.message || 'Failed to update club profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <Container maxWidth={false} sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      </AppLayout>
    );
  }

  if (!club) {
    return (
      <AppLayout>
        <Container maxWidth={false} sx={{ mt: 4, px: { xs: 2, sm: 3, md: 4 } }}>
          <Alert severity="error">Club not found</Alert>
        </Container>
      </AppLayout>
    );
  }

  const initialValues = {
    name: club.name || '',
    type: club.type || 'club',
    description: club.description || '',
    contactEmail: club.contactEmail || '',
    contactPhone: club.contactPhone || '',
    website: club.website || '',
    foundedDate: club.foundedDate ? new Date(club.foundedDate).toISOString().split('T')[0] : '',
    street: club.address?.street || '',
    city: club.address?.city || '',
    state: club.address?.state || '',
    country: club.address?.country || '',
    postalCode: club.address?.postalCode || '',
    primaryColor: club.settings?.branding?.primaryColor || '',
    secondaryColor: club.settings?.branding?.secondaryColor || '',
    badgeUrl: club.settings?.branding?.badgeUrl || '',
    homeKitUrl: club.kits?.homeKitUrl || '',
    awayKitUrl: club.kits?.awayKitUrl || '',
    thirdKitUrl: club.kits?.thirdKitUrl || '',
    instagram: club.socialMedia?.instagram || '',
    twitter: club.socialMedia?.twitter || '',
    facebook: club.socialMedia?.facebook || '',
    youtube: club.socialMedia?.youtube || '',
  };

  return (
    <AppLayout>
      <RequireRole roles={['club_manager']}>
        <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              Club Profile
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage your club's information, branding, and contact details
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          <Paper sx={{ p: 4 }}>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ errors, touched, isSubmitting, values }) => (
                <Form>
                  {/* Basic Information */}
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Basic Information
                  </Typography>
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={6}>
                      <Field
                        as={TextField}
                        fullWidth
                        label="Club Name"
                        name="name"
                        required
                        error={touched.name && Boolean(errors.name)}
                        helperText={touched.name && errors.name}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Field
                        as={TextField}
                        fullWidth
                        select
                        label="Type"
                        name="type"
                        required
                        error={touched.type && Boolean(errors.type)}
                        helperText={touched.type && errors.type}
                      >
                        <MenuItem value="club">Club</MenuItem>
                        <MenuItem value="academy">Academy</MenuItem>
                      </Field>
                    </Grid>
                    <Grid item xs={12}>
                      <Field
                        as={TextField}
                        fullWidth
                        multiline
                        rows={3}
                        label="Description"
                        name="description"
                        placeholder="Brief description of your club..."
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Field
                        as={TextField}
                        fullWidth
                        type="date"
                        label="Founded Date"
                        name="foundedDate"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 4 }} />

                  {/* Contact Details */}
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Contact Details
                  </Typography>
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={6}>
                      <Field
                        as={TextField}
                        fullWidth
                        label="Contact Email"
                        name="contactEmail"
                        type="email"
                        required
                        error={touched.contactEmail && Boolean(errors.contactEmail)}
                        helperText={touched.contactEmail && errors.contactEmail}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Field
                        as={TextField}
                        fullWidth
                        label="Contact Phone"
                        name="contactPhone"
                        placeholder="+1 234 567 8900"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Field
                        as={TextField}
                        fullWidth
                        label="Website"
                        name="website"
                        placeholder="https://yourclub.com"
                        error={touched.website && Boolean(errors.website)}
                        helperText={touched.website && errors.website}
                      />
                    </Grid>
                  </Grid>

                  {/* Address */}
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Address
                  </Typography>
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12}>
                      <Field
                        as={TextField}
                        fullWidth
                        label="Street Address"
                        name="street"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Field
                        as={TextField}
                        fullWidth
                        label="City"
                        name="city"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Field
                        as={TextField}
                        fullWidth
                        label="State/Province"
                        name="state"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Field
                        as={TextField}
                        fullWidth
                        label="Country"
                        name="country"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Field
                        as={TextField}
                        fullWidth
                        label="Postal Code"
                        name="postalCode"
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 4 }} />

                  {/* Branding */}
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Branding
                  </Typography>
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12}>
                      <ImageUploadField
                        label="Club Badge"
                        currentImage={club.settings?.branding?.badgeUrl}
                        onUpload={async (file) => {
                          try {
                            const result = await clubService.uploadClubImage(clubId, file, 'badge');
                            // Update local state
                            setClub(prev => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                branding: {
                                  ...prev.settings?.branding,
                                  badgeUrl: result.data?.preview?.large || result.data?.variants?.large
                                }
                              }
                            }));
                            setSuccess('Badge uploaded successfully!');
                          } catch (err) {
                            throw new Error(err.response?.data?.message || 'Failed to upload badge');
                          }
                        }}
                        onDelete={async () => {
                          try {
                            await clubService.deleteClubBadge(clubId);
                            setClub(prev => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                branding: {
                                  ...prev.settings?.branding,
                                  badgeUrl: null
                                }
                              }
                            }));
                            setSuccess('Badge deleted successfully!');
                          } catch (err) {
                            throw new Error(err.response?.data?.message || 'Failed to delete badge');
                          }
                        }}
                        helpText="Recommended: 512x512px square image, PNG or JPG, max 5MB"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Field
                        as={TextField}
                        fullWidth
                        label="Primary Color"
                        name="primaryColor"
                        type="color"
                        InputLabelProps={{ shrink: true }}
                        helperText="Main club color"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Field
                        as={TextField}
                        fullWidth
                        label="Secondary Color"
                        name="secondaryColor"
                        type="color"
                        InputLabelProps={{ shrink: true }}
                        helperText="Secondary club color"
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 4 }} />

                  {/* Playing Kits */}
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Playing Kits
                  </Typography>
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                      <ImageUploadField
                        label="Home Kit"
                        currentImage={club.kits?.homeKitUrl}
                        onUpload={async (file) => {
                          try {
                            const result = await clubService.uploadClubImage(clubId, file, 'home');
                            setClub(prev => ({
                              ...prev,
                              kits: {
                                ...prev.kits,
                                homeKitUrl: result.data?.preview?.large || result.data?.variants?.large
                              }
                            }));
                            setSuccess('Home kit uploaded successfully!');
                          } catch (err) {
                            throw new Error(err.response?.data?.message || 'Failed to upload home kit');
                          }
                        }}
                        onDelete={async () => {
                          try {
                            await clubService.deleteClubKit(clubId, 'home');
                            setClub(prev => ({
                              ...prev,
                              kits: {
                                ...prev.kits,
                                homeKitUrl: null
                              }
                            }));
                            setSuccess('Home kit deleted successfully!');
                          } catch (err) {
                            throw new Error(err.response?.data?.message || 'Failed to delete home kit');
                          }
                        }}
                        helpText="Recommended: 800x800px, PNG or JPG"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <ImageUploadField
                        label="Away Kit"
                        currentImage={club.kits?.awayKitUrl}
                        onUpload={async (file) => {
                          try {
                            const result = await clubService.uploadClubImage(clubId, file, 'away');
                            setClub(prev => ({
                              ...prev,
                              kits: {
                                ...prev.kits,
                                awayKitUrl: result.data?.preview?.large || result.data?.variants?.large
                              }
                            }));
                            setSuccess('Away kit uploaded successfully!');
                          } catch (err) {
                            throw new Error(err.response?.data?.message || 'Failed to upload away kit');
                          }
                        }}
                        onDelete={async () => {
                          try {
                            await clubService.deleteClubKit(clubId, 'away');
                            setClub(prev => ({
                              ...prev,
                              kits: {
                                ...prev.kits,
                                awayKitUrl: null
                              }
                            }));
                            setSuccess('Away kit deleted successfully!');
                          } catch (err) {
                            throw new Error(err.response?.data?.message || 'Failed to delete away kit');
                          }
                        }}
                        helpText="Recommended: 800x800px, PNG or JPG"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <ImageUploadField
                        label="Third Kit (Optional)"
                        currentImage={club.kits?.thirdKitUrl}
                        onUpload={async (file) => {
                          try {
                            const result = await clubService.uploadClubImage(clubId, file, 'third');
                            setClub(prev => ({
                              ...prev,
                              kits: {
                                ...prev.kits,
                                thirdKitUrl: result.data?.preview?.large || result.data?.variants?.large
                              }
                            }));
                            setSuccess('Third kit uploaded successfully!');
                          } catch (err) {
                            throw new Error(err.response?.data?.message || 'Failed to upload third kit');
                          }
                        }}
                        onDelete={async () => {
                          try {
                            await clubService.deleteClubKit(clubId, 'third');
                            setClub(prev => ({
                              ...prev,
                              kits: {
                                ...prev.kits,
                                thirdKitUrl: null
                              }
                            }));
                            setSuccess('Third kit deleted successfully!');
                          } catch (err) {
                            throw new Error(err.response?.data?.message || 'Failed to delete third kit');
                          }
                        }}
                        helpText="Recommended: 800x800px, PNG or JPG"
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 4 }} />

                  {/* Social Media */}
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Social Media
                  </Typography>
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={6}>
                      <Field
                        as={TextField}
                        fullWidth
                        label="Instagram"
                        name="instagram"
                        placeholder="@yourclub or full URL"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Field
                        as={TextField}
                        fullWidth
                        label="Twitter/X"
                        name="twitter"
                        placeholder="@yourclub or full URL"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Field
                        as={TextField}
                        fullWidth
                        label="Facebook"
                        name="facebook"
                        placeholder="Page URL"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Field
                        as={TextField}
                        fullWidth
                        label="YouTube"
                        name="youtube"
                        placeholder="Channel URL"
                      />
                    </Grid>
                  </Grid>

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/clubs/${clubId}/dashboard`)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <CircularProgress size={24} /> : 'Save Changes'}
                    </Button>
                  </Box>
                </Form>
              )}
            </Formik>
          </Paper>
        </Container>
      </RequireRole>
    </AppLayout>
  );
};

export default ClubProfile;
