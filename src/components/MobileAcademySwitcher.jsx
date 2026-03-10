import React, { useState } from "react";
import { Dialog, Slide, Box, Typography, IconButton, List, ListItem, ListItemButton, CircularProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import PersonIcon from "@mui/icons-material/Person";
import { useDispatch, useSelector } from "react-redux";
import {
  selectActiveContext,
  selectAvailableContexts,
  setActiveContext,
} from "../store/authSlice";
import contextService from "../api/contextService";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const MobileAcademySwitcher = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const activeContext = useSelector(selectActiveContext);
  const availableContexts = useSelector(selectAvailableContexts);
  const [switching, setSwitching] = useState(false);

  const formatRole = (role) => {
    if (!role) return "";
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const isActiveCtx = (context) => {
    return activeContext?.type === context.type && activeContext?.clubId === context.clubId && activeContext?.role === context.role;
  };

  const handleSwitch = async (context) => {
    if (isActiveCtx(context)) {
      onClose();
      return;
    }

    setSwitching(true);
    try {
      const response = await contextService.switchContext({
        contextType: context.type,
        clubId: context.clubId,
      });

      if (response.success) {
        dispatch(
          setActiveContext({
            activeContext: response.data.activeContext,
            accessToken: response.data.accessToken,
          })
        );
        window.location.reload();
      }
    } catch (error) {
      console.error("Error switching context:", error);
    } finally {
      setSwitching(false);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      fullWidth
      PaperProps={{
        sx: {
          position: "fixed",
          bottom: 0,
          m: 0,
          borderRadius: "15px 15px 0 0",
          maxHeight: "60vh",
          width: "100%",
          maxWidth: "100%",
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: "16px", pt: "16px", pb: "12px" }}>
        <Box>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#000" }}>
            {activeContext?.clubName || "Personal Training"}
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#545963" }}>
            {activeContext?.role ? formatRole(activeContext.role) : "Coach"}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ p: 0 }}>
          <CloseIcon sx={{ fontSize: 24 }} />
        </IconButton>
      </Box>

      {/* Context List */}
      <Box sx={{ overflowY: "auto", pb: "16px" }}>
        {switching && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={24} sx={{ color: "#24FF00" }} />
          </Box>
        )}
        <List disablePadding>
          {availableContexts?.map((context) => {
            const active = isActiveCtx(context);
            return (
              <ListItem key={`${context.type}-${context.clubId || "personal"}`} disablePadding>
                <ListItemButton
                  onClick={() => handleSwitch(context)}
                  disabled={switching}
                  sx={{
                    px: "16px",
                    py: "12px",
                    bgcolor: active ? "rgba(36,255,0,0.12)" : "transparent",
                    "&:hover": { bgcolor: active ? "rgba(36,255,0,0.18)" : "rgba(0,0,0,0.04)" },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: "12px", width: "100%" }}>
                    {context.type === "personal" ? (
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          bgcolor: "#f3f4f6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <PersonIcon sx={{ fontSize: 20, color: "#545963" }} />
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          bgcolor: "#e0e0e0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#545963" }}>
                          {(context.clubName || "C").charAt(0)}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: 15, fontWeight: active ? 600 : 500, color: "#000" }}>
                        {context.type === "personal" ? "Personal Training" : context.clubName}
                      </Typography>
                      {context.type === "club" && context.role && (
                        <Typography sx={{ fontSize: 12, color: "#545963" }}>
                          {formatRole(context.role)}
                        </Typography>
                      )}
                    </Box>
                    {active && <CheckIcon sx={{ fontSize: 20, color: "#24FF00" }} />}
                  </Box>
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Dialog>
  );
};

export default MobileAcademySwitcher;
