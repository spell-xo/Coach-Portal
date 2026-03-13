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
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckIcon from "@mui/icons-material/Check";
import AppLayout from "../../components/AppLayout";
import { selectActiveContext } from "../../store/authSlice";
import clubService from "../../api/clubService";
import brandingMockService from "../../mocks/brandingMockService";

const LOGO_MAX_SIZE = 2 * 1024 * 1024;
const HERO_MAX_SIZE = 5 * 1024 * 1024;
const LOGO_ACCEPTED = ".png,.svg";
const HERO_ACCEPTED = ".jpg,.jpeg,.png";
const LOGO_ACCEPTED_TYPES = ["image/png", "image/svg+xml"];
const HERO_ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const READY_BG_VARIANTS = [
  { id: "variant-1", url: "/branding-ready-bg/variant-1.png" },
  { id: "variant-2", url: "/branding-ready-bg/variant-2.png" },
  { id: "variant-3", url: "/branding-ready-bg/variant-3.png" },
  { id: "variant-4", url: "/branding-ready-bg/variant-4.png" },
  { id: "variant-5", url: "/branding-ready-bg/variant-5.png" },
  { id: "variant-6", url: "/branding-ready-bg/variant-6.png" },
  { id: "variant-7", url: "/branding-ready-bg/variant-7.png" },
  { id: "variant-8", url: "/branding-ready-bg/variant-8.png" },
  { id: "variant-9", url: "/branding-ready-bg/variant-9.png" },
  { id: "variant-10", url: "/branding-ready-bg/variant-10.png" },
];

const normalizeClubPayload = (payload) =>
  payload?.data?.club || payload?.club || payload?.data || payload || {};

const getUploadedImageUrl = (uploadResponse) => {
  return (
    uploadResponse?.data?.preview?.large ||
    uploadResponse?.data?.variants?.large ||
    uploadResponse?.data?.url ||
    uploadResponse?.preview?.large ||
    uploadResponse?.variants?.large ||
    uploadResponse?.url ||
    null
  );
};

const imageUrlToFile = async (url, fileName = "ready-bg.png") => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to load selected ready background");
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type || "image/png" });
};

const isBrandingMockMode = process.env.REACT_APP_BRANDING_MOCK_MODE === "true";
const brandingService = isBrandingMockMode ? brandingMockService : clubService;

