import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  TextField,
  Autocomplete,
  Avatar,
  Alert,
  Grid,
  Card,
  CardContent,
  Container,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import Breadcrumbs from '../../components/Breadcrumbs';
import RequireRole from '../../components/RequireRole';
import clubService from '../../api/clubService';
import axios from 'axios';
import showToast from '../../utils/toast';
import heic2any from 'heic2any';

const BulkProfilePictureUpload = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();

  // File management
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState({});
  const [selectedImages, setSelectedImages] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  // Player management
  const [players, setPlayers] = useState([]);
  const [imagePlayerMap, setImagePlayerMap] = useState({});

  // UI state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchStatusFilter, setMatchStatusFilter] = useState('all');

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // Load players
  useEffect(() => {
    loadPlayers();
  }, [clubId]);

  const loadPlayers = async () => {
    try {
      const response = await clubService.getPlayers(clubId);
      setPlayers(response.data || []);
    } catch (error) {
      console.error('Error loading players:', error);
      showToast.error('Failed to load players');
    }
  };

  // Automatic player matching by filename
  const matchPlayerByFilename = (filename) => {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '').toLowerCase().trim();

    const matchedPlayer = players.find(player => {
      const playerName = player.name.toLowerCase().trim();
      const playerEmail = player.email?.toLowerCase().trim() || '';

      return playerName === nameWithoutExt ||
             nameWithoutExt.includes(playerName) ||
             playerName.includes(nameWithoutExt) ||
             playerEmail === nameWithoutExt ||
             nameWithoutExt.includes(playerEmail);
    });

    return matchedPlayer || null;
  };

  // Generate image preview
  const generateImagePreview = async (file, index) => {
    return new Promise(async (resolve) => {
      try {
        let fileToPreview = file;

        // Convert HEIC/HEIF to JPEG for preview (browsers don't natively support HEIC)
        if (file.type === 'image/heic' || file.type === 'image/heif' ||
            file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
          try {
            const convertedBlob = await heic2any({
              blob: file,
              toType: 'image/jpeg',
              quality: 0.8
            });
            fileToPreview = convertedBlob;
          } catch (conversionError) {
            console.warn('Failed to convert HEIC to JPEG for preview:', conversionError);
            // Continue with original file - Safari may be able to display it
          }
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ index, previewUrl: reader.result });
        };
        reader.readAsDataURL(fileToPreview);
      } catch (error) {
        console.error('Error generating preview:', error);
        resolve({ index, previewUrl: null });
      }
    });
  };

  // Add files
  const addFiles = async (newFiles) => {
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];

    // Filter valid files - also check file extension for HEIC since some browsers don't set the MIME type correctly
    const validFiles = newFiles.filter(file => {
      const isValidMimeType = validImageTypes.includes(file.type);
      const fileName = file.name.toLowerCase();
      const isHeicFile = fileName.endsWith('.heic') || fileName.endsWith('.heif');
      const isImageFile = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
                         fileName.endsWith('.png') || fileName.endsWith('.gif') ||
                         fileName.endsWith('.webp');

      return isValidMimeType || isHeicFile || isImageFile;
    });

    if (validFiles.length === 0) {
      showToast.error('Please select valid image files (JPEG, PNG, GIF, WEBP, HEIC)');
      return;
    }

    if (images.length + validFiles.length > 50) {
      showToast.error('Maximum 50 images allowed per batch');
      return;
    }

    const currentIndex = images.length;
    const newImages = [...images, ...validFiles];
    setImages(newImages);

    // Generate previews and match players
    const newMatches = { ...imagePlayerMap };
    const previewPromises = validFiles.map((file, idx) => generateImagePreview(file, currentIndex + idx));

    const previews = await Promise.all(previewPromises);
    const newPreviews = { ...imagePreviews };

    previews.forEach(({ index, previewUrl }) => {
      newPreviews[index] = previewUrl;

      // Auto-match player
      const file = newImages[index];
      const matchedPlayer = matchPlayerByFilename(file.name);
      if (matchedPlayer) {
        newMatches[index] = matchedPlayer.id;
      }
    });

    setImagePreviews(newPreviews);
    setImagePlayerMap(newMatches);
  };

  // Handle file input change
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    addFiles(files);
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    setDragOver(false);
    const files = Array.from(event.dataTransfer.files);
    addFiles(files);
  }, [images, players]);

  // Remove image
  const handleRemoveImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = {};
    const newMatches = {};
    const newSelected = [];

    // Re-index everything
    newImages.forEach((img, newIdx) => {
      const oldIdx = images.indexOf(img);
      newPreviews[newIdx] = imagePreviews[oldIdx];
      if (imagePlayerMap[oldIdx]) {
        newMatches[newIdx] = imagePlayerMap[oldIdx];
      }
      if (selectedImages.includes(oldIdx)) {
        newSelected.push(newIdx);
      }
    });

    setImages(newImages);
    setImagePreviews(newPreviews);
    setImagePlayerMap(newMatches);
    setSelectedImages(newSelected);
  };

  // Remove selected images
  const handleRemoveSelected = () => {
    const newImages = images.filter((_, i) => !selectedImages.includes(i));
    const newPreviews = {};
    const newMatches = {};

    newImages.forEach((img, newIdx) => {
      const oldIdx = images.indexOf(img);
      newPreviews[newIdx] = imagePreviews[oldIdx];
      if (imagePlayerMap[oldIdx]) {
        newMatches[newIdx] = imagePlayerMap[oldIdx];
      }
    });

    setImages(newImages);
    setImagePreviews(newPreviews);
    setImagePlayerMap(newMatches);
    setSelectedImages([]);
  };

  // Clear all images
  const handleClearAll = () => {
    setImages([]);
    setImagePreviews({});
    setImagePlayerMap({});
    setSelectedImages([]);
    setPage(0);
  };

  // Handle player selection
  const handlePlayerSelect = (index, player) => {
    setImagePlayerMap({
      ...imagePlayerMap,
      [index]: player ? player.id : null,
    });
  };

  // Handle selection
  const handleSelectImage = (index) => {
    if (selectedImages.includes(index)) {
      setSelectedImages(selectedImages.filter(i => i !== index));
    } else {
      setSelectedImages([...selectedImages, index]);
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedImages(filteredImages.map((_, idx) => images.indexOf(filteredImages[idx])));
    } else {
      setSelectedImages([]);
    }
  };

  // Filter images
  const filteredImages = images.filter((image, index) => {
    const matchesSearch = image.name.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesFilter = true;
    if (matchStatusFilter === 'matched') {
      matchesFilter = imagePlayerMap[index] != null;
    } else if (matchStatusFilter === 'unmatched') {
      matchesFilter = imagePlayerMap[index] == null;
    }

    return matchesSearch && matchesFilter;
  });

  // Upload images
  const handleUpload = async () => {
    // Validate that all images have player assignments
    const unmatchedImages = images.filter((_, index) => !imagePlayerMap[index]);

    if (unmatchedImages.length > 0) {
      showToast.error(`Please assign players to all images (${unmatchedImages.length} unmatched)`);
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Step 1: Generate pre-signed URLs (10% progress)
      const imagesForUpload = images.map((file, index) => {
        // Determine content type - handle HEIC files that may not have correct MIME type
        let contentType = file.type;
        const fileName = file.name.toLowerCase();

        // Check if this is a HEIC file that will be converted to JPEG
        const isHeicFile = contentType === 'image/heic' || contentType === 'image/heif' ||
                          fileName.endsWith('.heic') || fileName.endsWith('.heif');

        if (isHeicFile) {
          // Request JPEG upload URL since we'll convert HEIC to JPEG before uploading
          contentType = 'image/jpeg';
        } else if (!contentType || contentType === 'application/octet-stream' || contentType === '') {
          // Detect content type from file extension for other formats
          if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
            contentType = 'image/jpeg';
          } else if (fileName.endsWith('.png')) {
            contentType = 'image/png';
          } else if (fileName.endsWith('.gif')) {
            contentType = 'image/gif';
          } else if (fileName.endsWith('.webp')) {
            contentType = 'image/webp';
          }
        }

        return {
          playerId: imagePlayerMap[index],
          fileName: file.name,
          contentType: contentType,
        };
      });

      const urlResponse = await clubService.getBatchProfilePictureUploadUrls(clubId, imagesForUpload);
      setUploadProgress(10);

      // Step 2: Upload images to GCS (10% -> 80% progress)
      const uploadedImages = [];
      const progressIncrement = 70 / images.length;

      for (let i = 0; i < images.length; i++) {
        let file = images[i];
        const uploadInfo = urlResponse.data[i];

        try {
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
              showToast.error(`Failed to convert ${file.name}. Please try a different format.`);
              continue; // Skip this file
            }
          }

          // Upload to GCS
          await axios.put(uploadInfo.uploadUrl, fileToUpload, {
            headers: {
              'Content-Type': contentType,
            },
          });

          uploadedImages.push({
            playerId: uploadInfo.playerId,
            profilePicture: uploadInfo.publicUrl,
          });

          setUploadProgress(10 + (i + 1) * progressIncrement);
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          showToast.error(`Failed to upload ${file.name}`);
        }
      }

      // Step 3: Update player profile pictures in database (80% -> 100%)
      setUploadProgress(85);
      const updateResponse = await clubService.updateBatchPlayerProfilePictures(clubId, uploadedImages);
      setUploadProgress(100);

      setUploadResults(updateResponse.data);
      setShowResults(true);

      if (updateResponse.data.success === images.length) {
        showToast.success(`Successfully updated ${updateResponse.data.success} profile pictures!`);
        handleClearAll();
      } else {
        showToast.warning(
          `Updated ${updateResponse.data.success} of ${images.length} profile pictures`
        );
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast.error(error.response?.data?.message || 'Failed to upload profile pictures');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Get match status
  const getMatchStatus = (index) => {
    if (imagePlayerMap[index]) {
      const player = players.find(p => p.id === imagePlayerMap[index]);
      return {
        matched: true,
        player: player || null,
      };
    }
    return { matched: false, player: null };
  };

  // Pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedImages = filteredImages.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const matchedCount = images.filter((_, index) => imagePlayerMap[index]).length;
  const unmatchedCount = images.length - matchedCount;

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Clubs', path: '/clubs' },
    { label: 'Players', path: `/clubs/${clubId}/players` },
    { label: 'Bulk Profile Picture Upload' },
  ];

  return (
    <RequireRole roles={['club_manager', 'head_coach']}>
      <AppLayout>
        <Container maxWidth="xl">
          <Breadcrumbs items={breadcrumbItems} />

          <Box sx={{ mb: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4">Bulk Profile Picture Upload</Typography>
              <Button variant="outlined" onClick={() => navigate(`/clubs/${clubId}/players`)}>
                Back to Players
              </Button>
            </Box>

      {/* Info Card */}
      <Card sx={{ mb: 3, bgcolor: 'info.lighter' }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <InfoIcon color="info" />
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Bulk Upload Instructions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                1. Drag and drop up to 50 image files (JPEG, PNG, GIF, WEBP, HEIC) or click to browse
                <br />
                2. Images will be automatically matched to players by filename
                <br />
                3. Review and adjust player assignments as needed
                <br />
                4. Click "Upload All" to update profile pictures
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Drop Zone */}
      {images.length === 0 && (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            border: '2px dashed',
            borderColor: dragOver ? 'primary.main' : 'divider',
            bgcolor: dragOver ? 'action.hover' : 'background.paper',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input').click()}
        >
          <input
            id="file-input"
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif,.heic,.heif"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <CloudUploadIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Click or Drag up to 50 image files here
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supported formats: JPEG, PNG, GIF, WEBP, HEIC
          </Typography>
        </Paper>
      )}

      {/* Image Management */}
      {images.length > 0 && (
        <Box>
          {/* Stats and Actions */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Images
                </Typography>
                <Typography variant="h4">{images.length}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Matched
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h4">{matchedCount}</Typography>
                  <CheckCircleIcon color="success" />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Unmatched
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h4">{unmatchedCount}</Typography>
                  {unmatchedCount > 0 && <CancelIcon color="error" />}
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  onClick={handleUpload}
                  disabled={uploading || unmatchedCount > 0}
                  fullWidth
                >
                  Upload All
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => document.getElementById('file-input').click()}
                  disabled={uploading}
                  fullWidth
                  size="small"
                >
                  Add More
                </Button>
              </Box>
            </Grid>
          </Grid>

          {/* Filters and Actions */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by filename..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Filter by Status"
                  value={matchStatusFilter}
                  onChange={(e) => setMatchStatusFilter(e.target.value)}
                  SelectProps={{ native: true }}
                >
                  <option value="all">All Images</option>
                  <option value="matched">Matched</option>
                  <option value="unmatched">Unmatched</option>
                </TextField>
              </Grid>
              <Grid item xs={12} md={5}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleRemoveSelected}
                    disabled={selectedImages.length === 0 || uploading}
                  >
                    Remove Selected ({selectedImages.length})
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleClearAll}
                    disabled={uploading}
                  >
                    Clear All
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Upload Progress */}
          {uploading && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Uploading... {uploadProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Paper>
          )}

          {/* Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedImages.length === filteredImages.length && filteredImages.length > 0}
                      indeterminate={
                        selectedImages.length > 0 && selectedImages.length < filteredImages.length
                      }
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Preview</TableCell>
                  <TableCell>Filename</TableCell>
                  <TableCell>Player</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedImages.map((image, paginatedIdx) => {
                  const index = images.indexOf(image);
                  const matchStatus = getMatchStatus(index);
                  const isSelected = selectedImages.includes(index);

                  return (
                    <TableRow key={index} selected={isSelected}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleSelectImage(index)}
                        />
                      </TableCell>
                      <TableCell>
                        <Avatar
                          src={imagePreviews[index]}
                          variant="rounded"
                          sx={{ width: 60, height: 60 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {image.name}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 250 }}>
                        <Autocomplete
                          size="small"
                          options={players}
                          getOptionLabel={(option) => option.name}
                          value={players.find((p) => p.id === imagePlayerMap[index]) || null}
                          onChange={(event, newValue) => handlePlayerSelect(index, newValue)}
                          renderOption={(props, option) => (
                            <Box component="li" {...props}>
                              <Avatar
                                src={option.profilePicture}
                                sx={{ width: 30, height: 30, mr: 1 }}
                              >
                                {option.name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2">{option.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {option.email}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                          renderInput={(params) => (
                            <TextField {...params} placeholder="Select player" />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        {matchStatus.matched ? (
                          <Chip
                            label="Matched"
                            color="success"
                            size="small"
                            icon={<CheckCircleIcon />}
                          />
                        ) : (
                          <Chip
                            label="Unmatched"
                            color="error"
                            size="small"
                            icon={<CancelIcon />}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredImages.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        </Box>
      )}

      {/* Results Dialog */}
      <Dialog open={showResults} onClose={() => setShowResults(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Results</DialogTitle>
        <DialogContent>
          {uploadResults && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Successfully updated {uploadResults.success} profile pictures
              </Alert>
              {uploadResults.failed > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Failed to update {uploadResults.failed} profile pictures
                </Alert>
              )}
              {uploadResults.errors && uploadResults.errors.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Errors:
                  </Typography>
                  {uploadResults.errors.map((err, idx) => (
                    <Typography key={idx} variant="body2" color="error">
                      Player {err.playerId}: {err.error}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResults(false)}>Close</Button>
        </DialogActions>
      </Dialog>
          </Box>
        </Container>
      </AppLayout>
    </RequireRole>
  );
};

export default BulkProfilePictureUpload;
