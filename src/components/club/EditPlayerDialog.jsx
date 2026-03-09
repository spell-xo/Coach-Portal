import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Avatar,
  IconButton,
  Typography,
  MenuItem,
  CircularProgress,
  LinearProgress,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { useParams } from 'react-router-dom';
import clubService from '../../api/clubService';
import axios from 'axios';
import heic2any from 'heic2any';

const EditPlayerDialog = ({ open, onClose, player, onSave, loading = false }) => {
  const { clubId } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    profilePicture: '',
    gender: '',
    birthday: '',
    age: '',
    country: '',
    state: '',
    address: '',
    phoneNumber: { countryCode: '', number: '' },
    position: '',
    height: '',
    strongFoot: '',
    password: '',
  });

  const [profilePicturePreview, setProfilePicturePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    if (player) {
      setFormData({
        name: player.name || '',
        profilePicture: player.profilePicture || '',
        gender: player.gender || '',
        birthday: player.birthday ? new Date(player.birthday).toISOString().split('T')[0] : '',
        age: player.age || '',
        country: player.country || '',
        state: player.state || '',
        address: player.address || '',
        phoneNumber: player.phoneNumber || { countryCode: '', number: '' },
        position: player.position || '',
        height: player.height || '',
        strongFoot: player.strongFoot || '',
        password: '', // Always start with empty password
      });
      setProfilePicturePreview(player.profilePicture || '');
    }
  }, [player]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePhoneNumberChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      phoneNumber: {
        ...prev.phoneNumber,
        [field]: value,
      },
    }));
  };

  const handleProfilePictureUrlChange = (url) => {
    setFormData((prev) => ({
      ...prev,
      profilePicture: url,
    }));
    setProfilePicturePreview(url);
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!player || !player.id) {
      setUploadError('Player information is not available');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setUploadProgress(0);

      // Convert HEIC/HEIF to JPEG before uploading for browser compatibility
      const fileName = file.name.toLowerCase();
      const isHeicFile = file.type === 'image/heic' || file.type === 'image/heif' ||
                        fileName.endsWith('.heic') || fileName.endsWith('.heif');

      let fileToUpload = file;
      let contentType = file.type;

      if (isHeicFile) {
        try {
          console.log(`Converting HEIC file ${file.name} to JPEG...`);
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9 // High quality for profile pictures
          });
          fileToUpload = convertedBlob;
          contentType = 'image/jpeg';
          console.log(`Successfully converted ${file.name} to JPEG`);
        } catch (conversionError) {
          console.error(`Failed to convert HEIC file ${file.name}:`, conversionError);
          setUploadError(`Failed to convert ${file.name}. Please try a different format.`);
          setUploading(false);
          return;
        }
      }

      // 1. Get pre-signed URL from backend
      const uploadData = await clubService.getPlayerProfilePictureUploadUrl(
        clubId,
        player.id,
        file.name,
        contentType // Use the actual content type (JPEG if converted from HEIC)
      );

      // 2. Upload file directly to GCS
      await axios.put(uploadData.data.uploadUrl, fileToUpload, {
        headers: { 'Content-Type': contentType },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      // 3. Update form with public URL
      setFormData((prev) => ({
        ...prev,
        profilePicture: uploadData.data.publicUrl,
      }));
      setProfilePicturePreview(uploadData.data.publicUrl);

      setUploadProgress(100);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    // Clean up data - remove empty fields
    const updates = {};
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== '' && formData[key] !== null) {
        // Handle phoneNumber object
        if (key === 'phoneNumber') {
          if (formData.phoneNumber.countryCode && formData.phoneNumber.number) {
            updates.phoneNumber = formData.phoneNumber;
          }
        } else {
          updates[key] = formData[key];
        }
      }
    });

    // Convert birthday to Date if provided
    if (updates.birthday) {
      updates.birthday = new Date(updates.birthday);
    }

    // Convert age to number if provided
    if (updates.age) {
      updates.age = parseInt(updates.age, 10);
    }

    onSave(updates);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Edit Player Profile</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Profile Picture Section */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={profilePicturePreview}
                alt={formData.name}
                sx={{ width: 80, height: 80 }}
              >
                {formData.name?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <input
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif,.heic,.heif"
                  type="file"
                  hidden
                  id="profile-picture-upload"
                  onChange={handleFileSelect}
                  disabled={uploading || !player?.id}
                />
                <label htmlFor="profile-picture-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    disabled={uploading || !player?.id}
                    startIcon={<PhotoCamera />}
                  >
                    {uploading ? `Uploading ${uploadProgress}%` : 'Upload Photo'}
                  </Button>
                </label>
                {uploading && (
                  <Box sx={{ mt: 1 }}>
                    <LinearProgress variant="determinate" value={uploadProgress} />
                  </Box>
                )}
                {uploadError && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {uploadError}
                  </Alert>
                )}
                {formData.profilePicture && !uploading && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Profile picture uploaded successfully
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>

          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mt: 1 }}>
              Basic Information
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Full Name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Gender"
              value={formData.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
              <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              type="password"
              label="New Password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Leave blank to keep existing password"
              helperText="Leave blank to keep the existing password"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Date of Birth"
              value={formData.birthday}
              onChange={(e) => handleChange('birthday', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Age"
              value={formData.age}
              onChange={(e) => handleChange('age', e.target.value)}
            />
          </Grid>

          {/* Football Details */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
              Football Details
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Position"
              value={formData.position}
              onChange={(e) => handleChange('position', e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="Goalkeeper">Goalkeeper</MenuItem>
              <MenuItem value="Defender">Defender</MenuItem>
              <MenuItem value="Midfielder">Midfielder</MenuItem>
              <MenuItem value="Forward">Forward</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Strong Foot"
              value={formData.strongFoot}
              onChange={(e) => handleChange('strongFoot', e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="Left">Left</MenuItem>
              <MenuItem value="Right">Right</MenuItem>
              <MenuItem value="Both">Both</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Height"
              value={formData.height}
              onChange={(e) => handleChange('height', e.target.value)}
              placeholder="e.g., 180 cm or 5'11&quot;"
            />
          </Grid>

          {/* Contact & Location */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
              Contact & Location
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Country Code"
              value={formData.phoneNumber.countryCode}
              onChange={(e) => handlePhoneNumberChange('countryCode', e.target.value)}
              placeholder="+1"
            />
          </Grid>

          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phoneNumber.number}
              onChange={(e) => handlePhoneNumberChange('number', e.target.value)}
              placeholder="1234567890"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Country"
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="State/Province"
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.name}
        >
          {loading ? <CircularProgress size={24} /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditPlayerDialog;
