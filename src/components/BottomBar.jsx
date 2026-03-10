import React, { useState, useEffect } from "react";
import { Box, Fab, Badge, Popover, Typography, List, ListItem, ListItemText, ListItemAvatar, Avatar, Button, Divider, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ChatIcon from "@mui/icons-material/Chat";
import GroupIcon from "@mui/icons-material/Group";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import MessageIcon from "@mui/icons-material/Message";
import SportsIcon from "@mui/icons-material/Sports";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import ExpandAcademyModal from "./ExpandAcademyModal";
import { useSelector } from "react-redux";
import { selectIsClubContext, selectActiveContext } from "../store/authSlice";
import { useNavigate } from "react-router-dom";

const fabBase = {
  width: 55,
  height: 55,
  boxShadow: "0 0 15px rgba(0,0,0,0.1)",
  border: "1.375px solid #ebebeb",
};

const greenBadgeSx = {
  "& .MuiBadge-badge": {
    bgcolor: "#24FF00",
    color: "#000",
    fontWeight: 600,
    fontSize: 11,
    minWidth: 16,
    height: 16,
  },
};

const mockNotifications = [
  {
    id: 1,
    type: "team_invite",
    title: "New Team Invitation",
    message: "You have been invited to join U18 Premier Squad",
    icon: GroupIcon,
    color: "primary",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    read: false,
    actionUrl: "/player/invitations",
  },
  {
    id: 2,
    type: "player_joined",
    title: "Player Accepted Invitation",
    message: "John Smith has joined your team",
    icon: PersonAddIcon,
    color: "success",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
    actionUrl: "/teams",
  },
  {
    id: 3,
    type: "message",
    title: "New Message",
    message: "Coach Mike sent you a message",
    icon: MessageIcon,
    color: "info",
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    read: true,
    actionUrl: "/messages",
  },
  {
    id: 4,
    type: "staff_added",
    title: "Staff Member Added",
    message: "Sarah Johnson was added as Assistant Coach",
    icon: SportsIcon,
    color: "secondary",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: true,
    actionUrl: "/staff",
  },
];

const BottomBar = () => {
  const [expandOpen, setExpandOpen] = useState(false);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isClubContext = useSelector(selectIsClubContext);
  const activeContext = useSelector(selectActiveContext);
  const navigate = useNavigate();

  useEffect(() => {
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter((n) => !n.read).length);
  }, []);

  const markAsRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleNotifClick = (notification) => {
    markAsRead(notification.id);
    setNotifAnchor(null);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleMessagesClick = () => {
    const clubId = activeContext?.clubId;
    if (isClubContext && clubId) {
      navigate(`/clubs/${clubId}/messages`);
    } else {
      navigate("/messages");
    }
  };

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
          display: "flex",
          gap: "5px",
          alignItems: "center",
          zIndex: 1200,
        }}
      >
        {isClubContext && (
          <Fab
            component={motion.button}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setExpandOpen(true)}
            sx={{
              ...fabBase,
              bgcolor: "#24FF00",
              color: "#000",
              "&:hover": { bgcolor: "#1ecc00" },
            }}
          >
            <AddIcon sx={{ fontSize: 27 }} />
          </Fab>
        )}

        <Fab
          component={motion.button}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => setNotifAnchor(e.currentTarget)}
          sx={{
            ...fabBase,
            bgcolor: "#fff",
            color: "#000",
            "&:hover": { bgcolor: "#f5f5f5" },
          }}
        >
          <Badge badgeContent={unreadCount} sx={greenBadgeSx}>
            <NotificationsIcon sx={{ fontSize: 27 }} />
          </Badge>
        </Fab>

        <Fab
          component={motion.button}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleMessagesClick}
          sx={{
            ...fabBase,
            bgcolor: "#fff",
            color: "#000",
            "&:hover": { bgcolor: "#f5f5f5" },
          }}
        >
          <Badge badgeContent={3} sx={greenBadgeSx}>
            <ChatIcon sx={{ fontSize: 27 }} />
          </Badge>
        </Fab>
      </Box>

      <ExpandAcademyModal open={expandOpen} onClose={() => setExpandOpen(false)} />

      {/* Notifications Popover */}
      <Popover
        open={Boolean(notifAnchor)}
        anchorEl={notifAnchor}
        onClose={() => setNotifAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "right" }}
        PaperProps={{
          sx: { width: 400, maxHeight: 600, overflow: "hidden", mb: 1 },
        }}
      >
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={markAllAsRead} startIcon={<CheckCircleIcon />}>
              Mark all read
            </Button>
          )}
        </Box>

        <Box sx={{ maxHeight: 500, overflowY: "auto" }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <NotificationsNoneIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
              <Typography variant="body1" color="text.secondary">No notifications yet</Typography>
            </Box>
          ) : (
            <List disablePadding>
              <AnimatePresence>
                {notifications.map((notification, index) => (
                  <Box key={notification.id}>
                    <ListItem
                      component={motion.div}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      button
                      onClick={() => handleNotifClick(notification)}
                      sx={{
                        py: 2,
                        px: 2,
                        bgcolor: notification.read ? "transparent" : "action.hover",
                        "&:hover": { bgcolor: notification.read ? "action.hover" : "action.selected" },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: `${notification.color}.main`, width: 40, height: 40 }}>
                          <notification.icon fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: notification.read ? 400 : 600 }}>
                              {notification.title}
                            </Typography>
                            {!notification.read && (
                              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main" }} />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {notification.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < notifications.length - 1 && <Divider />}
                  </Box>
                ))}
              </AnimatePresence>
            </List>
          )}
        </Box>

        {notifications.length > 0 && (
          <Box sx={{ p: 1.5, borderTop: "1px solid", borderColor: "divider", textAlign: "center" }}>
            <Button size="small" fullWidth onClick={() => setNotifAnchor(null)}>
              View All Notifications
            </Button>
          </Box>
        )}
      </Popover>
    </>
  );
};

export default BottomBar;
