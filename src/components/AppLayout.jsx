import React, { useState, useEffect, useRef } from "react";
import { Box, useTheme, useMediaQuery } from "@mui/material";
import PlatformAdminBanner from "./PlatformAdminBanner";
import CommandPalette from "./CommandPalette";
import Sidebar from "./layout/Sidebar";
import Header from "./layout/Header";
import "../assets/styles/global.scss";

const AppLayout = ({ children }) => {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));
  const prevIsTabletRef = useRef(isTablet);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [openDrawer, setOpenDrawer] = useState(() => {
    const isTabletOnInit = window.innerWidth < 1200;
    if (isTabletOnInit) {
      return false;
    }
    const savedDrawer = localStorage.getItem("drawer");
    return savedDrawer === null ? true : savedDrawer === "true";
  });

  useEffect(() => {
    if (!prevIsTabletRef.current && isTablet) {
      setOpenDrawer(false);
    }
    prevIsTabletRef.current = isTablet;
  }, [isTablet]);

  function handleDrawer() {
    setOpenDrawer((prev) => {
      const newValue = !prev;
      localStorage.setItem("drawer", newValue);
      return newValue;
    });
  }

  return (
    <div>
      <Header
        handleDrawer={handleDrawer}
        setCommandPaletteOpen={setCommandPaletteOpen}
      />
      <Box
        sx={{ display: "flex" }}
        className="main-layout">
        <Sidebar
          open={openDrawer}
          close={handleDrawer}
        />

        {/* Main Content */}
        <Box
          component="main"
          sx={{ flexGrow: 1 }}
          className="main-content">
          {/* Platform Admin Banner - shown when admin is viewing club in platform admin context */}
          <PlatformAdminBanner />
          {children}
        </Box>

        {/* Command Palette */}
        <CommandPalette
          open={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
        />
      </Box>
    </div>
  );
};

export default AppLayout;
