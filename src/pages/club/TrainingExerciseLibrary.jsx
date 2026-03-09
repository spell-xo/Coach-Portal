import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AppLayout from '../../components/AppLayout';
import RequireRole from '../../components/RequireRole';
import recommendationService from '../../api/recommendationService';
import TrainingExerciseDialog from '../../components/TrainingExerciseDialog';

const difficultyColors = {
  BEGINNER: 'success',
  INTERMEDIATE: 'warning',
  ADVANCED: 'error',
};

const categoryIcons = {
  PASSING: '⚽',
  DRIBBLING: '🏃',
  FIRST_TOUCH: '👟',
  SHOOTING: '🎯',
  CONTROL: '🎮',
  GENERAL: '📋',
};

const TrainingExerciseLibrary = () => {
  const { clubId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryGroups, setCategoryGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [exerciseToEdit, setExerciseToEdit] = useState(null);
  const [success, setSuccess] = useState(null);

  console.log('[TrainingExerciseLibrary] Component rendered, clubId:', clubId);
  console.log('[TrainingExerciseLibrary] State - loading:', loading, 'exercises count:', exercises.length, 'error:', error);

  useEffect(() => {
    console.log('[TrainingExerciseLibrary] useEffect triggered');
    loadExercises();
    loadCategories();
    loadCategoryGroups();
  }, [clubId, selectedCategoryGroup, selectedCategory, selectedDifficulty]);

  const loadExercises = async () => {
    try {
      setLoading(true);
      const params = {
        clubId: clubId || null,
      };
      if (selectedCategoryGroup) params.categoryGroup = selectedCategoryGroup;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedDifficulty) params.difficulty = selectedDifficulty;

      console.log('[TrainingExerciseLibrary] Loading exercises with params:', params);
      const response = await recommendationService.getTrainingExercises(params);
      console.log('[TrainingExerciseLibrary] Response:', response);
      console.log('[TrainingExerciseLibrary] Exercises data:', response.data);
      setExercises(response.data || []);
      setError(null);
    } catch (err) {
      console.error('[TrainingExerciseLibrary] Error loading exercises:', err);
      console.error('[TrainingExerciseLibrary] Error response:', err.response);
      setError(err.response?.data?.message || 'Failed to load training exercises');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await recommendationService.getExerciseCategories();
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadCategoryGroups = async () => {
    try {
      const response = await recommendationService.getExerciseCategoryGroups();
      setCategoryGroups(response.data || []);
    } catch (err) {
      console.error('Error loading category groups:', err);
    }
  };

  const handleDelete = async () => {
    if (!exerciseToDelete) return;

    try {
      await recommendationService.deleteTrainingExercise(exerciseToDelete._id);
      setExercises(exercises.filter(ex => ex._id !== exerciseToDelete._id));
      setDeleteDialogOpen(false);
      setExerciseToDelete(null);
    } catch (err) {
      console.error('Error deleting exercise:', err);
      setError(err.response?.data?.message || 'Failed to delete exercise');
    }
  };

  const openDeleteDialog = (exercise) => {
    setExerciseToDelete(exercise);
    setDeleteDialogOpen(true);
  };

  const openVideoDialog = (exercise) => {
    setSelectedExercise(exercise);
    setVideoDialogOpen(true);
  };

  const openEditDialog = (exercise) => {
    setExerciseToEdit(exercise);
    setDialogMode('edit');
    setEditDialogOpen(true);
  };

  const openCreateDialog = () => {
    setExerciseToEdit(null);
    setDialogMode('create');
    setEditDialogOpen(true);
  };

  const handleSaveExercise = async (exerciseData) => {
    try {
      setError(null);
      if (dialogMode === 'edit' && exerciseToEdit) {
        // Update existing exercise
        const response = await recommendationService.updateTrainingExercise(exerciseToEdit._id, exerciseData);
        setExercises(exercises.map(ex => ex._id === exerciseToEdit._id ? response.data : ex));
        setSuccess('Exercise updated successfully');
      } else {
        // Create new exercise
        const response = await recommendationService.createTrainingExercise(exerciseData);
        setExercises([response.data, ...exercises]);
        setSuccess('Exercise created successfully');
      }
      setEditDialogOpen(false);
      setExerciseToEdit(null);
      loadExercises(); // Reload to ensure fresh data
    } catch (err) {
      console.error('Error saving exercise:', err);
      setError(err.response?.data?.message || 'Failed to save exercise');
    }
  };

  const filteredExercises = exercises.filter((exercise) => {
    const nameEn = exercise.name?.en?.toLowerCase() || '';
    const descEn = exercise.description?.en?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return nameEn.includes(search) || descEn.includes(search);
  });

  console.log('[TrainingExerciseLibrary] filteredExercises count:', filteredExercises.length);
  console.log('[TrainingExerciseLibrary] searchTerm:', searchTerm);
  console.log('[TrainingExerciseLibrary] selectedCategory:', selectedCategory);
  console.log('[TrainingExerciseLibrary] selectedDifficulty:', selectedDifficulty);

  const ExerciseCard = ({ exercise }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="img"
        height="180"
        image={exercise.thumbnailUrl || 'https://via.placeholder.com/400x180?text=No+Thumbnail'}
        alt={exercise.name?.en || 'Exercise'}
        sx={{ cursor: 'pointer' }}
        onClick={() => openVideoDialog(exercise)}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {categoryIcons[exercise.category] || ''} {exercise.name?.en || 'Unnamed Exercise'}
          </Typography>
          <Chip
            label={exercise.difficulty}
            color={difficultyColors[exercise.difficulty] || 'default'}
            size="small"
          />
        </Box>

        <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mb: 2 }}>
          {exercise.description?.en?.substring(0, 120) || 'No description'}
          {exercise.description?.en?.length > 120 && '...'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
          <Chip
            label={exercise.category}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`${exercise.duration} min`}
            size="small"
            variant="outlined"
          />
        </Box>

        {exercise.focusAreas && exercise.focusAreas.length > 0 && (
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
            Focus: {exercise.focusAreas.slice(0, 3).join(', ')}
          </Typography>
        )}

        <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
          {exercise.averageRating && (
            <Chip
              label={`⭐ ${exercise.averageRating.toFixed(1)}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          {exercise.usageCount > 0 && (
            <Chip
              label={`${exercise.usageCount} uses`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      </CardContent>
      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          size="small"
          startIcon={<PlayCircleOutlineIcon />}
          onClick={() => openVideoDialog(exercise)}
        >
          View
        </Button>
        <Box>
          <IconButton
            size="small"
            color="primary"
            onClick={() => openEditDialog(exercise)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => openDeleteDialog(exercise)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </CardActions>
    </Card>
  );

  if (loading && exercises.length === 0) {
    return (
      <AppLayout>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress />
          </Box>
        </Container>
      </AppLayout>
    );
  }

  return (
    <RequireRole roles={['coach', 'head_coach', 'club_manager']} showError={true}>
      <AppLayout>
        <Container maxWidth="xl">
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FitnessCenterIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                <Typography variant="h4" component="h1">
                  Training Exercise Library
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<FileUploadIcon />}
                  onClick={() => {/* TODO: Open bulk import dialog */}}
                >
                  Bulk Import
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={openCreateDialog}
                >
                  New Exercise
                </Button>
              </Box>
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

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 300 }}
              />
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Group</InputLabel>
                <Select
                  value={selectedCategoryGroup}
                  onChange={(e) => setSelectedCategoryGroup(e.target.value)}
                  label="Group"
                >
                  <MenuItem value="">All Groups</MenuItem>
                  {categoryGroups.map((group) => (
                    <MenuItem key={group.value} value={group.value}>
                      {group.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {categoryIcons[cat] || ''} {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  label="Difficulty"
                >
                  <MenuItem value="">All Levels</MenuItem>
                  <MenuItem value="BEGINNER">Beginner</MenuItem>
                  <MenuItem value="INTERMEDIATE">Intermediate</MenuItem>
                  <MenuItem value="ADVANCED">Advanced</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Exercise Grid */}
            {filteredExercises.length === 0 ? (
              <Alert severity="info">
                No training exercises found. {searchTerm || selectedCategory || selectedDifficulty ? 'Try adjusting your filters.' : 'Create your first exercise to get started.'}
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {filteredExercises.map((exercise) => (
                  <Grid item xs={12} sm={6} md={4} key={exercise._id}>
                    <ExerciseCard exercise={exercise} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Container>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Training Exercise?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{exerciseToDelete?.name?.en}"? This will also affect any recommendation rules using this exercise.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Video Dialog */}
        <Dialog
          open={videoDialogOpen}
          onClose={() => setVideoDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedExercise?.name?.en}
            <Chip
              label={selectedExercise?.difficulty}
              color={difficultyColors[selectedExercise?.difficulty] || 'default'}
              size="small"
              sx={{ ml: 2 }}
            />
          </DialogTitle>
          <DialogContent>
            {selectedExercise?.videoUrl && (
              <Box sx={{ mb: 3 }}>
                <video
                  controls
                  style={{ width: '100%', maxHeight: '400px' }}
                  poster={selectedExercise.thumbnailUrl}
                >
                  <source src={selectedExercise.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </Box>
            )}
            <Typography variant="body1" paragraph>
              {selectedExercise?.description?.en}
            </Typography>
            <Typography variant="h6" gutterBottom>
              Instructions
            </Typography>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
              {selectedExercise?.instructions?.en}
            </Typography>
            {selectedExercise?.equipmentNeeded && selectedExercise.equipmentNeeded.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Equipment Needed
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedExercise.equipmentNeeded.map((item, index) => (
                    <Chip key={index} label={item} size="small" variant="outlined" />
                  ))}
                </Box>
              </>
            )}
            {selectedExercise?.focusAreas && selectedExercise.focusAreas.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Focus Areas
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedExercise.focusAreas.map((area, index) => (
                    <Chip key={index} label={area} size="small" color="primary" variant="outlined" />
                  ))}
                </Box>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setVideoDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Edit/Create Exercise Dialog */}
        <TrainingExerciseDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onSave={handleSaveExercise}
          exercise={exerciseToEdit}
          mode={dialogMode}
        />
      </AppLayout>
    </RequireRole>
  );
};

export default TrainingExerciseLibrary;
