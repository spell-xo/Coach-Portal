import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Box,
  Typography,
  Button,
  IconButton,
  InputBase,
  Avatar,
  CircularProgress,
  Alert,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AppLayout from "../../components/AppLayout";
import { selectActiveContext } from "../../store/authSlice";
import clubService from "../../api/clubService";

const LOGO_MAX_SIZE = 2 * 1024 * 1024;
const HERO_MAX_SIZE = 5 * 1024 * 1024;
const LOGO_ACCEPTED = ".png,.svg";
const HERO_ACCEPTED = ".jpg,.jpeg,.png";

const AcademyBranding = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const activeContext = useSelector(selectActiveContext);
  const isMobile = useMediaQuery("(max-width:767px)");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [clubName, setClubName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [currentBadgeUrl, setCurrentBadgeUrl] = useState(null);
  const [currentHeroUrl, setCurrentHeroUrl] = useState(null);
  const [newBadgeFile, setNewBadgeFile] = useState(null);
  const [newBadgePreview, setNewBadgePreview] = useState(null);
  const [newHeroFile, setNewHeroFile] = useState(null);
  const [newHeroPreview, setNewHeroPreview] = useState(null);

  const badgeInputRef = useRef(null);
  const heroInputRef = useRef(null);

  useEffect(() => {
    const fetchClubData = async () => {
      try {
        setLoading(true);
        const res = await clubService.getClubById(clubId);
        const club = res.data;
        setClubName(club.name || "");
        setOriginalName(club.name || "");
        setCurrentBadgeUrl(club.settings?.branding?.badgeUrl || null);
        setCurrentHeroUrl(club.settings?.branding?.heroImageUrl || null);
      } catch (err) {
        setError("Failed to load club data");
      } finally {
        setLoading(false);
      }
    };
    fetchClubData();
  }, [clubId]);

  const hasChanges =
    clubName !== originalName || newBadgeFile !== null || newHeroFile !== null;

  const handleBadgeChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > LOGO_MAX_SIZE) {
      setError("Logo file must be under 2MB");
      return;
    }
    setNewBadgeFile(file);
    setNewBadgePreview(URL.createObjectURL(file));
    setError(null);
  }, []);

  const handleHeroChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > HERO_MAX_SIZE) {
      setError("Header background must be under 5MB");
      return;
    }
    setNewHeroFile(file);
    setNewHeroPreview(URL.createObjectURL(file));
    setError(null);
  }, []);

  const handleHeroDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      setError("Header background must be JPG or PNG");
      return;
    }
    if (file.size > HERO_MAX_SIZE) {
      setError("Header background must be under 5MB");
      return;
    }
    setNewHeroFile(file);
    setNewHeroPreview(URL.createObjectURL(file));
    setError(null);
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (clubName !== originalName) {
        await clubService.updateClubProfile(clubId, { name: clubName });
      }

      if (newBadgeFile) {
        await clubService.replaceClubBadge(clubId, newBadgeFile);
      }

      if (newHeroFile) {
        await clubService.uploadClubImage(clubId, newHeroFile, "hero");
      }

      setSuccess(true);
      setOriginalName(clubName);
      setNewBadgeFile(null);
      setNewHeroFile(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <AppLayout>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <CircularProgress sx={{ color: "#24FF00" }} />
        </Box>
      </AppLayout>
    );
  }

  const badgeDisplay = newBadgePreview || currentBadgeUrl;
  const heroDisplay = newHeroPreview || currentHeroUrl;

  const content = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: isMobile ? "20px" : "28px" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {isMobile ? (
          <IconButton onClick={handleCancel} sx={{ p: 0 }}>
            <ArrowBackIcon sx={{ fontSize: 24 }} />
          </IconButton>
        ) : null}
        <Box>
          <Typography sx={{ fontSize: isMobile ? 20 : 24, fontWeight: 600, color: "#000" }}>
            Academy Branding
          </Typography>
          <Typography sx={{ fontSize: isMobile ? 13 : 16, color: "#545963", mt: "4px" }}>
            Update your club logo and dashboard header background. Changes will be visible to all coaches in your academy.
          </Typography>
        </Box>
        {isMobile && (
          <IconButton onClick={handleCancel} sx={{ p: 0, ml: "auto" }}>
            <CloseIcon sx={{ fontSize: 24 }} />
          </IconButton>
        )}
      </Box>

      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success">Changes saved successfully!</Alert>}

      {/* Academy Name */}
      <Box>
        <Typography sx={{ fontSize: 18, fontWeight: 500, color: "#667085", mb: "8px" }}>
          Academy Name
        </Typography>
        <InputBase
          value={clubName}
          onChange={(e) => setClubName(e.target.value)}
          sx={{
            bgcolor: "#f3f4f6",
            borderRadius: "6.25px",
            height: 45,
            px: "14px",
            fontSize: 15,
            fontWeight: 500,
            color: "#000",
            width: isMobile ? "100%" : 415,
          }}
        />
      </Box>

      {/* Academy Logo */}
      <Box>
        <Typography sx={{ fontSize: 18, fontWeight: 500, color: "#667085", mb: "12px" }}>
          Academy Logo
        </Typography>
        <Box sx={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: "16px" }}>
          <Avatar
            src={badgeDisplay}
            sx={{ width: 80, height: 80, bgcolor: "#f3f4f6", border: "1px solid #ebebeb", fontSize: 28, color: "#545963" }}
          >
            {!badgeDisplay && (clubName?.charAt(0) || "A")}
          </Avatar>
          <Box>
            <Button
              onClick={() => badgeInputRef.current?.click()}
              sx={{
                bgcolor: "#000",
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                textTransform: "none",
                borderRadius: "6px",
                px: "16px",
                py: "8px",
                mb: "6px",
                "&:hover": { bgcolor: "#222" },
              }}
            >
              Choose File
            </Button>
            <Typography sx={{ fontSize: 12, color: "#98A2B3" }}>
              PNG or SVG, transparent background recommended. Min 200×200px, max 2MB.
            </Typography>
            <input
              ref={badgeInputRef}
              type="file"
              accept={LOGO_ACCEPTED}
              onChange={handleBadgeChange}
              style={{ display: "none" }}
            />
          </Box>
        </Box>
      </Box>

      {/* Title Background */}
      <Box>
        <Typography sx={{ fontSize: 18, fontWeight: 500, color: "#667085", mb: "12px" }}>
          Title Background
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {heroDisplay && (
            <Box
              component="img"
              src={heroDisplay}
              alt="Header background"
              sx={{
                width: isMobile ? "100%" : 378,
                height: isMobile ? 140 : 160,
                objectFit: "cover",
                borderRadius: "5px",
                border: "1px solid #ebebeb",
              }}
            />
          )}
          <Box
            onDrop={handleHeroDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => heroInputRef.current?.click()}
            sx={{
              border: "1.5px dashed #98A2B3",
              borderRadius: "7.5px",
              bgcolor: "#f3f4f6",
              p: "24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              width: isMobile ? "100%" : 378,
              "&:hover": { borderColor: "#545963", bgcolor: "#ecedf0" },
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 32, color: "#98A2B3" }} />
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#545963" }}>
              Drop image files here
            </Typography>
            <Button
              component="span"
              sx={{
                bgcolor: "#000",
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                textTransform: "none",
                borderRadius: "6px",
                px: "16px",
                py: "6px",
                mt: "4px",
                "&:hover": { bgcolor: "#222" },
              }}
            >
              Choose File
            </Button>
            <Typography sx={{ fontSize: 12, color: "#98A2B3", textAlign: "center", mt: "4px" }}>
              JPG or PNG, 1920×400px recommended. Max 5MB. Use a dark or low-contrast image — text is displayed on top.
            </Typography>
            <input
              ref={heroInputRef}
              type="file"
              accept={HERO_ACCEPTED}
              onChange={handleHeroChange}
              style={{ display: "none" }}
            />
          </Box>
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", gap: "10px", mt: "8px" }}>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          sx={{
            bgcolor: hasChanges ? "#24FF00" : "#24FF00",
            opacity: hasChanges ? 1 : 0.5,
            color: "#000",
            fontWeight: 600,
            fontSize: 14,
            textTransform: "none",
            borderRadius: "6px",
            px: "24px",
            py: "10px",
            "&:hover": { bgcolor: "#1ecc00" },
            "&.Mui-disabled": { bgcolor: "#24FF00", opacity: 0.5, color: "#000" },
          }}
        >
          {saving ? <CircularProgress size={20} sx={{ color: "#000" }} /> : "Save Changes"}
        </Button>
        <Button
          onClick={handleCancel}
          sx={{
            bgcolor: "#f3f4f6",
            color: "#000",
            fontWeight: 600,
            fontSize: 14,
            textTransform: "none",
            borderRadius: "6px",
            px: "24px",
            py: "10px",
            "&:hover": { bgcolor: "#ecedf0" },
          }}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );

  return (
    <AppLayout>
      <Box sx={{ p: isMobile ? "16px" : "24px", maxWidth: isMobile ? "100%" : 700 }}>
        {content}
      </Box>
    </AppLayout>
  );
};

export default AcademyBranding;
