import React, { useState } from "react";
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider, Box, Typography, Switch, Tooltip } from "@mui/material";
import { motion } from "framer-motion";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import PaletteIcon from "@mui/icons-material/Palette";
import CheckIcon from "@mui/icons-material/Check";
import { useTheme } from "../contexts/ThemeContext";

const themeOptions = [
  {
    id: "blackPrimary",
    name: "Black Primary",
    description: "Black primary with AIM Green accents",
    colors: ["#000000", "#24FF00"],
  },
  {
    id: "mutedGreen",
    name: "Muted Green",
    description: "Professional darker green primary",
    colors: ["#039855", "#000000"],
  },
  {
    id: "minimalGreen",
    name: "Minimal Green",
    description: "Black primary, green for highlights only",
    colors: ["#000000", "#616E7C", "#24FF00"],
  },
  {
    id: "brightGreen",
    name: "Bright Green",
    description: "AIM Green primary with black accents",
    colors: ["#24FF00", "#000000"],
  },
];

const ThemeSwitcher = () => {
  const { themeMode, setTheme, toggleDarkMode, isDarkMode } = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleThemeSelect = (themeId) => {
    setTheme(themeId);
    handleClose();
  };

  return (
    <>
      <Tooltip title="Theme Settings">
        <IconButton
          onClick={handleOpen}
          color="inherit"
          aria-label="theme settings">
          <PaletteIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            width: 320,
            mt: 1,
          },
        }}>
        {/* Dark Mode Toggle */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {isDarkMode ? <Brightness4Icon sx={{ color: "text.secondary" }} /> : <Brightness7Icon sx={{ color: "text.secondary" }} />}
              <Typography
                variant="body2"
                sx={{ fontWeight: 600 }}>
                Dark Mode
              </Typography>
            </Box>
            <Switch
              checked={isDarkMode}
              onChange={toggleDarkMode}
              size="small"
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: "secondary.main",
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "secondary.main",
                },
              }}
            />
          </Box>
        </Box>

        <Divider />

        {/* Theme Variants (only shown in light mode) */}
        {!isDarkMode && (
          <>
            <Box sx={{ px: 2, py: 1, bgcolor: "action.hover" }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600 }}>
                THEME VARIANTS
              </Typography>
            </Box>

            {themeOptions.map((theme, index) => (
              <MenuItem
                key={theme.id}
                onClick={() => handleThemeSelect(theme.id)}
                selected={themeMode === theme.id}
                component={motion.div}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                sx={{
                  py: 1.5,
                  px: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}>
                {/* Color Preview */}
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  {theme.colors.map((color, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 1,
                        bgcolor: color,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    />
                  ))}
                </Box>

                {/* Theme Info */}
                <ListItemText
                  primary={theme.name}
                  secondary={theme.description}
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: 500,
                  }}
                  secondaryTypographyProps={{
                    variant: "caption",
                  }}
                />

                {/* Check Icon */}
                {themeMode === theme.id && (
                  <ListItemIcon sx={{ minWidth: "auto" }}>
                    <CheckIcon
                      fontSize="small"
                      color="secondary"
                    />
                  </ListItemIcon>
                )}
              </MenuItem>
            ))}
          </>
        )}

        {/* Footer Info */}
        <Divider />
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography
            variant="caption"
            color="text.secondary">
            Theme preferences are saved locally
          </Typography>
        </Box>
      </Menu>
    </>
  );
};

export default ThemeSwitcher;
