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
import SearchIcon from "@mui/icons-material/Search";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import ExpandAcademyModal from "./ExpandAcademyModal";
import { useSelector } from "react-redux";
import { selectIsClubContext } from "../store/authSlice";
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
    bgColor: "#000000",
    iconColor: "#FFFFFF",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    timeLabel: "11 minutes ago",
    read: false,
    actionUrl: "/player/invitations",
  },
  {
    id: 2,
    type: "player_joined",
    title: "Player Accepted Invitation",
    message: "John Smith has joined your team",
    icon: PersonAddIcon,
    bgColor: "#2E9E45",
    iconColor: "#FFFFFF",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    timeLabel: "36 minutes ago",
    read: false,
    actionUrl: "/teams",
  },
  {
    id: 3,
    type: "message",
    title: "New Message",
    message: "Coach Mike sent you a message",
    icon: MessageIcon,
    bgColor: "#1F9EEA",
    iconColor: "#FFFFFF",
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    timeLabel: "about 1 hour ago",
    read: true,
    actionUrl: "/messages",
  },
  {
    id: 4,
    type: "staff_added",
    title: "Staff Member Added",
    message: "Sarah Johnson was added as Assistant Coach",
    icon: SportsIcon,
    bgColor: "#24FF00",
    iconColor: "#000000",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    timeLabel: "about 2 hours ago",
    read: true,
    actionUrl: "/staff",
  },
];

const mockChats = [
  {
    id: 1,
    name: "ISM AD U10",
    members: 14,
    lastMessage: "Hey everybody, is someone knows what's drill is the most...",
    timestamp: "10:08",
    unread: 3,
    isTeam: true,
  },
  {
    id: 2,
    name: "Coach Arnold",
    members: null,
    lastMessage: "Hey, have a new plan for the next training session with...",
    timestamp: "09:43",
    unread: 1,
    isTeam: false,
  },
  {
    id: 3,
    name: "ISM DIA ORANGE",
    members: 11,
    lastMessage: "No message yet",
    timestamp: "",
    unread: 0,
    isTeam: true,
  },
  {
    id: 4,
    name: "ISM DIA BLUE",
    members: 12,
    lastMessage: "No message yet",
    timestamp: "",
    unread: 0,
    isTeam: true,
  },
];

