import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Menu, MenuItem, ListItemIcon, ListItemText, CircularProgress, Box, Divider } from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckIcon from "@mui/icons-material/Check";
import { selectActiveContext, selectAvailableContexts, selectHasMultipleContexts, setActiveContext } from "../store/authSlice";
import contextService from "../api/contextService";

const ContextSwitcher = () => {
  const dispatch = useDispatch();
  const activeContext = useSelector(selectActiveContext);
  const availableContexts = useSelector(selectAvailableContexts);
  const hasMultipleContexts = useSelector(selectHasMultipleContexts);
  const [anchorEl, setAnchorEl] = useState(null);
  const [switching, setSwitching] = useState(false);

  // Don't show if user has only one context
  if (!hasMultipleContexts) {
    return null;
  }

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleContextSwitch = async (context) => {
    // If clicking current context, just close menu
    if (activeContext?.type === context.type && activeContext?.clubId === context.clubId && activeContext?.role === context.role) {
      handleMenuClose();
      return;
    }

    setSwitching(true);
    try {
      const response = await contextService.switchContext({
        contextType: context.type,
        clubId: context.clubId,
      });

      if (response.success) {
        // Update Redux with new context and token
        dispatch(
          setActiveContext({
            activeContext: response.data.activeContext,
            accessToken: response.data.accessToken,
          })
        );

        // Reload page to refresh data for new context
        window.location.reload();
      }
    } catch (error) {
      console.error("Error switching context:", error);
      alert("Failed to switch context. Please try again.");
    } finally {
      setSwitching(false);
      handleMenuClose();
    }
  };

  const getContextLabel = (context) => {
    if (context.type === "personal") {
      return "Personal Training";
    }
    return `${context.clubName} - ${formatRole(context.role)}`;
  };

  const formatRole = (role) => {
    if (!role) return "";
    // Convert CLUB_MANAGER to Club Manager, HEAD_COACH to Head Coach, etc.
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const getContextIcon = (context) => {
    return context.type === "club" ? <BusinessIcon fontSize="small" /> : <PersonIcon fontSize="small" />;
  };

  const isActiveContext = (context) => {
    return activeContext?.type === context.type && activeContext?.clubId === context.clubId && activeContext?.role === context.role;
  };

  const currentLabel = activeContext ? getContextLabel(activeContext) : "Select Context";

  return (
    <Box>
      <Button
        color="inherit"
        onClick={handleMenuOpen}
        endIcon={
          switching ? (
            <CircularProgress
              size={16}
              color="inherit"
            />
          ) : (
            <ExpandMoreIcon />
          )
        }
        disabled={switching}
        startIcon={activeContext ? getContextIcon(activeContext) : null}
        sx={{
          textTransform: "none",
          borderRadius: 0,
          px: 2,
          width: "100%",
        }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <Box sx={{ fontSize: "0.75rem", opacity: 0.7 }}>Context</Box>
          <Box sx={{ fontSize: "0.9rem", fontWeight: 500 }}>{currentLabel}</Box>
        </Box>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          sx: {
            minWidth: 280,
            mt: 1,
          },
        }}>
        {availableContexts.map((context, index) => (
          <React.Fragment key={`${context.type}-${context.clubId || "personal"}`}>
            <MenuItem
              onClick={() => handleContextSwitch(context)}
              selected={isActiveContext(context)}
              sx={{
                py: 1.5,
                display: "flex",
                justifyContent: "space-between",
              }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <ListItemIcon sx={{ minWidth: 36 }}>{getContextIcon(context)}</ListItemIcon>
                <ListItemText
                  primary={context.type === "personal" ? "Personal Training" : context.clubName}
                  secondary={context.type === "club" ? formatRole(context.role) : null}
                  primaryTypographyProps={{ fontWeight: isActiveContext(context) ? 600 : 400 }}
                />
              </Box>
              {isActiveContext(context) && (
                <CheckIcon
                  fontSize="small"
                  color="primary"
                  sx={{ ml: 1 }}
                />
              )}
            </MenuItem>
            {index < availableContexts.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </Menu>
    </Box>
  );
};

export default ContextSwitcher;
