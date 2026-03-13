import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Container, Card, CardContent, Typography, TextField, Button, CircularProgress, Alert, MenuItem, FormControl, InputLabel, Select, ToggleButton, ToggleButtonGroup, useMediaQuery, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import AppLayout from "../../components/AppLayout";
import clubService from "../../api/clubService";

// Generate birth years from 2000 to current year
const currentYear = new Date().getFullYear();
const birthYears = [];
for (let year = currentYear; year >= 2000; year--) {
  birthYears.push({ value: String(year), label: String(year) });
}

const ageGroups = [
  { value: "U6", label: "Under 6" },
  { value: "U7", label: "Under 7" },
  { value: "U8", label: "Under 8" },
  { value: "U9", label: "Under 9" },
  { value: "U10", label: "Under 10" },
  { value: "U11", label: "Under 11" },
  { value: "U12", label: "Under 12" },
  { value: "U13", label: "Under 13" },
  { value: "U14", label: "Under 14" },
  { value: "U15", label: "Under 15" },
  { value: "U16", label: "Under 16" },
  { value: "U17", label: "Under 17" },
  { value: "U18", label: "Under 18" },
  { value: "U19", label: "Under 19" },
  { value: "U20", label: "Under 20" },
  { value: "U21", label: "Under 21" },
  { value: "Adult", label: "Adult" },
  { value: "Mixed", label: "Mixed Age" },
];

const teamColours = [
  { value: "red", label: "Red", hex: "#EF4444" },
  { value: "blue", label: "Blue", hex: "#3B82F6" },
  { value: "green", label: "Green", hex: "#22C55E" },
  { value: "yellow", label: "Yellow", hex: "#EAB308" },
  { value: "orange", label: "Orange", hex: "#F97316" },
  { value: "purple", label: "Purple", hex: "#A855F7" },
  { value: "pink", label: "Pink", hex: "#EC4899" },
  { value: "cyan", label: "Cyan", hex: "#06B6D4" },
  { value: "grey", label: "Grey", hex: "#6B7280" },
  { value: "black", label: "Black", hex: "#1F2937" },
];

