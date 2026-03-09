import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Badge,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RuleIcon from '@mui/icons-material/Rule';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AppLayout from '../../components/AppLayout';
import RequireRole from '../../components/RequireRole';
import recommendationService from '../../api/recommendationService';
import RecommendationRuleDialog from '../../components/RecommendationRuleDialog';

const priorityColors = {
  HIGH: 'error',      // 8-10
  MEDIUM: 'warning',  // 5-7
  LOW: 'success',     // 1-4
};

const getPriorityLevel = (priority) => {
  if (priority >= 8) return 'HIGH';
  if (priority >= 5) return 'MEDIUM';
  return 'LOW';
};

const getEffectivenessColor = (score) => {
  if (score >= 70) return 'success';
  if (score >= 40) return 'warning';
  return 'error';
};

const operatorLabels = {
  GREATER_THAN: '>',
  LESS_THAN: '<',
  GREATER_THAN_OR_EQUAL: '≥',
  LESS_THAN_OR_EQUAL: '≤',
  EQUAL: '=',
  BETWEEN: 'between',
};

const RecommendationRulesManager = () => {
  const { clubId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [rules, setRules] = useState([]);
  const [ineffectiveRules, setIneffectiveRules] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showIneffectiveOnly, setShowIneffectiveOnly] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'edit'
  const [ruleToEdit, setRuleToEdit] = useState(null);

  useEffect(() => {
    loadRules();
    loadExercises();
    loadIneffectiveRules();
  }, [clubId, selectedCategory, showIneffectiveOnly]);

  const loadRules = async () => {
    try {
      setLoading(true);
      const params = {
        clubId: clubId || null,
      };
      if (selectedCategory) params.category = selectedCategory;
      if (showIneffectiveOnly) params.ineffective = true;

      const response = await recommendationService.getRecommendationRules(params);
      setRules(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error loading rules:', err);
      setError(err.response?.data?.message || 'Failed to load recommendation rules');
    } finally {
      setLoading(false);
    }
  };

  const loadExercises = async () => {
    try {
      const response = await recommendationService.getTrainingExercises();
      setExercises(response.data || []);
    } catch (err) {
      console.error('Error loading exercises:', err);
    }
  };

  const loadIneffectiveRules = async () => {
    try {
      const response = await recommendationService.getIneffectiveRules();
      setIneffectiveRules(response.data || []);
    } catch (err) {
      console.error('Error loading ineffective rules:', err);
    }
  };

  const handleDelete = async () => {
    if (!ruleToDelete) return;

    try {
      await recommendationService.deleteRecommendationRule(ruleToDelete._id);
      setRules(rules.filter(rule => rule._id !== ruleToDelete._id));
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
      setSuccess('Rule deleted successfully');
    } catch (err) {
      console.error('Error deleting rule:', err);
      setError(err.response?.data?.message || 'Failed to delete rule');
    }
  };

  const openDeleteDialog = (rule) => {
    setRuleToDelete(rule);
    setDeleteDialogOpen(true);
  };

  const openDetailDialog = (rule) => {
    setSelectedRule(rule);
    setDetailDialogOpen(true);
  };

  const handleTestRule = async (ruleId) => {
    // TODO: Open test dialog with sample metrics
    console.log('Test rule:', ruleId);
  };

  const openEditDialog = (rule) => {
    setRuleToEdit(rule);
    setDialogMode('edit');
    setEditDialogOpen(true);
  };

  const openCreateDialog = () => {
    setRuleToEdit(null);
    setDialogMode('create');
    setEditDialogOpen(true);
  };

  const handleSaveRule = async (ruleData) => {
    try {
      setError(null);
      if (dialogMode === 'edit' && ruleToEdit) {
        // Update existing rule
        const response = await recommendationService.updateRecommendationRule(ruleToEdit._id, ruleData);
        setRules(rules.map(rule => rule._id === ruleToEdit._id ? response.data : rule));
        setSuccess('Rule updated successfully');
      } else {
        // Create new rule
        const response = await recommendationService.createRecommendationRule(ruleData);
        setRules([response.data, ...rules]);
        setSuccess('Rule created successfully');
      }
      setEditDialogOpen(false);
      setRuleToEdit(null);
      loadRules(); // Reload to get populated data
    } catch (err) {
      console.error('Error saving rule:', err);
      setError(err.response?.data?.message || 'Failed to save rule');
    }
  };

  const filteredRules = rules.filter((rule) => {
    const name = rule.name?.toLowerCase() || '';
    const exerciseName = rule.trainingExercise?.name?.en?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return name.includes(search) || exerciseName.includes(search);
  });

  const getExerciseName = (exerciseId) => {
    const exercise = exercises.find(ex => ex._id === exerciseId);
    return exercise?.name?.en || 'Unknown Exercise';
  };

  const RuleCard = ({ rule }) => {
    const priorityLevel = getPriorityLevel(rule.priority);
    const isIneffective = rule.isIneffective || ineffectiveRules.some(r => r._id === rule._id);
    const effectivenessScore = rule.effectivenessScore || 0;

    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {isIneffective && (
          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
            <Tooltip title="This rule has low effectiveness">
              <WarningIcon color="warning" />
            </Tooltip>
          </Box>
        )}
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, pr: 4 }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {rule.name}
            </Typography>
            <Chip
              label={`P${rule.priority}`}
              color={priorityColors[priorityLevel]}
              size="small"
            />
          </Box>

          <Typography variant="body2" color="primary" gutterBottom sx={{ fontWeight: 500 }}>
            → {rule.trainingExercise?.name?.en || 'Exercise deleted'}
          </Typography>

          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
              CONDITIONS ({rule.conditions?.length || 0}):
            </Typography>
            {rule.conditions?.slice(0, 2).map((condition, index) => (
              <Box key={index} sx={{ mt: 0.5 }}>
                <Typography variant="caption" component="div">
                  • {condition.metric} {operatorLabels[condition.operator]} {condition.threshold}
                  {condition.secondThreshold !== undefined && ` - ${condition.secondThreshold}`}
                </Typography>
              </Box>
            ))}
            {rule.conditions?.length > 2 && (
              <Typography variant="caption" color="textSecondary">
                + {rule.conditions.length - 2} more...
              </Typography>
            )}
          </Box>

          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" color="textSecondary">
                Effectiveness
              </Typography>
              <Typography variant="caption" color={getEffectivenessColor(effectivenessScore)}>
                {effectivenessScore > 0 ? `${effectivenessScore.toFixed(1)}%` : 'No data'}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(effectivenessScore, 100)}
              color={getEffectivenessColor(effectivenessScore)}
              sx={{ height: 6, borderRadius: 1 }}
            />
          </Box>

          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`${rule.timesTriggered || 0} triggers`}
              size="small"
              variant="outlined"
            />
            {rule.isActive ? (
              <Chip
                label="Active"
                size="small"
                color="success"
                icon={<CheckCircleIcon />}
              />
            ) : (
              <Chip
                label="Inactive"
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </CardContent>
        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
          <Button
            size="small"
            onClick={() => openDetailDialog(rule)}
          >
            View Details
          </Button>
          <Box>
            <Tooltip title="Test Rule">
              <IconButton
                size="small"
                color="info"
                onClick={() => handleTestRule(rule._id)}
              >
                <PlayArrowIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <IconButton
              size="small"
              color="primary"
              onClick={() => openEditDialog(rule)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => openDeleteDialog(rule)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </CardActions>
      </Card>
    );
  };

  if (loading && rules.length === 0) {
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
                <RuleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4" component="h1">
                    Recommendation Rules
                  </Typography>
                  {ineffectiveRules.length > 0 && (
                    <Typography variant="caption" color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <WarningIcon fontSize="small" />
                      {ineffectiveRules.length} ineffective rule{ineffectiveRules.length !== 1 ? 's' : ''} need attention
                    </Typography>
                  )}
                </Box>
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
                  New Rule
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
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                placeholder="Search rules..."
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
                <InputLabel>Exercise Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Exercise Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  <MenuItem value="PASSING">Passing</MenuItem>
                  <MenuItem value="DRIBBLING">Dribbling</MenuItem>
                  <MenuItem value="FIRST_TOUCH">First Touch</MenuItem>
                  <MenuItem value="SHOOTING">Shooting</MenuItem>
                  <MenuItem value="CONTROL">Control</MenuItem>
                  <MenuItem value="GENERAL">General</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={showIneffectiveOnly}
                  onChange={(e) => setShowIneffectiveOnly(e.target.value)}
                  label="Status"
                >
                  <MenuItem value={false}>All Rules</MenuItem>
                  <MenuItem value={true}>Ineffective Only</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Rule Grid */}
            {filteredRules.length === 0 ? (
              <Alert severity="info">
                No recommendation rules found. {searchTerm || selectedCategory || showIneffectiveOnly ? 'Try adjusting your filters.' : 'Create your first rule to get started.'}
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {filteredRules.map((rule) => (
                  <Grid item xs={12} sm={6} md={4} key={rule._id}>
                    <RuleCard rule={rule} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Container>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Recommendation Rule?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{ruleToDelete?.name}"? This action cannot be undone.
            </Typography>
            {ruleToDelete?.timesTriggered > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This rule has been triggered {ruleToDelete.timesTriggered} times and may have active recommendations.
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Rule Detail Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedRule?.name}
            <Chip
              label={`Priority ${selectedRule?.priority}`}
              color={priorityColors[getPriorityLevel(selectedRule?.priority)]}
              size="small"
              sx={{ ml: 2 }}
            />
          </DialogTitle>
          <DialogContent>
            <Typography variant="h6" gutterBottom>
              Recommended Exercise
            </Typography>
            <Typography variant="body1" paragraph>
              {selectedRule?.trainingExercise?.name?.en}
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Conditions
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Metric</TableCell>
                    <TableCell>Operator</TableCell>
                    <TableCell>Threshold</TableCell>
                    <TableCell>Drill Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedRule?.conditions?.map((condition, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {condition.metric}
                      </TableCell>
                      <TableCell>{operatorLabels[condition.operator]}</TableCell>
                      <TableCell>
                        {condition.threshold}
                        {condition.secondThreshold !== undefined && ` - ${condition.secondThreshold}`}
                      </TableCell>
                      <TableCell>{condition.drillType || 'Any'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6" gutterBottom>
              Recommendation Message
            </Typography>
            <Typography variant="subtitle2" gutterBottom>
              {selectedRule?.recommendation?.title?.en}
            </Typography>
            <Typography variant="body2" paragraph>
              {selectedRule?.recommendation?.message?.en}
            </Typography>
            <Typography variant="body2" paragraph sx={{ fontStyle: 'italic' }}>
              Action Plan: {selectedRule?.recommendation?.actionPlan?.en}
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">
                  Times Triggered
                </Typography>
                <Typography variant="h6">
                  {selectedRule?.timesTriggered || 0}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">
                  Effectiveness Score
                </Typography>
                <Typography variant="h6" color={getEffectivenessColor(selectedRule?.effectivenessScore || 0)}>
                  {selectedRule?.effectivenessScore > 0 ? `${selectedRule.effectivenessScore.toFixed(1)}%` : 'No data'}
                </Typography>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleTestRule(selectedRule?._id)} startIcon={<PlayArrowIcon />}>
              Test Rule
            </Button>
            <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Edit/Create Rule Dialog */}
        <RecommendationRuleDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onSave={handleSaveRule}
          rule={ruleToEdit}
          exercises={exercises}
          mode={dialogMode}
        />
      </AppLayout>
    </RequireRole>
  );
};

export default RecommendationRulesManager;