const BottomBar = () => {
  const [expandOpen, setExpandOpen] = useState(false);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [messagesAnchor, setMessagesAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isClubContext = useSelector(selectIsClubContext);
  const navigate = useNavigate();
  const messagesUnreadCount = mockChats.reduce((sum, chat) => sum + chat.unread, 0);

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

  const handleMessagesClick = (event) => {
    setNotifAnchor(null);
    setMessagesAnchor(event.currentTarget);
  };

  const closeMessages = () => setMessagesAnchor(null);

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
          onClick={(e) => {
            setMessagesAnchor(null);
            setNotifAnchor(e.currentTarget);
          }}
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
          <Badge badgeContent={messagesUnreadCount} sx={greenBadgeSx}>
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
          sx: {
            width: 400,
            height: 620,
            overflow: "hidden",
            mb: 1,
            borderRadius: "12px",
            border: "1px solid #ebebeb",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Box
          sx={{
            p: 2,
            bgcolor: "#fff",
            borderBottom: "1px solid #ebebeb",
            flexShrink: 0,
          }}
        >
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#000" }}>
            Notifications
          </Typography>
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", bgcolor: "#fff" }}>
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
                        py: "14px",
                        px: 2,
                        bgcolor: notification.read ? "transparent" : "action.hover",
                        "&:hover": { bgcolor: notification.read ? "action.hover" : "action.selected" },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: notification.bgColor, width: 50, height: 50 }}>
                          <notification.icon sx={{ fontSize: 22, color: notification.iconColor }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#000" }}>
                              {notification.title}
                            </Typography>
                            {!notification.read && (
                              <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#000" }} />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography sx={{ fontSize: 13, color: "#545963", mt: "2px", lineHeight: 1.35 }}>
                              {notification.message}
                            </Typography>
                            <Typography sx={{ fontSize: 11, color: "#98A2B3", mt: "4px", display: "block" }}>
                              {notification.timeLabel || formatDistanceToNow(notification.timestamp, { addSuffix: true })}
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

        <Box
          sx={{
            p: "10px",
            borderTop: "1px solid #ebebeb",
            bgcolor: "#fff",
            flexShrink: 0,
          }}
        >
          <Box sx={{ bgcolor: "#fff", border: "1px solid #ebebeb", borderRadius: "10px", p: "8px" }}>
            <Button
              fullWidth
              onClick={markAllAsRead}
              startIcon={<CheckCircleIcon sx={{ fontSize: 20, color: "#000" }} />}
              sx={{
                bgcolor: "#F3F4F6",
                color: "#000",
                textTransform: "none",
                fontWeight: 600,
                fontSize: 17,
                borderRadius: "7px",
                py: "10px",
                "&:hover": { bgcolor: "#EDEFF2" },
              }}
            >
              Mark all read
            </Button>
          </Box>
        </Box>
      </Popover>

      {/* Messages Popover (desktop modal style) */}
      <Popover
        open={Boolean(messagesAnchor)}
        anchorEl={messagesAnchor}
        onClose={closeMessages}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "right" }}
        PaperProps={{
          sx: {
            width: 400,
            height: 620,
            overflow: "hidden",
            mb: 1,
            borderRadius: "12px",
            border: "1px solid #ebebeb",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: "1px solid #ebebeb", bgcolor: "#fff", flexShrink: 0 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#000", lineHeight: 1.1 }}>
            Messages
          </Typography>
          <Typography sx={{ fontSize: 18, color: "#545963", mt: "2px" }}>
            {mockChats.length} Chats
          </Typography>
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", bgcolor: "#fff" }}>
          <List disablePadding>
            {mockChats.map((chat, index) => (
              <React.Fragment key={chat.id}>
                <ListItem
                  onClick={closeMessages}
                  sx={{
                    px: 2,
                    py: "10px",
                    cursor: "pointer",
                    "&:hover": { bgcolor: "#f8f9fb" },
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 48 }}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: "#f3f4f6",
                        color: "#545963",
                        borderRadius: "7px",
                      }}
                    >
                      {chat.isTeam ? <GroupIcon sx={{ fontSize: 20 }} /> : <MessageIcon sx={{ fontSize: 20 }} />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                          <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#000" }} noWrap>
                            {chat.name}
                          </Typography>
                          {chat.members ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: "3px", color: "#98A2B3", flexShrink: 0 }}>
                              <GroupIcon sx={{ fontSize: 12 }} />
                              <Typography sx={{ fontSize: 12 }}>{chat.members}</Typography>
                            </Box>
                          ) : null}
                        </Box>
                        {chat.timestamp ? (
                          <Typography sx={{ fontSize: 12, color: "#98A2B3", flexShrink: 0 }}>
                            {chat.timestamp}
                          </Typography>
                        ) : null}
                      </Box>
                    }
                    secondary={
                      <Typography sx={{ fontSize: 15, color: "#545963", lineHeight: 1.35, mt: "2px" }} noWrap>
                        {chat.lastMessage}
                      </Typography>
                    }
                  />
                  {chat.unread > 0 && (
                    <Box sx={{ ml: "8px", flexShrink: 0 }}>
                      <Box
                        sx={{
                          minWidth: 20,
                          height: 20,
                          px: "6px",
                          borderRadius: "10px",
                          bgcolor: "#24FF00",
                          color: "#000",
                          fontSize: 12,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {chat.unread}
                      </Box>
                    </Box>
                  )}
                </ListItem>
                {index < mockChats.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Box>

        <Box sx={{ p: "10px", borderTop: "1px solid #ebebeb", bgcolor: "#fff", flexShrink: 0 }}>
          <Box
            sx={{
              bgcolor: "#F3F4F6",
              borderRadius: "7.5px",
              px: "12px",
              py: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <SearchIcon sx={{ fontSize: 18, color: "#98A2B3" }} />
            <Typography sx={{ fontSize: 14, color: "#98A2B3" }}>Search chats...</Typography>
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export default BottomBar;
