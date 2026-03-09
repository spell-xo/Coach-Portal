import React, { useCallback, useMemo, useState } from "react";
import { styled, useTheme } from "@mui/material/styles";
import { icons } from "../../styles/icons";
import { useMediaQuery, Drawer as MuiDrawer, List, ListItem, ListItemButton, ListItemIcon, Typography, Box, Divider, Collapse } from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { getMenuItems, openedMixin, closedMixin, isActive } from "../../helpers/sidebar";
import { logout, selectIsClubContext, selectActiveClubRole, selectIsPlatformAdmin, selectPrimaryRole, selectActiveContext, selectIsPlatformEngineering } from "../../store/authSlice";
import authService from "../../api/authService";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import ContextSwitcher from "../ContextSwitcher";
import RoleSwitcher from "../RoleSwitcher";

const drawerWidth = 280;

const DesktopDrawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== "open" })(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  variants: [
    {
      props: ({ open }) => open,
      style: {
        ...openedMixin(theme, drawerWidth),
        "& .MuiDrawer-paper": openedMixin(theme, drawerWidth),
      },
    },
    {
      props: ({ open }) => !open,
      style: {
        ...closedMixin(theme),
        "& .MuiDrawer-paper": closedMixin(theme),
      },
    },
    {
      style: {
        "& .MuiButtonBase-root ": {
          paddingTop: 0,
          paddingBottom: 0,
          "&:hover": {
            backgroundColor: "transparent",
          },
        },
        "& .MuiList-root": {
          paddingTop: "16px",
          borderTopLeftRadius: "8px",
        },
      },
    },
  ],
}));

