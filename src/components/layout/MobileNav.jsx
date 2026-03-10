import React, { useMemo, useState, useCallback } from "react";
import { Dialog, Box, Typography, IconButton, List, ListItem, ListItemButton, ListItemIcon, Collapse, Divider } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  logout,
  selectIsClubContext,
  selectActiveClubRole,
  selectIsPlatformAdmin,
  selectPrimaryRole,
  selectActiveContext,
  selectIsPlatformEngineering,
} from "../../store/authSlice";
import { getMenuItems, isActive } from "../../helpers/sidebar";
import authService from "../../api/authService";
import { useTheme as useAppTheme } from "../../contexts/ThemeContext";

const AimLogoVector = () => (
  <svg width="21" height="25" viewBox="275 208 105 125" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M295.4 228.6H315.9V252.8L295.4 275.7V228.6ZM356.1 208L336.5 229.9V208H275V310.6L295.5 331.1V306.1L316 283.2V331.1H336.5V260.3L357 237.4V331.1L377.5 310.6V208H356H356.1Z"
      fill="currentColor"
    />
  </svg>
);

const MobileNav = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isClubContext = useSelector(selectIsClubContext);
  const activeClubRole = useSelector(selectActiveClubRole);
  const isPlatformAdmin = useSelector(selectIsPlatformAdmin);
  const primaryRole = useSelector(selectPrimaryRole);
  const activeContext = useSelector(selectActiveContext);
  const isPlatformEngineering = useSelector(selectIsPlatformEngineering);
  const themeCtx = useAppTheme();
  const [expandedMenus, setExpandedMenus] = useState({});

  const menuItems = useMemo(
    () => getMenuItems(isClubContext, activeClubRole, isPlatformAdmin, primaryRole, activeContext, isPlatformEngineering),
    [isClubContext, activeClubRole, isPlatformAdmin, primaryRole, activeContext, isPlatformEngineering]
  );

  const toggleMenu = useCallback((label) => {
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch(logout());
      navigate("/login");
      onClose();
    }
  }, [dispatch, navigate, onClose]);

  const handleNav = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: "#fff",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header: Logo + Close */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: "16px", py: "18px" }}>
        <Box sx={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <AimLogoVector />
          <Typography sx={{ fontSize: 28, fontWeight: 700, color: "#000", textTransform: "uppercase", lineHeight: "23px" }}>
            AIM
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ p: 0 }}>
          <CloseIcon sx={{ fontSize: 24 }} />
        </IconButton>
      </Box>

      {/* Search Bar */}
      <Box sx={{ px: "16px", pb: "12px" }}>
        <Box
          sx={{
            bgcolor: "#f3f4f6",
            borderRadius: "7.5px",
            p: "10px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <SearchIcon sx={{ fontSize: 24, color: "#888" }} />
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#888" }}>
            Search commands...
          </Typography>
        </Box>
      </Box>

      {/* Nav Items */}
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        <List disablePadding>
          {menuItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedMenus[item.label] || false;
            const isItemActive = item.path && isActive(location.pathname, item.path);
            const hasActiveChild = hasChildren && item.children.some((child) => child.path && isActive(location.pathname, child.path));

            return (
              <React.Fragment key={item.label}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      if (hasChildren) {
                        toggleMenu(item.label);
                      } else {
                        handleNav(item.path);
                      }
                    }}
                    sx={{
                      minHeight: 42,
                      px: "16px",
                      py: "8px",
                      bgcolor: (isItemActive || hasActiveChild) ? "#24FF00" : "transparent",
                      "&:hover": { bgcolor: (isItemActive || hasActiveChild) ? "#24FF00" : "rgba(0,0,0,0.04)" },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", width: "100%", gap: "10px", p: "5px" }}>
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          color: (isItemActive || hasActiveChild) ? "#000" : "#545963",
                          "& .MuiSvgIcon-root": { fontSize: 24 },
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <Typography
                        sx={{
                          fontSize: 16,
                          fontWeight: (isItemActive || hasActiveChild) ? 700 : 500,
                          color: (isItemActive || hasActiveChild) ? "#000" : "#545963",
                          flex: 1,
                        }}
                      >
                        {item.label}
                      </Typography>
                      {hasChildren && (isExpanded ? <ExpandLess sx={{ color: "#545963" }} /> : <ExpandMore sx={{ color: "#545963" }} />)}
                    </Box>
                  </ListItemButton>
                </ListItem>
                {hasChildren && (
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.children.map((child) => (
                        <ListItem key={child.label} disablePadding>
                          <ListItemButton
                            onClick={() => handleNav(child.path)}
                            sx={{
                              minHeight: 36,
                              pl: "58px",
                              pr: "16px",
                              bgcolor: isActive(location.pathname, child.path) ? "rgba(36,255,0,0.15)" : "transparent",
                              "&:hover": { bgcolor: isActive(location.pathname, child.path) ? "rgba(36,255,0,0.2)" : "rgba(0,0,0,0.04)" },
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 14,
                                fontWeight: isActive(location.pathname, child.path) ? 600 : 500,
                                color: isActive(location.pathname, child.path) ? "#000" : "#545963",
                              }}
                            >
                              {child.label}
                            </Typography>
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                )}
              </React.Fragment>
            );
          })}
        </List>
      </Box>

      {/* Bottom: Dark Mode / Settings / Logout */}
      <Divider />
      <Box sx={{ display: "flex", gap: "5px", p: "12px" }}>
        <Box
          onClick={themeCtx.toggleDarkMode}
          sx={{
            flex: 1,
            height: 50,
            bgcolor: "#f3f4f6",
            borderRadius: "7.5px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            "&:hover": { bgcolor: "#ecedf0" },
          }}
        >
          <DarkModeIcon sx={{ fontSize: 24, color: "#545963" }} />
        </Box>
        <Box
          sx={{
            flex: 1,
            height: 50,
            bgcolor: "#f3f4f6",
            borderRadius: "7.5px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            "&:hover": { bgcolor: "#ecedf0" },
          }}
        >
          <SettingsIcon sx={{ fontSize: 24, color: "#545963" }} />
        </Box>
        <Box
          onClick={handleLogout}
          sx={{
            flex: 1,
            height: 50,
            bgcolor: "rgba(255,3,11,0.15)",
            borderRadius: "7.5px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            "&:hover": { bgcolor: "rgba(255,3,11,0.25)" },
          }}
        >
          <LogoutIcon sx={{ fontSize: 24, color: "#d32f2f" }} />
        </Box>
      </Box>
    </Dialog>
  );
};

export default MobileNav;
