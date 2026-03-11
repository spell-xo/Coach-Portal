import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useTheme } from "@mui/material/styles";
import { icons } from "../../styles/icons";
import {
  useMediaQuery,
  Drawer as MuiDrawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Typography,
  Box,
  Divider,
  Collapse,
  Tooltip,
  Popover,
  InputBase,
  CircularProgress,
  ClickAwayListener,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PersonIcon from "@mui/icons-material/Person";
import CheckIcon from "@mui/icons-material/Check";
import { getMenuItems, isActive } from "../../helpers/sidebar";
import {
  logout,
  selectIsClubContext,
  selectActiveClubRole,
  selectIsPlatformAdmin,
  selectPrimaryRole,
  selectActiveContext,
  selectIsPlatformEngineering,
  selectCurrentUser,
  selectAvailableContexts,
  selectHasMultipleContexts,
  setActiveContext,
} from "../../store/authSlice";
import authService from "../../api/authService";
import clubService from "../../api/clubService";
import contextService from "../../api/contextService";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme as useAppTheme } from "../../contexts/ThemeContext";
import ContextSwitcher from "../ContextSwitcher";
import RoleSwitcher from "../RoleSwitcher";

const DRAWER_WIDTH_OPEN = 270;
const DRAWER_WIDTH_CLOSED = 80;
const SIDEBAR_MARGIN = 15;

const AimLogoVector = () => (
  <svg width="21" height="25" viewBox="275 208 105 125" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M295.4 228.6H315.9V252.8L295.4 275.7V228.6ZM356.1 208L336.5 229.9V208H275V310.6L295.5 331.1V306.1L316 283.2V331.1H336.5V260.3L357 237.4V331.1L377.5 310.6V208H356H356.1Z"
      fill="currentColor"
    />
  </svg>
);

