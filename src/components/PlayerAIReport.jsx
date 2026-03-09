import React, { useState, useEffect, useRef } from "react";
import { Box, Card, CardContent, Typography, Button, CircularProgress, Alert, Grid, Chip, LinearProgress, Paper, Divider, List, ListItem, ListItemIcon, ListItemText, ToggleButton, ToggleButtonGroup, Accordion, AccordionSummary, AccordionDetails, Stack, Avatar, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from "@mui/material";
import { TrendingUp, TrendingDown, TrendingFlat, Star, Warning, CheckCircle, PlayArrow, ExpandMore, ViewModule, ViewList, ViewComfy, Timeline, FitnessCenter, EmojiEvents, School, Download, Refresh, Save } from "@mui/icons-material";
import playerService from "../api/playerService";
import ratingsService from "../api/ratingsService";
import comparisonService from "../services/comparisonService";
import PlayerPeerComparison from "./PlayerPeerComparison";
import PlayerLevelBadge from "./PlayerLevelBadge";
import PlayerBadgeHeader from "./PlayerBadgeHeader";
import pdfExportUtil from "../utils/pdfExportUtil";
import aimLogoFull from "../assets/images/aim-logo-full.svg";
import "../styles/reportPrint.css";
import BadgePlayer from "./player/BadgePlayer";

const PlayerAIReport = ({ playerId, teamId, playerName = "Player" }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("comprehensive"); // comprehensive, compact, dashboard
  const [exporting, setExporting] = useState(false);
  const [playerRatings, setPlayerRatings] = useState(null);
  const [levelData, setLevelData] = useState(null);
  const [badgeData, setBadgeData] = useState(null);
  const reportRef = useRef(null);

  useEffect(() => {
    loadReport();
    loadPlayerRatings();
    loadLevelData();
    loadBadgeData();
  }, [playerId]);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try to load existing report from database
      const response = await playerService.getPlayerReport(playerId);
      // Unwrap the API response {success: true, data: {...}}
      const existingReport = response.data || response;

      if (existingReport) {
        setReport(existingReport);
      } else {
        // No existing report, user needs to generate one
        setReport(null);
      }
    } catch (err) {
      // If 404, report doesn't exist yet - this is not an error
      if (err.response?.status === 404) {
        setReport(null);
      } else {
        setError(err.message || "Failed to load report");
        console.error("Error loading report:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    setError(null);
    try {
      // Generate new report via backend API
      const response = await playerService.generatePlayerReport(playerId);
      // Unwrap the API response {success: true, data: {...}}
      const reportData = response.data || response;
      setReport(reportData);
    } catch (err) {
      setError(err.message || "Failed to generate report");
      console.error("Error generating report:", err);
    } finally {
      setGenerating(false);
    }
  };

  const loadPlayerRatings = async () => {
    try {
      const response = await ratingsService.getPlayerRating(playerId);
      if (response.success && response.data) {
        setPlayerRatings(response.data);
      }
    } catch (err) {
      // Silently fail if no ratings exist (404 is expected if coach hasn't rated yet)
      console.log("No player ratings found");
    }
  };

  const loadLevelData = async () => {
    try {
      const response = await playerService.getPlayerLevelData(playerId);
      if (response.success && response.data) {
        setLevelData(response.data);
      }
    } catch (err) {
      // Silently fail if level data doesn't exist
      console.log("No player level data found:", err);
    }
  };

  const loadBadgeData = async () => {
    try {
      const response = await playerService.getPlayerBadge(playerId);
      if (response.success && response.data) {
        setBadgeData(response.data);
      }
    } catch (err) {
      // Silently fail if badge data doesn't exist
      console.log("No player badge data found:", err);
    }
  };

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || exporting) return;

    setExporting(true);
    try {
      await pdfExportUtil.exportPlayerReport(reportRef.current, playerName, {
        onProgress: (message) => console.log("PDF Export:", message),
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "IMPROVING":
        return <TrendingUp color="success" />;
      case "DECLINING":
        return <TrendingDown color="error" />;
      default:
        return <TrendingFlat color="action" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH":
        return "error";
      case "MEDIUM":
        return "warning";
      default:
        return "info";
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8 }}>
        <CircularProgress size={60} />
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mt: 2 }}>
          Loading player report...
        </Typography>
      </Box>
    );
  }

  if (generating) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8 }}>
        <CircularProgress size={60} />
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mt: 2 }}>
          Generating comprehensive performance report...
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1 }}>
          Analyzing all player drills and generating AI insights...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        sx={{ mb: 3 }}>
        {error}
        <Button
          size="small"
          onClick={loadReport}
          sx={{ ml: 2 }}>
          Try Again
        </Button>
      </Alert>
    );
  }

  if (!report) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography
          variant="h6"
          gutterBottom>
          No performance report available
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3 }}>
          Generate a comprehensive AI-powered analysis of this player's performance
        </Typography>
        <Button
          variant="contained"
          onClick={handleGenerateReport}
          size="large">
          Generate Performance Report
        </Button>
      </Box>
    );
  }

  // Check if report indicates no drills available
  if (report && report.reportData?.noDrills) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Alert
          severity="info"
          sx={{ mb: 3, maxWidth: 600, mx: "auto" }}>
          <Typography
            variant="h6"
            gutterBottom>
            {report.reportData.message}
          </Typography>
          {report.totalDrills > 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1 }}>
              There are drills uploaded but they are still being processed. Please check back in a few minutes.
            </Typography>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1 }}>
              Once the player uploads and processes some drills, you'll be able to generate a comprehensive performance report here.
            </Typography>
          )}
        </Alert>
        <Button
          variant="outlined"
          onClick={loadReport}
          startIcon={<Refresh />}>
          Refresh
        </Button>
      </Box>
    );
  }

  const aiSummary = report.reportData;

  // Additional safety check - if reportData is missing required properties, show error
  if (!aiSummary || !aiSummary.keyMetrics || !aiSummary.performanceTrends) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Alert
          severity="warning"
          sx={{ mb: 3, maxWidth: 600, mx: "auto" }}>
          <Typography
            variant="h6"
            gutterBottom>
            Unable to display report
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary">
            The report data is incomplete or malformed. Please regenerate the report.
          </Typography>
        </Alert>
        <Button
          variant="contained"
          onClick={handleGenerateReport}
          startIcon={<Refresh />}>
          Regenerate Report
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with Actions */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Typography
          variant="h5"
          fontWeight={600}>
          AI Performance Analysis
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleGenerateReport}
            disabled={generating}>
            Regenerate Report
          </Button>
          <Button
            variant="outlined"
            startIcon={exporting ? <CircularProgress size={16} /> : <Download />}
            onClick={handleExportPDF}
            disabled={exporting}>
            {exporting ? "Exporting..." : "Export PDF"}
          </Button>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small">
            <ToggleButton value="comprehensive">
              <ViewComfy
                sx={{ mr: 1 }}
                fontSize="small"
              />
              Comprehensive
            </ToggleButton>
            <ToggleButton value="compact">
              <ViewList
                sx={{ mr: 1 }}
                fontSize="small"
              />
              Compact
            </ToggleButton>
            <ToggleButton value="dashboard">
              <ViewModule
                sx={{ mr: 1 }}
                fontSize="small"
              />
              Dashboard
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Report Content Wrapper with ref for PDF export */}
      <Box
        ref={reportRef}
        className="report-container">
        {badgeData && (
          <BadgePlayer
            report={report}
            badgeData={badgeData}
          />
        )}

        {/* Render based on selected view mode */}
        {viewMode === "comprehensive" && (
          <ComprehensiveView
            aiSummary={aiSummary}
            report={report}
            getTrendIcon={getTrendIcon}
            getPriorityColor={getPriorityColor}
          />
        )}
        {viewMode === "compact" && (
          <CompactView
            aiSummary={aiSummary}
            getTrendIcon={getTrendIcon}
            getPriorityColor={getPriorityColor}
          />
        )}
        {viewMode === "dashboard" && (
          <DashboardView
            aiSummary={aiSummary}
            getTrendIcon={getTrendIcon}
            getPriorityColor={getPriorityColor}
          />
        )}

        {/* Peer Comparison Section */}
        {report.peerComparison && (
          <Box sx={{ mt: 4 }}>
            <Divider sx={{ mb: 4 }} />
            <PlayerPeerComparison peerComparison={report.peerComparison} />
          </Box>
        )}

        {/* Coach Ratings Section */}
        {playerRatings && (
          <Box sx={{ mt: 4 }}>
            <Divider sx={{ mb: 3 }}>
              <Chip
                label="COACH RATINGS"
                sx={{ bgcolor: "#1e3a8a", color: "white", fontWeight: "bold", px: 2 }}
              />
            </Divider>
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Grid
                  container
                  spacing={3}>
                  {["attitude", "teamplay", "respect", "ambition", "effort", "humility"].map((trait) => {
                    const value = playerRatings[trait];
                    if (value === null || value === undefined) return null;

                    const getColor = (score) => {
                      if (score >= 7) return "#10b981"; // Green
                      if (score >= 4) return "#3b82f6"; // Blue
                      return "#ef4444"; // Red
                    };

                    const traitLabels = {
                      attitude: "Attitude",
                      teamplay: "Team Play",
                      respect: "Respect",
                      ambition: "Ambition",
                      effort: "Effort",
                      humility: "Humility",
                    };

                    return (
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={4}
                        key={trait}>
                        <Box sx={{ p: 2 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                            <Typography
                              variant="subtitle2"
                              fontWeight={600}>
                              {traitLabels[trait]}
                            </Typography>
                            <Chip
                              label={value.toFixed(1)}
                              size="small"
                              sx={{
                                backgroundColor: getColor(value),
                                color: "white",
                                fontWeight: 600,
                                minWidth: 50,
                              }}
                            />
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={(value / 10) * 100}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: "#e5e7eb",
                              "& .MuiLinearProgress-bar": {
                                bgcolor: getColor(value),
                                borderRadius: 4,
                              },
                            }}
                          />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 0.5, display: "block" }}>
                            {value.toFixed(1)} out of 10
                          </Typography>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
                {playerRatings.comments && (
                  <Box sx={{ mt: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 2 }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      gutterBottom>
                      Coach Comments:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                      {playerRatings.comments}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Metadata */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 3, textAlign: "center" }}>
          Report generated on {new Date(report.generatedAt).toLocaleString()} • {report.generatedBy || "CLAUDE_SONNET_3_5"} • Version {report.version || "2.0.0"}
        </Typography>
      </Box>
      {/* End of Report Content Wrapper */}
    </Box>
  );
};

// Comprehensive View - Detailed, card-based layout
const ComprehensiveView = ({ aiSummary, report, getTrendIcon, getPriorityColor }) => (
  <Box>
    {/* Executive Summary */}
    <Card sx={{ mb: 3, bgcolor: "primary.50", border: "2px solid", borderColor: "primary.main", pageBreakInside: "avoid" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
            <Star />
          </Avatar>
          <Typography
            variant="h6"
            fontWeight={600}>
            Executive Summary
          </Typography>
        </Box>
        <Typography
          variant="body1"
          sx={{ lineHeight: 1.8, mb: 3 }}>
          {aiSummary.executiveSummary}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography
            variant="h3"
            color="primary"
            fontWeight={700}>
            {aiSummary.overallPerformanceRating}
          </Typography>
          <Typography
            variant="body1"
            sx={{ ml: 1 }}>
            / 100 Overall Rating
          </Typography>
        </Box>
      </CardContent>
    </Card>

    {/* Key Metrics Grid */}
    <Grid
      container
      spacing={2}
      sx={{ mb: 3 }}>
      {Object.entries(aiSummary.keyMetrics).map(([key, value]) => (
        <Grid
          item
          xs={6}
          sm={4}
          md={3}
          key={key}>
          <Card>
            <CardContent>
              <Typography
                variant="caption"
                color="text.secondary"
                textTransform="capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </Typography>
              <Typography
                variant="h5"
                fontWeight={600}
                sx={{ mt: 1 }}>
                {typeof value === "number" ? value.toFixed(1) : value}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={typeof value === "number" ? value : 0}
                sx={{ mt: 1, height: 6, borderRadius: 1 }}
                color={value >= 70 ? "success" : value >= 50 ? "warning" : "error"}
              />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>

    {/* Key Metrics Dashboard */}
    <Card sx={{ mb: 3, pageBreakInside: "avoid" }}>
      <CardContent>
        <Typography
          variant="h6"
          fontWeight={600}
          gutterBottom>
          📊 Key Performance Metrics
        </Typography>
        <Grid
          container
          spacing={2}>
          <Grid
            item
            xs={12}
            sm={6}
            md={3}>
            <Paper sx={{ p: 2, textAlign: "center", bgcolor: "primary.50" }}>
              <Typography
                variant="h4"
                fontWeight={700}
                color="primary">
                {report.totalDrills}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary">
                Total Drills
              </Typography>
            </Paper>
          </Grid>
          <Grid
            item
            xs={12}
            sm={6}
            md={3}>
            <Paper sx={{ p: 2, textAlign: "center", bgcolor: "success.50" }}>
              <Typography
                variant="h4"
                fontWeight={700}
                color="success.main">
                {Math.round(aiSummary.keyMetrics?.overallScore || 0)}%
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary">
                Average Score
              </Typography>
            </Paper>
          </Grid>
          <Grid
            item
            xs={12}
            sm={6}
            md={3}>
            <Paper sx={{ p: 2, textAlign: "center", bgcolor: "warning.50" }}>
              <Typography
                variant="h4"
                fontWeight={700}
                color="warning.main">
                {report.drillPerformanceHistory && report.drillPerformanceHistory.length > 0 ? Math.max(...report.drillPerformanceHistory.map((d) => d.overallScore || 0)).toFixed(0) : "0"}%
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary">
                Best Score
              </Typography>
            </Paper>
          </Grid>
          <Grid
            item
            xs={12}
            sm={6}
            md={3}>
            <Paper sx={{ p: 2, textAlign: "center", bgcolor: "info.50" }}>
              <Typography
                variant="h4"
                fontWeight={700}
                color="info.main">
                {report.rawData?.analysisData?.totalActivities || 0}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary">
                Total Activities
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>

    {/* Detailed Drills Performance Table */}
    {report.drillPerformanceHistory && report.drillPerformanceHistory.length > 0 && (
      <Card sx={{ mb: 3, pageBreakInside: "avoid" }}>
        <CardContent>
          <Typography
            variant="h6"
            fontWeight={600}
            gutterBottom>
            📋 Drills Performance History
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}>
            Detailed performance across all completed drills
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Date</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Drill Type</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Overall Score</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Top Categories</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Activities</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Status</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.drillPerformanceHistory.map((drill, index) => {
                  const prevDrill = report.drillPerformanceHistory[index + 1];
                  const trend = prevDrill ? drill.overallScore - prevDrill.overallScore : 0;

                  return (
                    <TableRow
                      key={drill.drillId}
                      hover>
                      <TableCell>
                        <Typography variant="body2">{new Date(drill.date).toLocaleDateString()}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={500}>
                          {drill.drillType}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                          <Chip
                            label={`${Math.round(drill.overallScore)}%`}
                            size="small"
                            color={drill.overallScore >= 75 ? "success" : drill.overallScore >= 50 ? "warning" : "error"}
                          />
                          {trend !== 0 && (
                            <Tooltip title={`${trend > 0 ? "+" : ""}${trend.toFixed(1)}% vs previous`}>
                              {trend > 0 ? (
                                <TrendingUp
                                  fontSize="small"
                                  color="success"
                                />
                              ) : (
                                <TrendingDown
                                  fontSize="small"
                                  color="error"
                                />
                              )}
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                          {drill.topCategories &&
                            drill.topCategories.slice(0, 3).map((cat, i) => (
                              <Chip
                                key={i}
                                label={`${cat.name}: ${Math.round(cat.score)}%`}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{drill.activityCount}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={drill.status}
                          size="small"
                          color={drill.status === "ANALYSED" ? "success" : "default"}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    )}

    {/* Performance by Category */}
    {report.categoryPerformanceSummary && report.categoryPerformanceSummary.length > 0 && (
      <Card sx={{ mb: 3, pageBreakInside: "avoid" }}>
        <CardContent>
          <Typography
            variant="h6"
            fontWeight={600}
            gutterBottom>
            Performance by Category
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3 }}>
            Average scores across all categories - strengths highlighted in green, areas needing improvement in red
          </Typography>
          <Grid
            container
            spacing={2}>
            {report.categoryPerformanceSummary.map((cat, index) => {
              const isStrength = cat.averageScore >= 75;
              const isWeakness = cat.averageScore < 50;
              const color = isStrength ? "success" : isWeakness ? "error" : "warning";

              return (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  key={index}>
                  <Paper
                    sx={{
                      p: 2,
                      border: "2px solid",
                      borderColor: isStrength ? "success.main" : isWeakness ? "error.main" : "warning.light",
                      bgcolor: isStrength ? "success.50" : isWeakness ? "error.50" : "grey.50",
                    }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 1 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}>
                        {cat.category}
                      </Typography>
                      <Chip
                        label={`${Math.round(cat.averageScore)}%`}
                        size="small"
                        color={color}
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={cat.averageScore}
                      color={color}
                      sx={{ height: 8, borderRadius: 1, mb: 1 }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary">
                      {cat.totalDrills} drill{cat.totalDrills !== 1 ? "s" : ""} completed
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>
    )}

    {/* Activity-Level Breakdown */}
    {report.rawData?.analysisData && (
      <Card sx={{ mb: 3, pageBreakInside: "avoid" }}>
        <CardContent>
          <Typography
            variant="h6"
            fontWeight={600}
            gutterBottom>
            🎯 Activity Breakdown Across All Drills
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3 }}>
            Total activities completed by type
          </Typography>
          <Grid
            container
            spacing={3}>
            <Grid
              item
              xs={12}
              md={6}>
              <Paper sx={{ p: 2, bgcolor: "success.50" }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  gutterBottom>
                  Passing Activities
                </Typography>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  color="success.main">
                  {report.rawData.analysisData.passingActivities || 0}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={report.rawData.analysisData.totalActivities > 0 ? (report.rawData.analysisData.passingActivities / report.rawData.analysisData.totalActivities) * 100 : 0}
                  color="success"
                  sx={{ mt: 1, height: 6, borderRadius: 1 }}
                />
              </Paper>
            </Grid>
            <Grid
              item
              xs={12}
              md={6}>
              <Paper sx={{ p: 2, bgcolor: "warning.50" }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  gutterBottom>
                  Dribbling Activities
                </Typography>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  color="warning.main">
                  {report.rawData.analysisData.dribblingActivities || 0}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={report.rawData.analysisData.totalActivities > 0 ? (report.rawData.analysisData.dribblingActivities / report.rawData.analysisData.totalActivities) * 100 : 0}
                  color="warning"
                  sx={{ mt: 1, height: 6, borderRadius: 1 }}
                />
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    )}

    {/* Performance Patterns & Trends */}
    {report.drillPerformanceHistory && report.drillPerformanceHistory.length > 1 && (
      <Card sx={{ mb: 3, pageBreakInside: "avoid" }}>
        <CardContent>
          <Typography
            variant="h6"
            fontWeight={600}
            gutterBottom>
            📈 Performance Patterns & Trends
          </Typography>
          <Grid
            container
            spacing={2}>
            <Grid
              item
              xs={12}
              md={4}>
              <Paper sx={{ p: 2, textAlign: "center", bgcolor: "info.50" }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  color="text.secondary">
                  Consistency Rating
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  color="info.main"
                  sx={{ mt: 1 }}>
                  {(() => {
                    const scores = report.drillPerformanceHistory.map((d) => d.overallScore);
                    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
                    const stdDev = Math.sqrt(variance);
                    const consistencyScore = Math.max(0, 100 - stdDev * 2);
                    return Math.round(consistencyScore);
                  })()}
                  %
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary">
                  {report.drillPerformanceHistory.filter((d) => d.overallScore >= 70).length} of {report.drillPerformanceHistory.length} drills above 70%
                </Typography>
              </Paper>
            </Grid>
            <Grid
              item
              xs={12}
              md={4}>
              <Paper sx={{ p: 2, textAlign: "center", bgcolor: "success.50" }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  color="text.secondary">
                  Improvement Trend
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mt: 1 }}>
                  {(() => {
                    const recentDrills = report.drillPerformanceHistory.slice(0, 5);
                    const olderDrills = report.drillPerformanceHistory.slice(5, 10);
                    if (olderDrills.length === 0) return <Typography>N/A</Typography>;
                    const recentAvg = recentDrills.reduce((sum, d) => sum + d.overallScore, 0) / recentDrills.length;
                    const olderAvg = olderDrills.reduce((sum, d) => sum + d.overallScore, 0) / olderDrills.length;
                    const improvement = recentAvg - olderAvg;
                    return (
                      <>
                        {improvement > 0 ? (
                          <TrendingUp
                            color="success"
                            fontSize="large"
                          />
                        ) : improvement < 0 ? (
                          <TrendingDown
                            color="error"
                            fontSize="large"
                          />
                        ) : (
                          <TrendingFlat fontSize="large" />
                        )}
                        <Typography
                          variant="h5"
                          fontWeight={700}
                          color={improvement > 0 ? "success.main" : improvement < 0 ? "error.main" : "text.primary"}
                          sx={{ ml: 1 }}>
                          {improvement > 0 ? "+" : ""}
                          {improvement.toFixed(1)}%
                        </Typography>
                      </>
                    );
                  })()}
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary">
                  Recent 5 vs Previous 5 drills
                </Typography>
              </Paper>
            </Grid>
            <Grid
              item
              xs={12}
              md={4}>
              <Paper sx={{ p: 2, textAlign: "center", bgcolor: "warning.50" }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  color="text.secondary">
                  Best Category
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  color="warning.dark"
                  sx={{ mt: 1 }}>
                  {report.categoryPerformanceSummary && report.categoryPerformanceSummary.length > 0 ? report.categoryPerformanceSummary[0].category : "N/A"}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary">
                  {report.categoryPerformanceSummary && report.categoryPerformanceSummary.length > 0 ? `${Math.round(report.categoryPerformanceSummary[0].averageScore)}% average` : ""}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    )}

    {/* Drill-Specific Insights by Type */}
    {report.rawData?.drillsByType && Object.keys(report.rawData.drillsByType).length > 0 && (
      <Card sx={{ mb: 3, pageBreakInside: "avoid" }}>
        <CardContent>
          <Typography
            variant="h6"
            fontWeight={600}
            gutterBottom>
            🎮 Performance by Drill Type
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3 }}>
            Comparative analysis across different drill types
          </Typography>
          <Grid
            container
            spacing={2}>
            {Object.entries(report.rawData.drillsByType)
              .sort(([, a], [, b]) => b.avgScore - a.avgScore)
              .map(([drillType, data]) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  key={drillType}>
                  <Paper
                    sx={{
                      p: 2,
                      border: "1px solid",
                      borderColor: data.avgScore >= 75 ? "success.main" : data.avgScore >= 50 ? "warning.main" : "error.main",
                      bgcolor: data.avgScore >= 75 ? "success.50" : data.avgScore >= 50 ? "warning.50" : "error.50",
                    }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      gutterBottom>
                      {drillType}
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography
                        variant="h5"
                        fontWeight={700}>
                        {Math.round(data.avgScore)}%
                      </Typography>
                      <Chip
                        label={`${data.count} drill${data.count !== 1 ? "s" : ""}`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={data.avgScore}
                      color={data.avgScore >= 75 ? "success" : data.avgScore >= 50 ? "warning" : "error"}
                      sx={{ height: 6, borderRadius: 1 }}
                    />
                    {data.bestScore && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 1 }}>
                        Best: {Math.round(data.bestScore)}%
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              ))}
          </Grid>
        </CardContent>
      </Card>
    )}

    {/* Strengths */}
    <Card sx={{ mb: 3, pageBreakInside: "avoid" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <EmojiEvents sx={{ color: "success.main", mr: 1 }} />
          <Typography
            variant="h6"
            fontWeight={600}>
            Key Strengths
          </Typography>
        </Box>
        <Grid
          container
          spacing={2}>
          {aiSummary.strengths.map((strength, index) => (
            <Grid
              item
              xs={12}
              md={6}
              key={index}>
              <Paper sx={{ p: 2, height: "100%", bgcolor: "success.50", border: "1px solid", borderColor: "success.200" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 1 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    color="success.dark">
                    {strength.category}
                  </Typography>
                  <Chip
                    label={strength.score}
                    size="small"
                    color="success"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  paragraph>
                  {strength.description}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontStyle="italic">
                  Evidence: {strength.evidence}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>

    {/* Areas for Improvement */}
    <Card sx={{ mb: 3, pageBreakInside: "avoid" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <FitnessCenter sx={{ color: "warning.main", mr: 1 }} />
          <Typography
            variant="h6"
            fontWeight={600}>
            Areas for Development
          </Typography>
        </Box>
        <Stack spacing={2}>
          {aiSummary.areasForImprovement.map((area, index) => (
            <Accordion
              key={index}
              defaultExpanded={index === 0}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                  <Warning
                    color={getPriorityColor(area.priority)}
                    sx={{ mr: 2 }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}>
                      {area.category}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                      <Chip
                        label={area.priority}
                        size="small"
                        color={getPriorityColor(area.priority)}
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary">
                        Current: {area.currentScore} → Target: {area.targetScore}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography
                  variant="body2"
                  paragraph>
                  {area.description}
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  gutterBottom>
                  Specific Issues:
                </Typography>
                <List dense>
                  {(area.specificIssues || []).map((issue, idx) => (
                    <ListItem key={idx}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <PlayArrow fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={issue} />
                    </ListItem>
                  ))}
                </List>
                <Box sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={(area.currentScore / area.targetScore) * 100}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block" }}>
                    Progress to Target: {((area.currentScore / area.targetScore) * 100).toFixed(0)}%
                  </Typography>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </CardContent>
    </Card>

    {/* Performance Trends */}
    <Card sx={{ mb: 3, pageBreakInside: "avoid" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Timeline sx={{ color: "primary.main", mr: 1 }} />
          <Typography
            variant="h6"
            fontWeight={600}>
            Performance Trends
          </Typography>
        </Box>
        <Grid
          container
          spacing={2}>
          {aiSummary.performanceTrends.map((trend, index) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              key={index}>
              <Paper sx={{ p: 2, height: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}>
                    {trend.metric}
                  </Typography>
                  {getTrendIcon(trend.trend)}
                </Box>
                <Typography
                  variant="h6"
                  color={trend.changePercentage > 0 ? "success.main" : trend.changePercentage < 0 ? "error.main" : "text.secondary"}>
                  {trend.changePercentage > 0 ? "+" : ""}
                  {trend.changePercentage.toFixed(1)}%
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}>
                  {trend.observation}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>

    {/* Personalized Recommendations */}
    <Card sx={{ mb: 3, pageBreakInside: "avoid" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <School sx={{ color: "info.main", mr: 1 }} />
          <Typography
            variant="h6"
            fontWeight={600}>
            Personalized Development Plan
          </Typography>
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3 }}>
          Targeted training recommendations based on performance analysis
        </Typography>
        <Stack spacing={2}>
          {aiSummary.personalizedRecommendations.map((rec, index) => (
            <Paper
              key={index}
              sx={{ p: 2, border: "2px solid", borderColor: `${getPriorityColor(rec.priority)}.200` }}>
              <Box sx={{ display: "flex", alignItems: "start", gap: 2 }}>
                <Avatar sx={{ bgcolor: `${getPriorityColor(rec.priority)}.100`, color: `${getPriorityColor(rec.priority)}.main` }}>{index + 1}</Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}>
                      {rec.category}
                    </Typography>
                    <Chip
                      label={rec.priority}
                      size="small"
                      color={getPriorityColor(rec.priority)}
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    paragraph>
                    {rec.recommendation}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  {rec.drillsSuggested && rec.drillsSuggested.length > 0 && (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        color="text.secondary">
                        Suggested Drills:
                      </Typography>
                      {rec?.drillsSuggested?.map((drill, idx) => (
                        <Chip
                          key={idx}
                          label={drill}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  )}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, bgcolor: "grey.50", borderRadius: 1 }}>
                    <CheckCircle
                      fontSize="small"
                      color="success"
                    />
                    <Typography
                      variant="caption"
                      fontWeight={600}>
                      Target: {rec.targetImprovement}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          ))}
        </Stack>
      </CardContent>
    </Card>
  </Box>
);

// Compact View - Simplified, list-based layout
const CompactView = ({ aiSummary, getTrendIcon, getPriorityColor }) => (
  <Box>
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography
          variant="h6"
          gutterBottom>
          Summary
        </Typography>
        <Typography variant="body2">{aiSummary.executiveSummary}</Typography>
        <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
          <Chip
            label={`Overall: ${aiSummary.overallPerformanceRating}/100`}
            color="primary"
          />
          <Chip
            label={`${aiSummary.strengths.length} Strengths`}
            color="success"
          />
          <Chip
            label={`${aiSummary.areasForImprovement.length} Areas to Improve`}
            color="warning"
          />
        </Box>
      </CardContent>
    </Card>

    <Grid
      container
      spacing={2}>
      <Grid
        item
        xs={12}
        md={6}>
        <Card>
          <CardContent>
            <Typography
              variant="h6"
              color="success.main"
              gutterBottom>
              Strengths
            </Typography>
            <List dense>
              {aiSummary.strengths.map((strength, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Star color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={strength.category}
                    secondary={`Score: ${strength.score}`}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
      <Grid
        item
        xs={12}
        md={6}>
        <Card>
          <CardContent>
            <Typography
              variant="h6"
              color="warning.main"
              gutterBottom>
              Focus Areas
            </Typography>
            <List dense>
              {aiSummary.areasForImprovement.map((area, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Warning color={getPriorityColor(area.priority)} />
                  </ListItemIcon>
                  <ListItemText
                    primary={area.category}
                    secondary={`Current: ${area.currentScore} → Target: ${area.targetScore}`}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
);

// Dashboard View - Metrics-focused, data visualization layout
const DashboardView = ({ aiSummary, getTrendIcon, getPriorityColor }) => (
  <Box>
    {/* Performance Score Card */}
    <Card sx={{ mb: 3, bgcolor: "primary.50", border: "2px solid", borderColor: "primary.main" }}>
      <CardContent>
        <Grid
          container
          spacing={3}
          alignItems="center">
          <Grid
            item
            xs={12}
            md={4}>
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h2"
                color="primary"
                fontWeight={700}>
                {aiSummary.overallPerformanceRating}
              </Typography>
              <Typography
                variant="body1"
                fontWeight={600}>
                Overall Performance
              </Typography>
            </Box>
          </Grid>
          <Grid
            item
            xs={12}
            md={8}>
            <Typography
              variant="body2"
              sx={{ mb: 2 }}>
              {aiSummary.executiveSummary}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip
                label={`Percentile: ${aiSummary.comparisonToAverage.performancePercentile}th`}
                color="primary"
              />
              <Chip
                label={`Team Avg: ${aiSummary.comparisonToAverage.teamAverage}`}
                variant="outlined"
              />
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>

    {/* Metrics Dashboard */}
    <Grid
      container
      spacing={2}
      sx={{ mb: 3 }}>
      {Object.entries(aiSummary.keyMetrics).map(([key, value]) => {
        const percentage = typeof value === "number" ? value : 0;
        const color = percentage >= 70 ? "success" : percentage >= 50 ? "warning" : "error";

        return (
          <Grid
            item
            xs={6}
            sm={4}
            md={3}
            lg={2}
            key={key}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ textAlign: "center", p: 2 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    border: `4px solid`,
                    borderColor: `${color}.main`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1,
                  }}>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color={`${color}.main`}>
                    {typeof value === "number" ? value.toFixed(0) : value}
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  textTransform="capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>

    {/* Quick Insights Grid */}
    <Grid
      container
      spacing={2}>
      {/* Top Strength */}
      <Grid
        item
        xs={12}
        md={4}>
        <Card sx={{ height: "100%", bgcolor: "success.50" }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Star
                color="success"
                sx={{ mr: 1 }}
              />
              <Typography
                variant="h6"
                fontWeight={600}>
                Top Strength
              </Typography>
            </Box>
            <Typography
              variant="h5"
              fontWeight={700}
              color="success.dark"
              gutterBottom>
              {aiSummary.strengths[0].category}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary">
              {aiSummary.strengths[0].description.substring(0, 100)}...
            </Typography>
            <Chip
              label={`Score: ${aiSummary.strengths[0].score}`}
              color="success"
              size="small"
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>
      </Grid>

      {/* Priority Focus */}
      <Grid
        item
        xs={12}
        md={4}>
        <Card sx={{ height: "100%", bgcolor: "warning.50" }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Warning
                color="warning"
                sx={{ mr: 1 }}
              />
              <Typography
                variant="h6"
                fontWeight={600}>
                Priority Focus
              </Typography>
            </Box>
            <Typography
              variant="h5"
              fontWeight={700}
              color="warning.dark"
              gutterBottom>
              {aiSummary.areasForImprovement[0].category}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary">
              {aiSummary.areasForImprovement[0].description.substring(0, 100)}...
            </Typography>
            <Box sx={{ mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={(aiSummary.areasForImprovement[0].currentScore / aiSummary.areasForImprovement[0].targetScore) * 100}
                sx={{ height: 8, borderRadius: 1 }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}>
                {aiSummary.areasForImprovement[0].currentScore} / {aiSummary.areasForImprovement[0].targetScore}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Training Focus */}
      <Grid
        item
        xs={12}
        md={4}>
        <Card sx={{ height: "100%", bgcolor: "info.50" }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <FitnessCenter
                color="info"
                sx={{ mr: 1 }}
              />
              <Typography
                variant="h6"
                fontWeight={600}>
                Training Focus
              </Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography
                variant="caption"
                fontWeight={600}
                color="text.secondary">
                Immediate:
              </Typography>
              {(aiSummary.trainingFocus?.immediate || []).map((focus, idx) => (
                <Chip
                  key={idx}
                  label={focus}
                  size="small"
                  sx={{ m: 0.5 }}
                  color="error"
                />
              ))}
              <Typography
                variant="caption"
                fontWeight={600}
                color="text.secondary"
                sx={{ display: "block", mt: 1 }}>
                Short Term:
              </Typography>
              {(aiSummary.trainingFocus?.shortTerm || []).map((focus, idx) => (
                <Chip
                  key={idx}
                  label={focus}
                  size="small"
                  sx={{ m: 0.5 }}
                  color="warning"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
);

export default PlayerAIReport;
