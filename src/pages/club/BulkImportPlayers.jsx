import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  LinearProgress,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import AppLayout from '../../components/AppLayout';
import RequireRole from '../../components/RequireRole';
import clubService from '../../api/clubService';

const steps = ['Upload CSV', 'Review & Validate', 'Import', 'Results'];

const BulkImportPlayers = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [excludedRows, setExcludedRows] = useState(new Set());
  const [importing, setImporting] = useState(false);
  const [importJobId, setImportJobId] = useState(null);
  const [importProgress, setImportProgress] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [teams, setTeams] = useState([]);
  const [defaultTeamId, setDefaultTeamId] = useState('');

  // Load teams for reference
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const response = await clubService.getTeams(clubId);
        setTeams(response.data || []);
      } catch (err) {
        console.error('Error loading teams:', err);
      }
    };
    loadTeams();
  }, [clubId]);

  // Step 1: File Upload
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file);
      setError(null);
    } else {
      setError('Please select a valid CSV file');
    }
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file);
      setError(null);
    } else {
      setError('Please drop a valid CSV file');
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const downloadTemplate = () => {
    const csvContent =
      'email,name,gender,teamId,jerseyNumber,position,dob,customMessage,parentName,parentEmail\n' +
      'john.smith@example.com,John Smith,Male,,10,Forward,1995-06-15,Welcome to the team!,,\n' +
      ',Jane Doe,Female,,7,Midfielder,2012-03-22,,Sarah Doe,sarah.doe@example.com\n' +
      ',Paul O\'Brien,Male,,5,Defender,2015-08-10,,Mary O\'Brien,mary.obrien@example.com\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aim-player-import-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleUploadAndValidate = async () => {
    if (!selectedFile) return;

    try {
      setError(null);
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await clubService.validateBulkImport(clubId, formData);
      setValidationResult(response.data);
      setActiveStep(1);
    } catch (err) {
      console.error('Validation error:', err);
      setError(err.response?.data?.message || 'Failed to validate CSV file');
    }
  };

  // Step 2: Review & Validation
  const toggleRowExclusion = (rowIndex) => {
    const newExcluded = new Set(excludedRows);
    if (newExcluded.has(rowIndex)) {
      newExcluded.delete(rowIndex);
    } else {
      newExcluded.add(rowIndex);
    }
    setExcludedRows(newExcluded);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'valid':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'error':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'warning':
        return <WarningIcon color="warning" fontSize="small" />;
      default:
        return null;
    }
  };

  const handleStartImport = async () => {
    try {
      setError(null);
      setImporting(true);
      setActiveStep(2);

      const formData = new FormData();
      formData.append('file', selectedFile);

      // Add default team ID if selected
      if (defaultTeamId) {
        formData.append('defaultTeamId', defaultTeamId);
      }

      const response = await clubService.startBulkImport(clubId, formData);
      setImportJobId(response.data.jobId);

      // Poll for progress
      pollImportProgress(response.data.jobId);
    } catch (err) {
      console.error('Import error:', err);
      setError(err.response?.data?.message || 'Failed to start import');
      setImporting(false);
    }
  };

  // Step 3: Monitor Progress
  const pollImportProgress = async (jobId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await clubService.getBulkImportJobStatus(clubId, jobId);
        setImportProgress(response.data);

        if (
          response.data.status === 'completed' ||
          response.data.status === 'completed_with_errors'
        ) {
          clearInterval(pollInterval);
          setImportResults(response.data);
          setImporting(false);
          setActiveStep(3);
        } else if (response.data.status === 'failed') {
          clearInterval(pollInterval);
          setError('Import failed. Please try again.');
          setImporting(false);
        }
      } catch (err) {
        console.error('Error polling progress:', err);
        clearInterval(pollInterval);
        setError('Failed to check import status');
        setImporting(false);
      }
    }, 2000); // Poll every 2 seconds
  };

  // Step 4: Results
  const handleDownloadErrors = async () => {
    try {
      const response = await clubService.downloadBulkImportErrors(clubId, importJobId);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `import-errors-${importJobId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading errors:', err);
      setError('Failed to download error report');
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedFile(null);
    setValidationResult(null);
    setExcludedRows(new Set());
    setImporting(false);
    setImportJobId(null);
    setImportProgress(null);
    setImportResults(null);
    setError(null);
  };

  const handleViewInvitations = () => {
    navigate(`/clubs/${clubId}/players/invitations`);
  };

  // Render step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Step 1: Prepare Your CSV File
            </Typography>
            <Button
              startIcon={<DownloadIcon />}
              onClick={downloadTemplate}
              sx={{ mb: 3 }}
            >
              Download CSV Template
            </Button>

            <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Required columns:</strong> name, gender
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Optional columns:</strong> email, teamId, jerseyNumber, position, dob,
                customMessage, parentName, parentEmail
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, fontSize: '0.85rem' }}>
                <strong>Email:</strong> If left empty, will be auto-generated from player name using manager's domain (e.g., John.Smith@club.com)
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                <strong>Valid gender values:</strong> Male, Female, Other, Prefer not to say
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                <strong>Date of birth format:</strong> YYYY-MM-DD, DD/MM/YYYY, or D/M/YYYY (e.g., 29/02/1927 or 2/2/2013)
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                <strong>Under 18 players:</strong> parentName and parentEmail are required when the date of birth indicates the player is under 18. A parental consent link will be generated.
              </Typography>
            </Alert>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="default-team-label">Default Team (Optional)</InputLabel>
              <Select
                labelId="default-team-label"
                id="default-team"
                value={defaultTeamId}
                label="Default Team (Optional)"
                onChange={(e) => setDefaultTeamId(e.target.value)}
              >
                <MenuItem value="">
                  <em>No team - players join club only</em>
                </MenuItem>
                {teams.map((team) => (
                  <MenuItem key={team._id} value={team._id}>
                    {team.name}
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                All players will be assigned to this team unless a different teamId is specified in their CSV row
              </Typography>
            </FormControl>

            {teams.length > 0 && (
              <Accordion sx={{ mb: 3 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">
                    Team IDs for CSV Override (click to expand)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Use these Team IDs in the CSV teamId column to override the default team for specific players.
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Team Name</strong></TableCell>
                          <TableCell><strong>Team ID</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {teams.map((team) => (
                          <TableRow key={team._id}>
                            <TableCell>{team.name}</TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: 'monospace',
                                  fontSize: '0.85rem',
                                  userSelect: 'all',
                                  cursor: 'text',
                                }}
                              >
                                {team._id}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            )}

            <Paper
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              sx={{
                border: 2,
                borderStyle: 'dashed',
                borderColor: dragOver ? 'primary.main' : 'grey.400',
                bgcolor: dragOver ? 'action.hover' : 'background.default',
                p: 6,
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <UploadFileIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Drag and drop CSV file here
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                or
              </Typography>
              <Button
                variant="contained"
                component="label"
              >
                Choose File
                <input
                  type="file"
                  hidden
                  accept=".csv"
                  onChange={handleFileSelect}
                />
              </Button>
              {selectedFile && (
                <Typography variant="body2" sx={{ mt: 2, color: 'success.main' }}>
                  Selected: {selectedFile.name}
                </Typography>
              )}
              <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                Max file size: 5MB (~10,000 players)
              </Typography>
            </Paper>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleUploadAndValidate}
                disabled={!selectedFile}
              >
                Validate & Continue
              </Button>
            </Box>
          </Box>
        );

      case 1:
        if (!validationResult) return null;
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Step 2: Review Import
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4">{validationResult.totalRows}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Rows
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" color="success.main">
                      {validationResult.validRows}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Valid
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" color="error.main">
                      {validationResult.errors?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Errors
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" color="primary.main">
                      {validationResult.validRows - excludedRows.size}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Ready to Import
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {validationResult.errors && validationResult.errors.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {validationResult.errors.length} row(s) have errors. These will be
                automatically excluded from the import.
              </Alert>
            )}

            <TableContainer component={Paper} sx={{ mb: 3, maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">Include</TableCell>
                    <TableCell>Row</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Errors</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {validationResult.errors && validationResult.errors.length > 0 ? (
                    validationResult.errors.map((error, idx) => (
                      <TableRow key={idx}>
                        <TableCell padding="checkbox">
                          <Checkbox disabled checked={false} />
                        </TableCell>
                        <TableCell>{error.row}</TableCell>
                        <TableCell>{error.email}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>
                          <Chip
                            icon={<ErrorIcon />}
                            label="Error"
                            color="error"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="error">
                            {error.errors.join(', ')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                          All rows are valid! Ready to import {validationResult.validRows}{' '}
                          players.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={() => setActiveStep(0)}>Back</Button>
              <Button
                variant="contained"
                onClick={handleStartImport}
                disabled={validationResult.validRows - excludedRows.size === 0}
              >
                Start Import ({validationResult.validRows - excludedRows.size} players)
              </Button>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6" gutterBottom>
              Importing Players...
            </Typography>
            {importProgress && (
              <>
                <LinearProgress
                  variant="determinate"
                  value={
                    (importProgress.processedRows / importProgress.totalRows) * 100
                  }
                  sx={{ my: 3, height: 10, borderRadius: 5 }}
                />
                <Typography variant="body1" gutterBottom>
                  Processing {importProgress.processedRows} of {importProgress.totalRows}{' '}
                  invitations
                </Typography>
                <Grid container spacing={2} sx={{ mt: 2, justifyContent: 'center' }}>
                  <Grid item>
                    <Typography variant="body2" color="success.main">
                      ✓ Successful: {importProgress.successfulRows}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="body2" color="error.main">
                      ✗ Failed: {importProgress.failedRows}
                    </Typography>
                  </Grid>
                </Grid>
              </>
            )}
            <Typography variant="body2" color="textSecondary" sx={{ mt: 3 }}>
              Please don't close this page...
            </Typography>
          </Box>
        );

      case 3:
        if (!importResults) return null;
        return (
          <Box>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                Import Complete!
              </Typography>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={6}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="success.main">
                      {importResults.successfulRows}
                    </Typography>
                    <Typography variant="body1">Successful</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="error.main">
                      {importResults.failedRows}
                    </Typography>
                    <Typography variant="body1">Failed</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Typography variant="body1" paragraph>
              {importResults.successfulRows} players successfully invited to join the club.
              They will receive emails with signup instructions.
            </Typography>

            {importResults.errors && importResults.errors.length > 0 && (
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.lighter' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Failed Invitations ({importResults.errors.length})
                </Typography>
                <TableContainer sx={{ maxHeight: 200 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Row</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Error</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {importResults.errors.map((error, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{error.row}</TableCell>
                          <TableCell>{error.email}</TableCell>
                          <TableCell>
                            <Typography variant="caption" color="error">
                              {error.errors.join(', ')}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              {importResults.errors && importResults.errors.length > 0 && (
                <Button
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadErrors}
                >
                  Download Error Report
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleReset}
              >
                Import More Players
              </Button>
              <Button variant="contained" onClick={handleViewInvitations}>
                View All Invitations
              </Button>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <RequireRole roles={['club_manager', 'head_coach']}>
      <AppLayout>
        <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/clubs/${clubId}/players`)}
            sx={{ mb: 2 }}
          >
            Back to Players
          </Button>

          <Typography variant="h4" gutterBottom>
            Bulk Import Players
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
            Upload a CSV file to invite multiple players at once
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Paper sx={{ p: 3, mb: 3 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {renderStepContent()}
          </Paper>
        </Container>
      </AppLayout>
    </RequireRole>
  );
};

export default BulkImportPlayers;