const NavItem = React.memo(({ item, location, navigate, isTablet, closeSidebar, sidebarOpen, expandedMenus, toggleMenu }) => {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedMenus[item.label] || false;
  const isItemActive = item.path && isActive(location.pathname, item.path);
  const hasActiveChild = hasChildren && item.children.some((child) => child.path && isActive(location.pathname, child.path));

  const handleClick = useCallback(() => {
    if (hasChildren) {
      toggleMenu(item.label);
    } else if (item.click) {
      item.click();
    } else {
      navigate(item.path);
      if (isTablet) closeSidebar();
    }
  }, [item, navigate, isTablet, closeSidebar, hasChildren, toggleMenu]);

  return (
    <>
      <ListItem disablePadding sx={{ display: "block" }}>
        <ListItemButton
          onClick={handleClick}
          sx={{
            minHeight: 38,
            px: sidebarOpen ? "15px" : "0",
            py: "7px",
            borderRadius: 0,
            justifyContent: sidebarOpen ? "flex-start" : "center",
            bgcolor: (isItemActive || hasActiveChild) ? "#24FF00" : "transparent",
              "&:hover": {
              bgcolor: (isItemActive || hasActiveChild) ? "#24FF00" : "rgba(0,0,0,0.04)",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: sidebarOpen ? "flex-start" : "center",
              width: "100%",
              gap: sidebarOpen ? "10px" : 0,
              p: "5px",
            }}
          >
            <ListItemIcon
              sx={{
                  minWidth: 0,
                color: (isItemActive || hasActiveChild) ? "#000" : "#545963",
                "& .MuiSvgIcon-root": { fontSize: 24 },
              }}
            >
              {item.icon}
            </ListItemIcon>
            {sidebarOpen && (
              <>
            <Typography
              sx={{
                    fontSize: 16,
                    fontWeight: (isItemActive || hasActiveChild) ? 700 : 500,
                    color: (isItemActive || hasActiveChild) ? "#000" : "#545963",
                flex: 1,
                    letterSpacing: "-0.05px",
                    whiteSpace: "nowrap",
                  }}
                >
              {item.label}
            </Typography>
                {hasChildren && (isExpanded ? <ExpandLess sx={{ color: "#545963" }} /> : <ExpandMore sx={{ color: "#545963" }} />)}
              </>
            )}
          </Box>
        </ListItemButton>
      </ListItem>
      {hasChildren && (
        <Collapse in={isExpanded && sidebarOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {item.children.map((child) => (
              <ListItem key={child.label} disablePadding sx={{ display: "block" }}>
                <ListItemButton
                  onClick={() => {
                    navigate(child.path);
                    if (isTablet) closeSidebar();
                  }}
                  sx={{
                    minHeight: 36,
                    pl: "54px",
                    pr: "15px",
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
    </>
  );
});

NavItem.displayName = "NavItem";

const formatRole = (role) => {
  if (!role) return "";
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export default function Sidebar({ open, close }) {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));
  const isClubContext = useSelector(selectIsClubContext);
  const activeClubRole = useSelector(selectActiveClubRole);
  const isPlatformAdmin = useSelector(selectIsPlatformAdmin);
  const primaryRole = useSelector(selectPrimaryRole);
  const activeContext = useSelector(selectActiveContext);
  const isPlatformEngineering = useSelector(selectIsPlatformEngineering);
  const user = useSelector(selectCurrentUser);
  const availableContexts = useSelector(selectAvailableContexts);
  const hasMultipleContexts = useSelector(selectHasMultipleContexts);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [expandedMenus, setExpandedMenus] = useState({});
  const [clubBadgeUrl, setClubBadgeUrl] = useState(null);
  const [switcherAnchor, setSwitcherAnchor] = useState(null);
  const [switching, setSwitching] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [allTeams, setAllTeams] = useState([]);
  const [teamsLoaded, setTeamsLoaded] = useState(false);
  const searchInputRef = useRef(null);

  const themeCtx = useAppTheme();

  const menuItems = useMemo(
    () => getMenuItems(isClubContext, activeClubRole, isPlatformAdmin, primaryRole, activeContext, isPlatformEngineering),
    [isClubContext, activeClubRole, isPlatformAdmin, primaryRole, activeContext, isPlatformEngineering]
  );

  useEffect(() => {
    const fetchClubBadge = async () => {
      if (isClubContext && activeContext?.clubId) {
        try {
          const response = await clubService.getClubById(activeContext.clubId);
          setClubBadgeUrl(response.data?.settings?.branding?.badgeUrl || null);
        } catch (error) {
          setClubBadgeUrl(null);
        }
      } else {
        setClubBadgeUrl(null);
      }
    };
    fetchClubBadge();
  }, [isClubContext, activeContext?.clubId]);

  useEffect(() => {
    if (isClubContext && activeContext?.clubId && !teamsLoaded) {
      clubService
        .getTeams(activeContext.clubId)
        .then((res) => {
          setAllTeams(res.data?.teams || res.data || []);
          setTeamsLoaded(true);
        })
        .catch(() => setAllTeams([]));
    }
  }, [isClubContext, activeContext?.clubId, teamsLoaded]);

  useEffect(() => {
    const newExpanded = {};
    menuItems.forEach((item) => {
      if (item.children?.length > 0) {
        const hasActiveChild = item.children.some((child) => child.path && isActive(location.pathname, child.path));
        if (hasActiveChild) newExpanded[item.label] = true;
      }
    });
    setExpandedMenus((prev) => ({ ...prev, ...newExpanded }));
  }, [location.pathname, menuItems]);

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
    }
  }, [dispatch, navigate]);

  const handleContextSwitch = async (context) => {
    const isActiveCtx =
      activeContext?.type === context.type &&
      activeContext?.clubId === context.clubId &&
      activeContext?.role === context.role;

    if (isActiveCtx) {
      setSwitcherAnchor(null);
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
      setSwitcherAnchor(null);
    }
  };

  const isActiveCtx = (context) => {
    return activeContext?.type === context.type && activeContext?.clubId === context.clubId && activeContext?.role === context.role;
  };

  // Search handler
  const handleSearchChange = useCallback(
    (value) => {
      setSearchQuery(value);
      if (!value.trim()) {
        setSearchResults([]);
        setSearchOpen(false);
        return;
      }
      const lower = value.toLowerCase();
      const filtered = allTeams.filter(
        (t) => (t.name || "").toLowerCase().includes(lower) || (t.ageGroup || "").toLowerCase().includes(lower)
      );
      setSearchResults(filtered);
      setSearchOpen(true);
    },
    [allTeams]
  );

  const handleSearchSelect = useCallback(
    (team) => {
      setSearchQuery("");
      setSearchResults([]);
      setSearchOpen(false);
      if (activeContext?.clubId) {
        navigate(`/clubs/${activeContext.clubId}/teams/${team._id || team.id}`);
      }
    },
    [navigate, activeContext?.clubId]
  );

  const drawerWidth = open ? DRAWER_WIDTH_OPEN : DRAWER_WIDTH_CLOSED;

  const sidebarContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* === TOP SECTION (fixed) === */}
      <Box sx={{ flexShrink: 0 }}>
        {/* Logo + Collapse Toggle */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: open ? "space-between" : "center",
            px: open ? "15px" : "0",
            py: "25px",
          }}
        >
          {open && (
            <Box
              sx={{ display: "flex", gap: "10px", alignItems: "center", cursor: "pointer" }}
              onClick={() => navigate(isClubContext ? `/clubs/${activeContext?.clubId}/dashboard` : "/dashboard")}
            >
              <AimLogoVector />
              <Typography
                sx={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: "#000",
                  letterSpacing: "0.13px",
                  textTransform: "uppercase",
                  lineHeight: "23px",
                }}
              >
                AIM
              </Typography>
            </Box>
          )}
          <Box
            onClick={close}
            sx={{
              bgcolor: "#f3f4f6",
              borderRadius: "5px",
              p: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              "&:hover": { bgcolor: "#e8e9eb" },
            }}
          >
            {open ? <CloseIcon sx={{ fontSize: 24 }} /> : <MenuIcon sx={{ fontSize: 24 }} />}
          </Box>
        </Box>

        {/* Search Bar */}
        {open && (
          <Box sx={{ px: "12px", pb: "12px", position: "relative" }}>
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
              <InputBase
                ref={searchInputRef}
                placeholder="Search commands..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => { if (searchQuery.trim()) setSearchOpen(true); }}
                sx={{ flex: 1, fontSize: 14, fontWeight: 500, color: "#000" }}
              />
            </Box>
            {searchOpen && searchResults.length > 0 && (
              <ClickAwayListener onClickAway={() => setSearchOpen(false)}>
                <Box
                  sx={{
                    position: "absolute",
                    top: "100%",
                    left: "12px",
                    right: "12px",
                    bgcolor: "#fff",
                    border: "1px solid #ebebeb",
                    borderRadius: "7.5px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    maxHeight: 280,
                    overflowY: "auto",
                    zIndex: 10,
                  }}
                >
                  {searchResults.map((team) => (
                    <Box
                      key={team._id || team.id}
                      onClick={() => handleSearchSelect(team)}
                      sx={{
                        px: "12px",
                        py: "10px",
                        cursor: "pointer",
                        borderBottom: "1px solid #f3f4f6",
                        "&:hover": { bgcolor: "#f9f9f9" },
                        "&:last-child": { borderBottom: "none" },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#000" }}>
                          {team.name}
                        </Typography>
                        {(team.status === "active" || team.status === "Active") && (
                          <Box sx={{ bgcolor: "rgba(36,255,0,0.15)", borderRadius: "4px", px: "6px", py: "1px" }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#1CC900" }}>Active</Typography>
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ display: "flex", gap: "12px", mt: "2px" }}>
                        {team.playerCount !== undefined && (
                          <Typography sx={{ fontSize: 12, color: "#545963" }}>{team.playerCount} players</Typography>
                        )}
                        {team.coachCount !== undefined && (
                          <Typography sx={{ fontSize: 12, color: "#545963" }}>{team.coachCount} coaches</Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </ClickAwayListener>
            )}
            {searchOpen && searchQuery.trim() && searchResults.length === 0 && (
              <ClickAwayListener onClickAway={() => setSearchOpen(false)}>
                <Box
                  sx={{
                    position: "absolute",
                    top: "100%",
                    left: "12px",
                    right: "12px",
                    bgcolor: "#fff",
                    border: "1px solid #ebebeb",
                    borderRadius: "7.5px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    p: "16px",
                    textAlign: "center",
                    zIndex: 10,
                  }}
                >
                  <Typography sx={{ fontSize: 13, color: "#545963" }}>No results found</Typography>
                </Box>
              </ClickAwayListener>
            )}
          </Box>
        )}

        {/* Tablet context/role switchers */}
        {isTablet && open && (
          <Box sx={{ px: "12px", pb: "8px" }}>
            <ContextSwitcher />
            <Divider sx={{ my: 1 }} />
            <RoleSwitcher />
            <Divider sx={{ my: 1 }} />
          </Box>
        )}
      </Box>

      {/* === MIDDLE SECTION (scrollable) === */}
      <List
        disablePadding
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-thumb": { bgcolor: "#d0d5dd", borderRadius: 2 },
        }}
      >
        {menuItems.map((item) => (
          <NavItem
            key={item.label}
            item={item}
            location={location}
            navigate={navigate}
            isTablet={isTablet}
            closeSidebar={close}
            sidebarOpen={open}
            expandedMenus={expandedMenus}
            toggleMenu={toggleMenu}
          />
        ))}
      </List>

      {/* === BOTTOM SECTION (fixed) === */}
      <Box sx={{ flexShrink: 0 }}>
        {/* Academy Switcher Card */}
        <Box sx={{ px: "12px", pb: "8px" }}>
          <Box
            onClick={(e) => hasMultipleContexts && setSwitcherAnchor(e.currentTarget)}
            sx={{
              bgcolor: "#f3f4f6",
              borderRadius: "7.5px",
              p: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: open ? "space-between" : "center",
              cursor: hasMultipleContexts ? "pointer" : "default",
              "&:hover": hasMultipleContexts ? { bgcolor: "#ecedf0" } : {},
            }}
          >
            <Box sx={{ display: "flex", alignItems: open ? "flex-start" : "center", flexDirection: open ? "column" : "row", gap: "5px" }}>
              {clubBadgeUrl ? (
                <Box
                  component="img"
                  src={clubBadgeUrl}
                  alt="Club badge"
                  sx={{ width: 32, height: 32, borderRadius: "50%", border: "0.45px solid #ededed", objectFit: "cover" }}
                />
              ) : (
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    bgcolor: "#e0e0e0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <AimLogoVector />
                </Box>
              )}
              {open && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <Typography
                    sx={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#000",
                      letterSpacing: "-0.05px",
                      lineHeight: 1.19,
                      maxWidth: 185,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {activeContext?.clubName || user?.name || "AIM Portal"}
                  </Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#545963", letterSpacing: "-0.04px" }}>
                    {activeContext?.role ? formatRole(activeContext.role) : primaryRole || "Coach"}
                  </Typography>
                </Box>
              )}
            </Box>
            {open && hasMultipleContexts && (
              <ExpandMoreIcon sx={{ fontSize: 20, color: "#545963" }} />
            )}
          </Box>
        </Box>

        {/* Academy Switcher Popover */}
        <Popover
          open={Boolean(switcherAnchor)}
          anchorEl={switcherAnchor}
          onClose={() => setSwitcherAnchor(null)}
          anchorOrigin={{ vertical: "top", horizontal: "left" }}
          transformOrigin={{ vertical: "bottom", horizontal: "left" }}
          PaperProps={{
            sx: {
              width: 260,
              borderRadius: "7.5px",
              border: "1px solid #ebebeb",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              mb: 1,
              maxHeight: 360,
              overflowY: "auto",
            },
          }}
        >
          {switching && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={20} sx={{ color: "#24FF00" }} />
            </Box>
          )}
          {availableContexts?.map((context) => {
            const active = isActiveCtx(context);
            return (
              <Box
                key={`${context.type}-${context.clubId || "personal"}`}
                onClick={() => handleContextSwitch(context)}
                sx={{
                  px: "12px",
                  py: "10px",
                  cursor: switching ? "wait" : "pointer",
                  bgcolor: active ? "rgba(36,255,0,0.12)" : "transparent",
                  "&:hover": { bgcolor: active ? "rgba(36,255,0,0.18)" : "rgba(0,0,0,0.04)" },
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  borderBottom: "1px solid #f3f4f6",
                  "&:last-child": { borderBottom: "none" },
                }}
              >
                {context.type === "personal" ? (
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 18, color: "#545963" }} />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: "#e0e0e0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#545963" }}>
                      {(context.clubName || "C").charAt(0)}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: active ? 600 : 500, color: "#000" }} noWrap>
                    {context.type === "personal" ? "Personal Training" : context.clubName}
                  </Typography>
                  {context.type === "club" && context.role && (
                    <Typography sx={{ fontSize: 11, color: "#545963" }}>
                      {formatRole(context.role)}
                    </Typography>
                  )}
                </Box>
                {active && <CheckIcon sx={{ fontSize: 18, color: "#24FF00", flexShrink: 0 }} />}
              </Box>
            );
          })}
        </Popover>

        <Divider sx={{ mx: "12px" }} />

        {/* Dark Mode / Settings / Logout */}
        <Box
          sx={{
            display: "flex",
            gap: "5px",
            p: "12px",
            flexDirection: open ? "row" : "column",
          }}
        >
          <Tooltip title="Dark Mode" placement="top">
            <Box
              onClick={themeCtx.toggleDarkMode}
              sx={{
                flex: open ? 1 : undefined,
                width: open ? undefined : "100%",
                height: open ? 55 : 52,
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
          </Tooltip>
          <Tooltip title="Settings" placement="top">
            <Box
              sx={{
                flex: open ? 1 : undefined,
                width: open ? undefined : "100%",
                height: open ? 55 : 52,
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
          </Tooltip>
          <Tooltip title="Logout" placement="top">
            <Box
              onClick={handleLogout}
              sx={{
                flex: open ? 1 : undefined,
                width: open ? undefined : "100%",
                height: open ? 55 : 52,
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
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  const paperStyles = {
    bgcolor: "#fff",
    border: "1px solid #ebebeb",
    borderRadius: "15px",
    boxShadow: "0px 0px 20px 0px rgba(0,0,0,0.05)",
    overflow: "hidden",
    height: `calc(100vh - ${SIDEBAR_MARGIN * 2}px)`,
    top: SIDEBAR_MARGIN,
    left: SIDEBAR_MARGIN,
    position: "fixed",
  };

  if (isTablet) {
  return (
        <MuiDrawer
          variant="temporary"
          open={open}
          onClose={close}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            ...paperStyles,
            width: DRAWER_WIDTH_OPEN,
            position: "fixed",
          },
        }}
      >
        {sidebarContent}
        </MuiDrawer>
    );
  }

  return (
    <Box
      sx={{
        width: drawerWidth + SIDEBAR_MARGIN,
        flexShrink: 0,
        transition: "width 0.25s ease",
      }}
    >
      <Box
        sx={{
          ...paperStyles,
          width: drawerWidth,
          transition: "width 0.25s ease",
        }}
      >
        {sidebarContent}
      </Box>
    </Box>
  );
}
