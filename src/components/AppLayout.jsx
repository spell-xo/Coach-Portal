import React, { useState, useEffect, useRef } from "react";
import { Box, useTheme, useMediaQuery } from "@mui/material";
import PlatformAdminBanner from "./PlatformAdminBanner";
import Sidebar from "./layout/Sidebar";
import BottomBar from "./BottomBar";
import MobileBottomBar from "./layout/MobileBottomBar";
import "../assets/styles/global.scss";

const AppLayout = ({ children, hideMobileBottomBar = false }) => {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));
  const isMobile = useMediaQuery("(max-width:767px)");
  const prevIsTabletRef = useRef(isTablet);

  const [openDrawer, setOpenDrawer] = useState(() => {
    const isTabletOnInit = window.innerWidth < 1200;
    if (isTabletOnInit) return false;
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
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f8f8f8" }}>
      {!isMobile && <Sidebar open={openDrawer} close={handleDrawer} />}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          pb: isMobile ? "72px" : 3,
        }}
        className="main-content"
      >
        <PlatformAdminBanner />
        {children}
      </Box>

      {isMobile ? (hideMobileBottomBar ? null : <MobileBottomBar />) : <BottomBar />}
    </Box>
  );
};

export default AppLayout;
