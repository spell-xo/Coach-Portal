import React from "react";
import { Dialog, Slide, Box, Typography, IconButton, useMediaQuery } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectActiveContext, selectIsClubContext } from "../store/authSlice";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const actionCardBase = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  borderRadius: "7.5px",
  cursor: "pointer",
  overflow: "hidden",
  p: "10px",
  transition: "transform 0.15s, box-shadow 0.15s",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
};

const ExpandAcademyModal = ({ open, onClose }) => {
  const navigate = useNavigate();
  const activeContext = useSelector(selectActiveContext);
  const isClubContext = useSelector(selectIsClubContext);
  const clubId = activeContext?.clubId;
  const isMobile = useMediaQuery("(max-width:767px)");

  const handleAction = (path) => {
    onClose();
    navigate(path);
  };

  if (!isClubContext || !clubId) return null;

  const actions = [
    {
      key: "team",
      path: `/clubs/${clubId}/teams/create`,
      icon: <GroupAddIcon sx={{ fontSize: 35, color: "#1CC900" }} />,
      badgeColor: "#1CC900",
      badgeBorder: "#DEFFD9",
      label: "Create Team",
      desc: "Create new team in the club",
      bgColor: "rgba(36,255,0,0.15)",
      labelColor: "#1CC900",
      descColor: "#1CC900",
    },
    {
      key: "invite",
      path: `/clubs/${clubId}/invitations`,
      icon: <PersonAddIcon sx={{ fontSize: 35, color: "#000" }} />,
      badgeColor: "#000",
      badgeBorder: "#f3f4f6",
      label: "Invite Player",
      desc: "Send a player invitation",
      bgColor: "#f3f4f6",
      labelColor: "#000",
      descColor: "#98A2B3",
    },
    {
      key: "import",
      path: `/clubs/${clubId}/players/bulk-import`,
      icon: <CloudUploadIcon sx={{ fontSize: 35, color: "#000" }} />,
      badgeColor: null,
      label: "Bulk Import Players",
      desc: "Import multiple players from CSV",
      bgColor: "#f3f4f6",
      labelColor: "#000",
      descColor: "#98A2B3",
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      TransitionComponent={isMobile ? Transition : undefined}
      PaperProps={{
        sx: isMobile
          ? {
              position: "fixed",
              bottom: 0,
              m: 0,
              borderRadius: "15px 15px 0 0",
              width: "100%",
              maxWidth: "100%",
              p: "20px",
              gap: "12px",
              display: "flex",
              flexDirection: "column",
            }
          : {
              width: 631,
              borderRadius: "15px",
              border: "1.375px solid #ebebeb",
              boxShadow: "0px 0px 19.4px 0px rgba(0,0,0,0.25)",
              p: "20px",
              gap: "12px",
              display: "flex",
              flexDirection: "column",
            },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#000", letterSpacing: "-0.08px" }}>
          Expand the Academy
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ p: 0 }}>
          <CloseIcon sx={{ fontSize: 24 }} />
        </IconButton>
      </Box>

      <Box sx={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "10px" }}>
        {actions.map((action) => (
          <Box
            key={action.key}
            onClick={() => handleAction(action.path)}
            sx={{
              ...actionCardBase,
              flex: isMobile ? undefined : 1,
              height: isMobile ? "auto" : 148,
              py: isMobile ? "16px" : "10px",
              bgcolor: action.bgColor,
            }}
          >
            <Box sx={{ position: "relative", width: 42, height: 42 }}>
              {action.icon}
              {action.badgeColor && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: -3,
                    right: -5,
                    width: 18,
                    height: 18,
                    borderRadius: "28px",
                    bgcolor: action.badgeColor,
                    border: `1.75px solid ${action.badgeBorder}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AddIcon sx={{ fontSize: 12, color: "#fff" }} />
                </Box>
              )}
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: action.labelColor, letterSpacing: "-0.05px" }}>
                {action.label}
              </Typography>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: action.descColor,
                  letterSpacing: "-0.05px",
                  lineHeight: "15px",
                  mt: "3px",
                  maxWidth: 230,
                  mx: "auto",
                }}
              >
                {action.desc}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Dialog>
  );
};

export default ExpandAcademyModal;
