import React, { useState } from "react";
import { Box, Badge } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ChatIcon from "@mui/icons-material/Chat";
import MenuIcon from "@mui/icons-material/Menu";
import { useSelector } from "react-redux";
import { selectIsClubContext, selectActiveContext } from "../../store/authSlice";
import ExpandAcademyModal from "../ExpandAcademyModal";
import MobileNav from "./MobileNav";
import MobileNotifications from "../MobileNotifications";
import MobileMessages from "../MobileMessages";
import MobileAcademySwitcher from "../MobileAcademySwitcher";

const BOTTOM_BAR_HEIGHT = 60;

const MobileBottomBar = () => {
  const [expandOpen, setExpandOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const isClubContext = useSelector(selectIsClubContext);
  const activeContext = useSelector(selectActiveContext);

  const clubBadgeUrl = null;
  const hasOverlayOpen = expandOpen || navOpen || notifOpen || messagesOpen || switcherOpen;

  return (
    <>
      {!hasOverlayOpen && <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 66,
          bgcolor: "#fff",
          borderTop: "1px solid #ebebeb",
          display: "flex",
          alignItems: "stretch",
          justifyContent: "space-between",
          zIndex: 1300,
          px: "10px",
          py: "10px",
          gap: "5px",
        }}
      >
        {isClubContext && (
          <Box
            onClick={() => setExpandOpen(true)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flex: 1,
              bgcolor: "#24FF00",
              borderRadius: "7.5px",
            }}
          >
            <AddIcon sx={{ fontSize: 22, color: "#000" }} />
          </Box>
        )}

        <Box
          onClick={() => setNotifOpen(true)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flex: 1,
            bgcolor: "#F3F4F6",
            borderRadius: "7.5px",
          }}
        >
          <Badge badgeContent={3} sx={{ "& .MuiBadge-badge": { bgcolor: "#24FF00", color: "#000", fontSize: 9, minWidth: 14, height: 14 } }}>
            <NotificationsIcon sx={{ fontSize: 22, color: "#545963" }} />
          </Badge>
        </Box>

        <Box
          onClick={() => setMessagesOpen(true)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flex: 1,
            bgcolor: "#F3F4F6",
            borderRadius: "7.5px",
          }}
        >
          <Badge badgeContent={3} sx={{ "& .MuiBadge-badge": { bgcolor: "#24FF00", color: "#000", fontSize: 9, minWidth: 14, height: 14 } }}>
            <ChatIcon sx={{ fontSize: 22, color: "#545963" }} />
          </Badge>
        </Box>

        <Box
          onClick={() => setSwitcherOpen(true)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flex: 1,
            bgcolor: "#F3F4F6",
            borderRadius: "7.5px",
          }}
        >
          {clubBadgeUrl ? (
            <Box component="img" src={clubBadgeUrl} alt="" sx={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <Box sx={{ width: 24, height: 24, borderRadius: "50%", bgcolor: "#e0e0e0", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="12" height="14" viewBox="275 208 105 125" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M295.4 228.6H315.9V252.8L295.4 275.7V228.6ZM356.1 208L336.5 229.9V208H275V310.6L295.5 331.1V306.1L316 283.2V331.1H336.5V260.3L357 237.4V331.1L377.5 310.6V208H356H356.1Z" fill="#545963" />
              </svg>
            </Box>
          )}
        </Box>

        <Box
          onClick={() => setNavOpen(true)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flex: 1,
            border: "1px solid #ebebeb",
            borderRadius: "7.5px",
          }}
        >
          <MenuIcon sx={{ fontSize: 22, color: "#545963" }} />
        </Box>
      </Box>}

      <ExpandAcademyModal open={expandOpen} onClose={() => setExpandOpen(false)} />
      <MobileNav open={navOpen} onClose={() => setNavOpen(false)} />
      <MobileNotifications open={notifOpen} onClose={() => setNotifOpen(false)} />
      <MobileMessages open={messagesOpen} onClose={() => setMessagesOpen(false)} />
      <MobileAcademySwitcher open={switcherOpen} onClose={() => setSwitcherOpen(false)} />
    </>
  );
};

export { BOTTOM_BAR_HEIGHT };
export default MobileBottomBar;
