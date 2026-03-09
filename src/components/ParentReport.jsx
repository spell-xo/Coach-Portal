import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Stack,
  Paper,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  Tooltip,
} from '@mui/material';
import {
  Email,
  Print,
  ContentCopy,
  Download,
  Share,
  CheckCircle,
  Star,
  TrendingUp,
  Home,
  EmojiEvents,
  FitnessCenter,
  School,
  Favorite,
  SentimentVerySatisfied,
  Close,
  Translate,
  Language,
} from '@mui/icons-material';
import parentReportService from '../services/parentReportService';
import aiReportService from '../services/aiReportService';
import pdfExportUtil from '../utils/pdfExportUtil';

const ParentReport = ({ playerId, playerInfo }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportStyle, setReportStyle] = useState('encouraging'); // encouraging, balanced, detailed
  const [language, setLanguage] = useState('en'); // en, es, fr
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef(null);
  const [emailForm, setEmailForm] = useState({
    to: playerInfo?.parentEmail || '',
    subject: '',
    includeVideo: true,
  });

  useEffect(() => {
    loadReport();
  }, [playerId, reportStyle, language]);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      // First get the AI report
      const aiReport = await aiReportService.generatePlayerReport(playerId);

      // Then generate parent-friendly version
      const parentReport = await parentReportService.generateParentReport(
        aiReport,
        {
          name: playerInfo?.name || 'Player',
          parentName: playerInfo?.parentName || 'Parent',
          coachName: playerInfo?.coachName || 'Your Coach',
        },
        {
          style: reportStyle,
          language: language,
          includeVideoHighlights: true,
        }
      );

      setReport(parentReport);
      setEmailForm(prev => ({
        ...prev,
        subject: parentReport.content.subject,
      }));
    } catch (err) {
      setError(err.message || 'Failed to generate parent report');
      console.error('Error loading parent report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStyleChange = (event, newStyle) => {
    if (newStyle !== null) {
      setReportStyle(newStyle);
    }
  };

  const handleLanguageChange = (event, newLanguage) => {
    if (newLanguage !== null) {
      setLanguage(newLanguage);
    }
  };

  const handleCopyToClipboard = () => {
    const reportText = convertReportToText(report.content);
    navigator.clipboard.writeText(reportText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmailDialogOpen = () => {
    setEmailDialogOpen(true);
  };

  const handleEmailDialogClose = () => {
    setEmailDialogOpen(false);
  };

  const handleSendEmail = () => {
    // In production, this would call an API endpoint to send the email
    console.log('Sending email to:', emailForm.to);
    console.log('Subject:', emailForm.subject);
    alert(`Email sent to ${emailForm.to}!\n(This is a demo - in production, this would actually send the email)`);
    handleEmailDialogClose();
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || exporting) return;

    setExporting(true);
    try {
      await pdfExportUtil.exportParentReport(
        reportRef.current,
        playerInfo?.name || 'Player',
        {
          onProgress: (message) => console.log('PDF Export:', message),
        }
      );
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const convertReportToText = (content) => {
    // Convert report to plain text for copying
    let text = `${content.subject}\n\n`;
    text += `${content.greeting}\n\n`;

    if (content.opening) {
      text += `${content.opening.text}\n\n`;
    }

    // Add more sections...
    return text;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
        <CircularProgress size={60} />
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Preparing parent-friendly report...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
        <Button size="small" onClick={loadReport} sx={{ ml: 2 }}>
          Try Again
        </Button>
      </Alert>
    );
  }

  if (!report) {
    return null;
  }

  const { content, metadata } = report;

  return (
    <Box>
      {/* Header with actions */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight={600}>
            Parent Report Preview
          </Typography>

          <Stack direction="row" spacing={1}>
            <Tooltip title="Copy to clipboard">
              <IconButton onClick={handleCopyToClipboard} color={copySuccess ? 'success' : 'default'}>
                {copySuccess ? <CheckCircle /> : <ContentCopy />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Print report">
              <IconButton onClick={handlePrint}>
                <Print />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export to PDF">
              <IconButton onClick={handleExportPDF} disabled={exporting}>
                {exporting ? <CircularProgress size={24} /> : <Download />}
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<Email />}
              onClick={handleEmailDialogOpen}
            >
              Send Email
            </Button>
          </Stack>
        </Box>

        {/* Style and Language selectors */}
        <Box sx={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Report Style:
            </Typography>
            <ToggleButtonGroup
              value={reportStyle}
              exclusive
              onChange={handleStyleChange}
              size="small"
            >
              <ToggleButton value="encouraging">
                <SentimentVerySatisfied sx={{ mr: 1 }} fontSize="small" />
                Encouraging
              </ToggleButton>
              <ToggleButton value="balanced">
                <School sx={{ mr: 1 }} fontSize="small" />
                Balanced
              </ToggleButton>
              <ToggleButton value="detailed">
                <FitnessCenter sx={{ mr: 1 }} fontSize="small" />
                Detailed
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              <Translate sx={{ mr: 0.5, fontSize: 18, verticalAlign: 'middle' }} />
              Language:
            </Typography>
            <ToggleButtonGroup
              value={language}
              exclusive
              onChange={handleLanguageChange}
              size="small"
            >
              <ToggleButton value="en">
                <Tooltip title="English">
                  <span>🇬🇧 English</span>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="es">
                <Tooltip title="Español">
                  <span>🇪🇸 Español</span>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="fr">
                <Tooltip title="Français">
                  <span>🇫🇷 Français</span>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Box>

      {/* Report content */}
      <Paper ref={reportRef} sx={{ p: 4, maxWidth: 800, mx: 'auto', bgcolor: 'white' }} elevation={3}>
        {reportStyle === 'encouraging' && (
          <EncouragingReportView content={content} />
        )}
        {reportStyle === 'balanced' && (
          <BalancedReportView content={content} />
        )}
        {reportStyle === 'detailed' && (
          <DetailedReportView content={content} />
        )}

        <Divider sx={{ my: 4 }} />

        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Generated on {new Date(metadata.generatedAt).toLocaleDateString()}
        </Typography>
      </Paper>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onClose={handleEmailDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Send Parent Report via Email
          <IconButton
            onClick={handleEmailDialogClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Parent Email"
              fullWidth
              value={emailForm.to}
              onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
              placeholder="parent@example.com"
              type="email"
              required
            />
            <TextField
              label="Subject"
              fullWidth
              value={emailForm.subject}
              onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
            />
            <Alert severity="info">
              The report will be sent as formatted HTML email with all styling preserved.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEmailDialogClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSendEmail}
            disabled={!emailForm.to}
            startIcon={<Email />}
          >
            Send Email
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Encouraging style view
const EncouragingReportView = ({ content }) => {
  if (!content) return null;

  return (
    <Box>
      {/* Subject line */}
      <Typography variant="h4" gutterBottom fontWeight={700} color="primary">
        {content.subject}
      </Typography>

      {/* Greeting */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        {content.greeting}
      </Typography>

      {/* Opening */}
      {content.opening?.text && (
        <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
          {content.opening.text}
        </Typography>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Week Summary */}
      {content.weekSummary && (
        <Box sx={{ mb: 4, p: 3, bgcolor: 'primary.50', borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom fontWeight={600}>
            {content.weekSummary.emoji} {content.weekSummary.headline}
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            {content.weekSummary.text}
          </Typography>
        </Box>
      )}

      {/* Highlights */}
      {content.highlights && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight={600} color="success.main">
            {content.highlights.title}
          </Typography>
          <Stack spacing={2}>
            {content.highlights.items?.map((item, index) => (
          <Card key={index} sx={{ bgcolor: 'success.50', border: '2px solid', borderColor: 'success.200' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h4">{item.emoji}</Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {item.skill}
                  </Typography>
                </Box>
                <Chip label={item.score} color="success" sx={{ fontWeight: 700 }} />
              </Box>
              <Typography variant="body2" paragraph>
                {item.description}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontStyle="italic">
                💡 {item.parentFriendlyExplanation}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
        </Box>
      )}

    {/* Growth Area */}
    {content.growthArea && (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom fontWeight={600} color="warning.main">
          {content.growthArea.title}
        </Typography>
        <Typography variant="body1" paragraph>
          {content.growthArea.introduction}
        </Typography>
        {content.growthArea.primaryFocus && (
          <Card sx={{ bgcolor: 'warning.50' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {content.growthArea.primaryFocus.area}
              </Typography>
              <Typography variant="body2" paragraph>
                {content.growthArea.primaryFocus.description}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Chip label={`Current: ${content.growthArea.primaryFocus.currentLevel}`} size="small" />
                <Typography>→</Typography>
                <Chip label={`Target: ${content.growthArea.primaryFocus.targetLevel}`} color="warning" size="small" />
              </Box>
              <Typography variant="body2" fontWeight={600} color="success.main">
                {content.growthArea.primaryFocus.encouragement}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    )}

    {/* Parent Tips */}
    {content.parentTips && (
      <Box sx={{ mb: 4, p: 3, bgcolor: 'info.50', borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom fontWeight={600}>
          {content.parentTips.title}
        </Typography>
        <Typography variant="body1" paragraph>
          {content.parentTips.introduction}
        </Typography>

        <Stack spacing={2}>
          {content.parentTips.activities?.map((activity, index) => (
          <Paper key={index} sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {activity.activity}
            </Typography>
            <Typography variant="body2" paragraph>
              {activity.description}
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  ⏱️ Duration: {activity.duration}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  🎒 Equipment: {activity.equipment}
                </Typography>
              </Grid>
            </Grid>
            <Box sx={{ mt: 1, p: 1, bgcolor: 'success.50', borderRadius: 1 }}>
              <Typography variant="caption" fontWeight={600}>
                🎮 Fun Factor: {activity.funFactor}
              </Typography>
            </Box>
          </Paper>
          ))}
        </Stack>

        <Typography variant="body2" sx={{ mt: 2 }} fontStyle="italic" color="text.secondary">
          💡 {content.parentTips.duration}
        </Typography>
      </Box>
    )}

    {/* Quick Stats */}
    {content.quickStats && (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          {content.quickStats.title}
        </Typography>
        <Grid container spacing={2}>
          {content.quickStats.stats?.map((stat, index) => (
          <Grid item xs={6} md={3} key={index}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="h4">{stat.emoji}</Typography>
              <Typography variant="h6" fontWeight={600}>
                {stat.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stat.label}
              </Typography>
            </Paper>
          </Grid>
          ))}
        </Grid>
      </Box>
    )}

    {/* Video Section */}
    {content.videoSection && (
      <Box sx={{ mb: 4, p: 3, bgcolor: 'grey.100', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          {content.videoSection.title}
        </Typography>
        <Typography variant="body2" paragraph>
          {content.videoSection.description}
        </Typography>
        <List dense>
          {content.videoSection.highlightMoments?.map((moment, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <Star color="primary" />
              </ListItemIcon>
              <ListItemText primary={moment} />
            </ListItem>
          ))}
        </List>
        <Button variant="outlined" startIcon={<Star />} sx={{ mt: 1 }}>
          View Highlights Video
        </Button>
      </Box>
    )}

    {/* Week Ahead */}
    {content.weekAhead && (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          {content.weekAhead.title}
        </Typography>
        <List>
          {content.weekAhead.goals?.map((goal, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              <CheckCircle color="primary" />
            </ListItemIcon>
            <ListItemText primary={goal} />
          </ListItem>
          ))}
        </List>
        <Typography variant="body1" fontWeight={600} color="primary" sx={{ mt: 2 }}>
          {content.weekAhead.encouragement}
        </Typography>
      </Box>
    )}

    {/* Closing */}
    {content.closing && (
      <Box sx={{ mt: 4, pt: 3, borderTop: '2px solid', borderColor: 'divider' }}>
        <Typography variant="body1" paragraph>
          {content.closing.message}
        </Typography>
        <Typography variant="body2" paragraph color="text.secondary">
          {content.closing.callToAction}
        </Typography>
        <Typography variant="body1" sx={{ mt: 3, whiteSpace: 'pre-line' }}>
          {content.closing.signature}
        </Typography>
      </Box>
    )}
    </Box>
  );
};

// Balanced style view
const BalancedReportView = ({ content }) => {
  // Add defensive checks for missing data
  if (!content) {
    return (
      <Alert severity="error">
        Unable to load balanced report content. Please try a different report style.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        {content.subject || 'Training Update'}
      </Typography>
      <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
        {content.greeting || 'Dear Parent/Guardian,'}
      </Typography>
      <Typography variant="body1" paragraph>
        {content.opening?.text || 'Thank you for your continued support.'}
      </Typography>

      <Divider sx={{ my: 3 }} />

      {/* Performance Overview */}
      {content.performanceOverview && (
        <>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            {content.performanceOverview.title || 'Performance Summary'}
          </Typography>
          <Typography variant="body2" paragraph>
            {content.performanceOverview.description || 'Performance data is being compiled.'}
          </Typography>
        </>
      )}

      {/* Strengths & Development - Side by side */}
      <Grid container spacing={3} sx={{ my: 2 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom fontWeight={600} color="success.main">
            {content.strengths?.title || 'Key Strengths'}
          </Typography>
          <Stack spacing={1}>
            {content.strengths?.items && content.strengths.items.length > 0 ? (
              content.strengths.items.map((item, index) => (
                <Paper key={index} sx={{ p: 2, bgcolor: 'success.50' }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {item.area || 'Skill'} - {item.performance || 'Good'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description || 'Showing progress in this area.'}
                  </Typography>
                </Paper>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                Strength data is being compiled.
              </Typography>
            )}
          </Stack>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom fontWeight={600} color="warning.main">
            {content.developmentAreas?.title || 'Areas for Development'}
          </Typography>
          <Stack spacing={1}>
            {content.developmentAreas?.items && content.developmentAreas.items.length > 0 ? (
              content.developmentAreas.items.map((item, index) => (
                <Paper key={index} sx={{ p: 2, bgcolor: 'warning.50' }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {item.area || 'Focus Area'}
                  </Typography>
                  <Typography variant="caption" display="block" gutterBottom>
                    {item.currentLabel || 'Current'}: {item.current || 'N/A'} → {item.targetLabel || 'Target'}: {item.target || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description || 'Working on improvement.'}
                  </Typography>
                </Paper>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                Development areas are being compiled.
              </Typography>
            )}
          </Stack>
        </Grid>
      </Grid>

      {/* Action Plan */}
      {content.actionPlan && content.actionPlan.immediate && content.actionPlan.immediate.length > 0 && (
        <Box sx={{ my: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            {content.actionPlan.title || 'Recommended Action Plan'}
          </Typography>
          <List>
            {content.actionPlan.immediate.map((item, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <TrendingUp color="primary" />
                </ListItemIcon>
                <ListItemText primary={item} />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Parent Support */}
      {content.parentEngagement && content.parentEngagement.suggestions && content.parentEngagement.suggestions.length > 0 && (
        <Box sx={{ p: 3, bgcolor: 'info.50', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            {content.parentEngagement.title || 'How Parents Can Support'}
          </Typography>
          <Stack spacing={2}>
            {content.parentEngagement.suggestions.map((activity, index) => (
              <Box key={index}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {activity.activity || 'Practice Activity'}
                </Typography>
                <Typography variant="body2">{activity.description || 'Details coming soon.'}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Closing */}
      {content.closing && (
        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body1" paragraph>
            {content.closing.message || 'Thank you for your support.'}
          </Typography>
          <Typography variant="body1" sx={{ mt: 2, whiteSpace: 'pre-line' }}>
            {content.closing.signature || 'Best regards,\nYour Coach'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// Detailed style view
const DetailedReportView = ({ content }) => {
  // Add defensive checks for missing data
  if (!content) {
    return (
      <Alert severity="error">
        Unable to load detailed report content. Please try a different report style.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight={700}>
        {content.subject || 'Comprehensive Performance Report'}
      </Typography>
      <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
        {content.greeting || 'Dear Parent/Guardian,'}
      </Typography>

      <Divider sx={{ my: 3 }} />

      {/* Executive Summary */}
      {content.executiveSummary && (
        <Box sx={{ mb: 3, p: 3, bgcolor: 'primary.50', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            {content.executiveSummary.title || 'Executive Summary'}
          </Typography>
          <Typography variant="body2" paragraph>
            {content.executiveSummary.text || 'Performance summary is being compiled.'}
          </Typography>
          {content.executiveSummary.overallRating && (
            <Typography variant="h4" fontWeight={700} color="primary">
              {content.executiveSummary.overallRating}/100
            </Typography>
          )}
          {content.executiveSummary.keyTakeaways && content.executiveSummary.keyTakeaways.length > 0 && (
            <List dense>
              {content.executiveSummary.keyTakeaways.map((item, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <CheckCircle fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      )}

      {/* Detailed sections... */}
      <Typography variant="body2" color="text.secondary" paragraph>
        Full detailed report with all metrics, analysis, and recommendations...
      </Typography>

      {/* Closing */}
      {content.closing && (
        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body1" paragraph>
            {content.closing.message || 'Thank you for your support.'}
          </Typography>
          {content.closing.followUp && (
            <Typography variant="body2" paragraph color="text.secondary">
              {content.closing.followUp}
            </Typography>
          )}
          <Typography variant="body1" sx={{ mt: 2, whiteSpace: 'pre-line' }}>
            {content.closing.signature || 'Best regards,\nYour Coach'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ParentReport;