const AcademyBranding = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const activeContext = useSelector(selectActiveContext);
  const isPhone = useMediaQuery("(max-width:767px)");
  const isHandheld = useMediaQuery("(max-width:1199px)");

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
  const [selectedReadyHeroVariant, setSelectedReadyHeroVariant] = useState(null);

  const badgeInputRef = useRef(null);
  const heroInputRef = useRef(null);

  const fetchClubData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await brandingService.getClubById(clubId);
      const club = normalizeClubPayload(res);
      setClubName(club.name || "");
      setOriginalName(club.name || "");
      setCurrentBadgeUrl(club.settings?.branding?.badgeUrl || null);
      setCurrentHeroUrl(club.settings?.branding?.heroImageUrl || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load club data");
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    fetchClubData();
  }, [fetchClubData]);

  useEffect(() => {
    return () => {
      if (newBadgePreview) URL.revokeObjectURL(newBadgePreview);
      if (newHeroPreview) URL.revokeObjectURL(newHeroPreview);
    };
  }, [newBadgePreview, newHeroPreview]);

  const hasChanges =
    clubName !== originalName ||
    newBadgeFile !== null ||
    newHeroFile !== null ||
    selectedReadyHeroVariant !== null;

  const handleBadgeChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!LOGO_ACCEPTED_TYPES.includes(file.type)) {
      setError("Logo file must be PNG or SVG");
      return;
    }
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
    if (!HERO_ACCEPTED_TYPES.includes(file.type)) {
      setError("Header background must be JPG or PNG");
      return;
    }
    if (file.size > HERO_MAX_SIZE) {
      setError("Header background must be under 5MB");
      return;
    }
    setNewHeroFile(file);
    setNewHeroPreview(URL.createObjectURL(file));
    setSelectedReadyHeroVariant(null);
    setError(null);
  }, []);

  const handleHeroDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!HERO_ACCEPTED_TYPES.includes(file.type)) {
      setError("Header background must be JPG or PNG");
      return;
    }
    if (file.size > HERO_MAX_SIZE) {
      setError("Header background must be under 5MB");
      return;
    }
    setNewHeroFile(file);
    setNewHeroPreview(URL.createObjectURL(file));
    setSelectedReadyHeroVariant(null);
    setError(null);
  }, []);

  const handleReadyVariantSelect = (url) => {
    if (newHeroPreview) URL.revokeObjectURL(newHeroPreview);
    setNewHeroFile(null);
    setNewHeroPreview(null);
    setSelectedReadyHeroVariant(url);
    setError(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      if (clubName !== originalName) {
        await brandingService.updateClubProfile(clubId, { name: clubName });
      }

      if (newBadgeFile) {
        try {
          const badgeResult = await brandingService.replaceClubBadge(clubId, newBadgeFile);
          const badgeUrl = getUploadedImageUrl(badgeResult);
          if (badgeUrl) setCurrentBadgeUrl(badgeUrl);
        } catch {
          const badgeFallbackResult = await brandingService.uploadClubImage(clubId, newBadgeFile, "badge");
          const badgeUrl = getUploadedImageUrl(badgeFallbackResult);
          if (badgeUrl) setCurrentBadgeUrl(badgeUrl);
        }
      }

      const selectedHeroFile =
        newHeroFile ||
        (selectedReadyHeroVariant
          ? await imageUrlToFile(
              selectedReadyHeroVariant,
              `ready-bg-${selectedReadyHeroVariant.split("/").pop() || "variant"}.png`
            )
          : null);

      if (selectedHeroFile) {
        const heroTypes = ["hero", "header", "banner", "home"];
        let heroUploadError = null;
        let heroUploaded = false;
        for (const type of heroTypes) {
          try {
            const heroResult = await brandingService.uploadClubImage(clubId, selectedHeroFile, type);
            const heroUrl = getUploadedImageUrl(heroResult);
            if (heroUrl) setCurrentHeroUrl(heroUrl);
            heroUploaded = true;
            break;
          } catch (err) {
            heroUploadError = err;
          }
        }
        if (!heroUploaded && heroUploadError) throw heroUploadError;
      }

      await fetchClubData();
      setSuccess(true);
      setNewBadgeFile(null);
      setNewBadgePreview(null);
      setNewHeroFile(null);
      setNewHeroPreview(null);
      setSelectedReadyHeroVariant(null);
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
  const heroDisplay = newHeroPreview || selectedReadyHeroVariant || currentHeroUrl;

  const content = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: isHandheld ? "20px" : "28px", pb: isHandheld ? "110px" : 0 }}>
      {/* Header */}
      <Box
        sx={
          isHandheld
            ? {
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                borderBottom: "1px solid #EBEBEB",
                pb: "12px",
              }
            : { display: "flex", alignItems: "center", gap: "12px" }
        }
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: isHandheld ? (isPhone ? 20 : 22) : 24, fontWeight: 600, color: "#000" }}>
            Academy Branding
          </Typography>
          <Typography sx={{ fontSize: isHandheld ? (isPhone ? 13 : 14) : 16, color: "#545963", mt: "4px" }}>
            Update your club logo and dashboard header background. Changes will be visible to all coaches in your academy.
          </Typography>
        </Box>
        {isHandheld && (
          <IconButton
            onClick={handleCancel}
            sx={{
              p: "6px",
              borderRadius: "7px",
              bgcolor: "#F3F4F6",
              border: "1px solid #EAECF0",
              ml: "auto",
            }}
          >
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
            width: isHandheld ? "100%" : 415,
          }}
        />
      </Box>

      {/* Academy Logo */}
      <Box>
        <Typography sx={{ fontSize: 18, fontWeight: 500, color: "#667085", mb: "12px" }}>
          Academy Logo
        </Typography>
        <Box sx={{ display: "flex", flexDirection: isHandheld ? "column" : "row", alignItems: isHandheld ? "flex-start" : "center", gap: "16px" }}>
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
        <Box sx={{ display: "flex", flexDirection: isHandheld ? "column" : "row", gap: "12px", alignItems: "stretch" }}>
          {heroDisplay ? (
            <Box
              component="img"
              src={heroDisplay}
              alt="Header background"
              sx={{
                width: isHandheld ? "100%" : 320,
                height: isHandheld ? 140 : "auto",
                minHeight: isHandheld ? 140 : 170,
                objectFit: "cover",
                borderRadius: "7.5px",
                border: "1px solid #ebebeb",
                flexShrink: 0,
              }}
            />
          ) : null}
          <Box
            onDrop={handleHeroDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => heroInputRef.current?.click()}
            sx={{
              border: "1.5px dashed #98A2B3",
              borderRadius: "7.5px",
              bgcolor: "#F3F4F6",
              p: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              cursor: "pointer",
              minHeight: 170,
              flex: 1,
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
        <Box sx={{ mt: "12px" }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#667085", mb: "8px" }}>
            Ready BG Variants
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: "10px",
              overflowX: "auto",
              pb: "4px",
              "&::-webkit-scrollbar": { height: 4 },
              "&::-webkit-scrollbar-thumb": { backgroundColor: "#d0d5dd", borderRadius: 999 },
            }}
          >
            {READY_BG_VARIANTS.map((variant) => {
              const selected = selectedReadyHeroVariant === variant.url;
              return (
                <Box
                  key={variant.id}
                  onClick={() => handleReadyVariantSelect(variant.url)}
                  sx={{
                    position: "relative",
                    width: isPhone ? 284 : isHandheld ? 336 : 336,
                    height: isPhone ? 160 : isHandheld ? 192 : 192,
                    borderRadius: "8px",
                    border: selected ? "2px solid #1CC900" : "1px solid #EAECF0",
                    overflow: "hidden",
                    cursor: "pointer",
                    flexShrink: 0,
                    backgroundImage: `url(${variant.url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {selected && (
                    <>
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          bgcolor: "rgba(36,255,0,0.15)",
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CheckIcon sx={{ fontSize: 28, color: "#24FF00" }} />
                      </Box>
                    </>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Action Buttons */}
      {!isHandheld && <Box sx={{ display: "flex", gap: "10px", mt: "8px" }}>
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
      </Box>}
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
        onClick={handleSave}
        disabled={!hasChanges || saving}
        sx={{
          flex: 1,
          bgcolor: "#24FF00",
          opacity: hasChanges ? 1 : 0.5,
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
        {saving ? <CircularProgress size={20} sx={{ color: "#000" }} /> : "Save Changes"}
      </Button>
      <Button
        onClick={handleCancel}
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
    </Box>
  );

  return (
    <AppLayout hideMobileBottomBar={isHandheld}>
      <Box sx={{ p: isHandheld ? "15px" : "20px", width: "100%", bgcolor: "#fff", minHeight: "100%" }}>
        {isHandheld ? (
          content
        ) : (
          <Box
            sx={{
              bgcolor: "#fff",
              border: "1px solid #ebebeb",
              borderRadius: "15px",
              p: "20px",
              width: "100%",
            }}
          >
            {content}
          </Box>
        )}
        {isHandheld && mobileBottomActions}
      </Box>
    </AppLayout>
  );
};

export default AcademyBranding;