const CreateTeam = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const isHandheld = useMediaQuery("(max-width:1199px)");
  const [loading, setLoading] = useState(false);
  const [loadingCoaches, setLoadingCoaches] = useState(true);
  const [error, setError] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [ageGroupMode, setAgeGroupMode] = useState("traditional"); // 'traditional' or 'birthYear'
  const [formData, setFormData] = useState({
    name: "",
    ageGroup: "",
    description: "",
    headCoachId: "",
    colour: "",
  });

  useEffect(() => {
    loadCoaches();
  }, [clubId]);

  const loadCoaches = async () => {
    try {
      setLoadingCoaches(true);
      const response = await clubService.getStaff(clubId);
      // Filter to only show coaches and head coaches
      const coachList = response.data.filter((staff) => staff.role === "COACH" || staff.role === "HEAD_COACH");
      setCoaches(coachList);
    } catch (err) {
      console.error("Error loading coaches:", err);
      setError(err.response?.data?.message || "Failed to load coaches");
    } finally {
      setLoadingCoaches(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Team name is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Only include headCoachId if one was selected
      const teamData = {
        name: formData.name.trim(),
        ageGroup: formData.ageGroup,
        description: formData.description.trim(),
        colour: formData.colour || null,
      };

      if (formData.headCoachId) {
        teamData.headCoachId = formData.headCoachId;
      }

      await clubService.createTeam(clubId, teamData);

      // Navigate back to teams page
      navigate(`/clubs/${clubId}/teams`);
    } catch (err) {
      console.error("Error creating team:", err);
      setError(err.response?.data?.message || "Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const formContent = (
    <Box
      id="create-team-form"
      component="form"
      onSubmit={handleSubmit}
      sx={{ mt: isHandheld ? 0 : 3, pb: isHandheld ? "98px" : 0 }}>
      <TextField
        fullWidth
        label="Team Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
        margin="normal"
        placeholder="e.g., U16 Boys, Girls Academy, Seniors"
      />

      <Box sx={{ mt: 2, mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Age Group Type
        </Typography>
        <ToggleButtonGroup
          value={ageGroupMode}
          exclusive
          onChange={(e, newMode) => {
            if (newMode !== null) {
              setAgeGroupMode(newMode);
              setFormData((prev) => ({ ...prev, ageGroup: "" }));
            }
          }}
          size="small"
          fullWidth
        >
          <ToggleButton value="traditional">Age Group (U6-U21)</ToggleButton>
          <ToggleButton value="birthYear">Birth Year</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <FormControl
        fullWidth
        margin="normal"
        required>
        <InputLabel>{ageGroupMode === "traditional" ? "Age Group" : "Birth Year"}</InputLabel>
        <Select
          name="ageGroup"
          value={formData.ageGroup}
          onChange={handleChange}
          label={ageGroupMode === "traditional" ? "Age Group" : "Birth Year"}>
          {ageGroupMode === "traditional"
            ? ageGroups.map((group) => (
                <MenuItem key={group.value} value={group.value}>
                  {group.label}
                </MenuItem>
              ))
            : birthYears.map((year) => (
                <MenuItem key={year.value} value={year.value}>
                  {year.label}
                </MenuItem>
              ))}
        </Select>
      </FormControl>

      <FormControl
        fullWidth
        margin="normal">
        <InputLabel>Head Coach (Optional)</InputLabel>
        <Select
          name="headCoachId"
          value={formData.headCoachId}
          onChange={handleChange}
          label="Head Coach (Optional)"
          disabled={loadingCoaches}>
          <MenuItem value="">
            <em>None - Assign later</em>
          </MenuItem>
          {coaches.map((coach) => (
            <MenuItem
              key={coach._id}
              value={coach._id}>
              {coach.name} ({coach.role})
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ mt: 2, mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Team Colour (Optional)
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {teamColours.map((colour) => (
            <Box
              key={colour.value}
              onClick={() => setFormData((prev) => ({
                ...prev,
                colour: prev.colour === colour.value ? "" : colour.value
              }))}
              sx={{
                width: 40,
                height: 40,
                backgroundColor: colour.hex,
                borderRadius: 1,
                cursor: "pointer",
                border: formData.colour === colour.value ? "3px solid #000" : "2px solid transparent",
                boxShadow: formData.colour === colour.value ? "0 0 0 2px #fff, 0 0 0 4px #000" : "none",
                transition: "all 0.2s",
                "&:hover": {
                  transform: "scale(1.1)",
                },
              }}
              title={colour.label}
            />
          ))}
        </Box>
        {formData.colour && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
            Selected: {teamColours.find(c => c.value === formData.colour)?.label}
          </Typography>
        )}
      </Box>

      <TextField
        fullWidth
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        margin="normal"
        multiline
        rows={3}
        placeholder="Optional team description..."
      />

      {!isHandheld && (
        <Box sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.name.trim()}>
            {loading ? <CircularProgress size={24} /> : "Create Team"}
          </Button>
        </Box>
      )}
    </Box>
  );

  const mobileBottomActions = (
    <Box
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: "#fff",
        borderTop: "1px solid #ebebeb",
        p: "12px",
        display: "flex",
        gap: "10px",
        zIndex: 1301,
      }}
    >
      <Button
        onClick={handleCancel}
        disabled={loading}
        sx={{
          flex: 1,
          bgcolor: "#f3f4f6",
          color: "#000",
          fontWeight: 600,
          fontSize: 16,
          textTransform: "none",
          borderRadius: "7px",
          py: "12px",
          "&:hover": { bgcolor: "#ecedf0" },
        }}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        form="create-team-form"
        disabled={loading || !formData.name.trim()}
        sx={{
          flex: 1,
          bgcolor: "#24FF00",
          color: "#000",
          fontWeight: 600,
          fontSize: 16,
          textTransform: "none",
          borderRadius: "7px",
          py: "12px",
          "&:hover": { bgcolor: "#1ecc00" },
          "&.Mui-disabled": { bgcolor: "#24FF00", opacity: 0.5, color: "#000" },
        }}
      >
        {loading ? <CircularProgress size={20} sx={{ color: "#000" }} /> : "Create Team"}
      </Button>
    </Box>
  );

  return (
    <AppLayout hideMobileBottomBar={isHandheld}>
      {isHandheld ? (
        <Box sx={{ p: "15px", width: "100%", bgcolor: "#fff", minHeight: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: "10px", borderBottom: "1px solid #EBEBEB", pb: "12px", mb: "12px" }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 20, fontWeight: 600, color: "#000", lineHeight: 1.1 }}>
                Create New Team
              </Typography>
              <Typography sx={{ fontSize: 13, color: "#545963", mt: "4px" }}>
                Create a new team for your club. You can assign a head coach now or later.
              </Typography>
            </Box>
            <IconButton onClick={handleCancel} sx={{ p: "6px", borderRadius: "7px", bgcolor: "#F3F4F6", border: "1px solid #EAECF0" }}>
              <CloseIcon sx={{ fontSize: 24 }} />
            </IconButton>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {formContent}
          {mobileBottomActions}
        </Box>
      ) : (
        <Container
          maxWidth="md"
          sx={{ mt: 4, mb: 4 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleCancel}
            sx={{ mb: 2 }}>
            Back to Club
          </Button>

          <Card>
            <CardContent>
              <Typography
                variant="h5"
                component="h1"
                gutterBottom>
                Create New Team
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                paragraph>
                Create a new team for your club. You can assign a head coach now or later.
              </Typography>

              {error && (
                <Alert
                  severity="error"
                  sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {formContent}
            </CardContent>
          </Card>
        </Container>
      )}
    </AppLayout>
  );
};

export default CreateTeam;
