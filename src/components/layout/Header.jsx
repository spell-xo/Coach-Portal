import { icons } from "../../styles/icons";
import { Box, Typography, Tooltip, IconButton } from "@mui/material";
import { useSelector } from "react-redux";
import { selectIsClubContext, selectCurrentUser, selectPrimaryRole, selectActiveContext, logout } from "../../store/authSlice";
import { useNavigate } from "react-router-dom";
import clubService from "../../api/clubService";
import { useState, useEffect } from "react";
import SearchIcon from "@mui/icons-material/Search";
import NotificationCenter from "../NotificationCenter";
import ThemeSwitcher from "../ThemeSwitcher";
import ContextSwitcher from "../ContextSwitcher";
import { useDispatch } from "react-redux";
import authService from "../../api/authService";
import { Avatar, Menu, MenuItem, ListItemIcon, Divider } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import RoleSwitcher from "../RoleSwitcher";

export default function Header({ handleDrawer, setCommandPaletteOpen }) {
  const isClubContext = useSelector(selectIsClubContext);
  const primaryRole = useSelector(selectPrimaryRole);
  const activeContext = useSelector(selectActiveContext);
  const user = useSelector(selectCurrentUser);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [clubBadgeUrl, setClubBadgeUrl] = useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);

  // Fetch club badge when in club context
  useEffect(() => {
    const fetchClubBadge = async () => {
      if (isClubContext && activeContext?.clubId) {
        try {
          const response = await clubService.getClubById(activeContext.clubId);
          setClubBadgeUrl(response.data?.settings?.branding?.badgeUrl || null);
        } catch (error) {
          console.error("Error fetching club badge:", error);
          setClubBadgeUrl(null);
        }
      } else {
        setClubBadgeUrl(null);
      }
    };

    fetchClubBadge();
  }, [isClubContext, activeContext?.clubId]);

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch(logout());
      navigate("/login");
    }
  };

  return (
    <Box
      className="header main-content-px"
      sx={{ backgroundColor: "background.paper" }}>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <button
          className="header__menuBtn"
          onClick={handleDrawer}>
          {icons.menu}
        </button>
        <Box
          component="div"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mr: 4,
            cursor: "pointer",
          }}
          onClick={() => navigate(isClubContext ? `/clubs/${activeContext?.clubId}/dashboard` : "/dashboard")}>
          {/* AIM Icon */}
          {icons.aim}
          {/* Club Badge or AIM Text */}
          {isClubContext && clubBadgeUrl ? (
            <Box
              component="img"
              src={clubBadgeUrl}
              alt="Club Badge"
              sx={{
                height: { xs: 36, sm: 40 },
                width: { xs: 36, sm: 40 },
                objectFit: "contain",
                borderRadius: 1,
              }}
            />
          ) : (
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.125rem", sm: "1.25rem" },
                color: "text.primary",
                display: { xs: "none", sm: "block" },
              }}>
              AIM
            </Typography>
          )}
          {/* Portal Label */}
          <Typography
            variant="body1"
            sx={{
              fontWeight: 500,
              color: "text.secondary",
              fontSize: { xs: "0.875rem", sm: "1rem" },
              display: { xs: "none", md: "block" },
            }}>
            {isClubContext ? activeContext?.clubName || "Club Portal" : `${primaryRole === "player" ? "Player" : "Coach"} Portal`}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Tooltip title="Search (Cmd+K)">
          <IconButton
            onClick={() => setCommandPaletteOpen(true)}
            aria-label="search">
            <SearchIcon />
          </IconButton>
        </Tooltip>

        {/* Notification Center */}
        <NotificationCenter />

        {/* Theme Switcher */}
        <ThemeSwitcher />

        {/* Context Switcher */}
        <Box sx={{ display: { xs: "none", lg: "block" } }}>
          <ContextSwitcher />
        </Box>

        {/* Role Switcher (if user has multiple roles) - Legacy for coach/player */}
        <Box sx={{ display: { xs: "none", lg: "block" } }}>
          <RoleSwitcher />
        </Box>

        {/* User Menu */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="body2"
            sx={{ display: { xs: "none", md: "block" } }}>
            {user?.name}
          </Typography>
          <IconButton
            onClick={handleUserMenuOpen}
            size="small"
            aria-controls={Boolean(userMenuAnchor) ? "user-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={Boolean(userMenuAnchor) ? "true" : undefined}>
            <Avatar
              src={user?.profilePicture}
              sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}>
              {user?.name?.charAt(0) || "C"}
            </Avatar>
          </IconButton>
        </Box>

        {/* User Dropdown Menu */}
        <Menu
          anchorEl={userMenuAnchor}
          id="user-menu"
          open={Boolean(userMenuAnchor)}
          onClose={handleUserMenuClose}
          onClick={handleUserMenuClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}>
          <MenuItem
            onClick={() => navigate("/profile")}
            disabled>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            Profile
          </MenuItem>
          <MenuItem
            onClick={() => navigate("/settings")}
            disabled>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}