const ListItemComponent = React.memo(({ item, location, navigate, isTablet, close, open, expandedMenus, toggleMenu }) => {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedMenus[item.label] || false;

  const handleClick = useCallback(() => {
    if (hasChildren) {
      toggleMenu(item.label);
    } else if (item.click) {
      item.click();
    } else {
      navigate(item.path);
      if (isTablet) {
        close();
      }
    }
  }, [item, navigate, isTablet, close, hasChildren, toggleMenu]);

  const isItemActive = item.path && isActive(location.pathname, item.path);
  const hasActiveChild = hasChildren && item.children.some(child => child.path && isActive(location.pathname, child.path));

  return (
    <>
      <ListItem
        disablePadding
        sx={{ display: "block" }}>
        <ListItemButton
          onClick={handleClick}
          sx={[
            {
              minHeight: 44,
              px: "16px",
              "&:hover": {
                backgroundColor: (isItemActive || hasActiveChild) ? "rgba(36, 255, 0, 0.12)" : "rgba(0, 0, 0, 0.04)",
              },
              backgroundColor: (isItemActive || hasActiveChild) ? "rgba(36, 255, 0, 0.08)" : "transparent",
            },
          ]}>
          <Box sx={{ display: "flex", alignItems: "center", width: "100%", borderRadius: "5px", transition: "0.2s" }}>
            <ListItemIcon
              className="sidebar__icon"
              sx={[
                {
                  minWidth: 0,
                  color: (isItemActive || hasActiveChild) ? "secondary.main" : "primary.light",
                },
                open
                  ? {
                      mr: "4px",
                    }
                  : {
                      mr: "auto",
                    },
              ]}>
              {item.icon}
            </ListItemIcon>
            <Typography
              sx={{
                color: (isItemActive || hasActiveChild) ? "primary.main" : "primary.light",
                fontWeight: (isItemActive || hasActiveChild) ? 600 : 500,
                opacity: open ? 1 : 0,
                flex: 1,
              }}>
              {item.label}
            </Typography>
            {hasChildren && open && (
              isExpanded ? <ExpandLess sx={{ color: "primary.light" }} /> : <ExpandMore sx={{ color: "primary.light" }} />
            )}
          </Box>
        </ListItemButton>
      </ListItem>
      {hasChildren && (
        <Collapse in={isExpanded && open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {item.children.map((child) => (
              <ListItem
                key={child.label}
                disablePadding
                sx={{ display: "block" }}>
                <ListItemButton
                  onClick={() => {
                    navigate(child.path);
                    if (isTablet) {
                      close();
                    }
                  }}
                  sx={[
                    {
                      minHeight: 40,
                      pl: "48px",
                      pr: "16px",
                      "&:hover": {
                        backgroundColor: isActive(location.pathname, child.path) ? "rgba(36, 255, 0, 0.12)" : "rgba(0, 0, 0, 0.04)",
                      },
                      backgroundColor: isActive(location.pathname, child.path) ? "rgba(36, 255, 0, 0.08)" : "transparent",
                    },
                  ]}>
                  <Typography
                    sx={{
                      color: isActive(location.pathname, child.path) ? "primary.main" : "primary.light",
                      fontWeight: isActive(location.pathname, child.path) ? 600 : 500,
                      fontSize: "0.9rem",
                    }}>
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

ListItemComponent.displayName = "ListItemComponent";

export default function Sidebar({ open, close }) {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));
  const isClubContext = useSelector(selectIsClubContext);
  const activeClubRole = useSelector(selectActiveClubRole);
  const isPlatformAdmin = useSelector(selectIsPlatformAdmin);
  const primaryRole = useSelector(selectPrimaryRole);
  const activeContext = useSelector(selectActiveContext);
  const isPlatformEngineering = useSelector(selectIsPlatformEngineering);
  const location = useLocation();
  const menuItems = useMemo(() => getMenuItems(isClubContext, activeClubRole, isPlatformAdmin, primaryRole, activeContext, isPlatformEngineering), [isClubContext, activeClubRole, isPlatformAdmin, primaryRole, activeContext, isPlatformEngineering]);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Track which menus are expanded
  const [expandedMenus, setExpandedMenus] = useState({});

  // Auto-expand parent menu if current path matches a child item
  React.useEffect(() => {
    const newExpandedMenus = {};
    menuItems.forEach(item => {
      if (item.children && item.children.length > 0) {
        const hasActiveChild = item.children.some(child =>
          child.path && isActive(location.pathname, child.path)
        );
        if (hasActiveChild) {
          newExpandedMenus[item.label] = true;
        }
      }
    });
    setExpandedMenus(prev => ({ ...prev, ...newExpandedMenus }));
  }, [location.pathname, menuItems]);

  const toggleMenu = useCallback((menuLabel) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuLabel]: !prev[menuLabel]
    }));
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

  const logoutItem = useMemo(() => ({ label: "Logout", click: handleLogout, icon: icons.logout }), [handleLogout]);

  const DrawerContent = useMemo(
    () => (
      <List>
        {isTablet && (
          <div>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "8px 16px 6px" }}>
              <button onClick={close}>{icons.close}</button>
            </Box>
            <Box>
              <ContextSwitcher />
              <Divider />
              <RoleSwitcher />
              <Divider />
            </Box>
          </div>
        )}
        {menuItems.map((item) => (
          <ListItemComponent
            key={item.label}
            item={item}
            location={location}
            navigate={navigate}
            isTablet={isTablet}
            close={close}
            open={open}
            expandedMenus={expandedMenus}
            toggleMenu={toggleMenu}
          />
        ))}
        <ListItemComponent
          item={logoutItem}
          location={location}
          navigate={navigate}
          isTablet={isTablet}
          close={close}
          open={open}
          expandedMenus={expandedMenus}
          toggleMenu={toggleMenu}
        />
      </List>
    ),
    [menuItems, isTablet, close, location, navigate, open, logoutItem, expandedMenus, toggleMenu]
  );

  return (
    <div>
      {isTablet ? (
        <MuiDrawer
          variant="temporary"
          open={open}
          onClose={close}
          className="sidebar"
          ModalProps={{
            keepMounted: true,
          }}>
          {DrawerContent}
        </MuiDrawer>
      ) : (
        <DesktopDrawer
          variant="permanent"
          className="sidebar"
          open={open}>
          {DrawerContent}
        </DesktopDrawer>
      )}
    </div>
  );
}
