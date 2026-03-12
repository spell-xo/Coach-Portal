import React, { useState, useEffect } from "react";
import { Dialog, Box, Typography, IconButton, List, ListItem, ListItemText, ListItemAvatar, Avatar, Button, Divider } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupIcon from "@mui/icons-material/Group";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import MessageIcon from "@mui/icons-material/Message";
import SportsIcon from "@mui/icons-material/Sports";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

const mockNotifications = [
  {
    id: 1,
    type: "team_invite",
    title: "New Team Invitation",
    message: "You have been invited to join U18 Premier Squad",
    icon: GroupIcon,
    color: "#1976d2",
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
    color: "#2e7d32",
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
    color: "#0288d1",
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
    color: "#9c27b0",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: true,
    actionUrl: "/staff",
  },
];

const MobileNotifications = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (open) {
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter((n) => !n.read).length);
    }
  }, [open]);

  const handleDelete = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleClick = (notification) => {
    setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
    onClose();
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{ sx: { bgcolor: "#fff", display: "flex", flexDirection: "column" } }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: "10px", px: "16px", py: "16px", borderBottom: "1px solid #EBEBEB" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 600, color: "#000" }}>
            Notifications
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#545963", mt: "2px" }}>
            Alerts and important updates
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ p: "6px", borderRadius: "7px", bgcolor: "#F3F4F6", border: "1px solid #EAECF0" }}>
          <CloseIcon sx={{ fontSize: 24 }} />
        </IconButton>
      </Box>

      {/* Notification List */}
      <Box sx={{ flex: 1, overflowY: "auto", px: "16px", pb: "88px" }}>
        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <NotificationsNoneIcon sx={{ fontSize: 64, color: "#ccc", mb: 2 }} />
            <Typography sx={{ fontSize: 16, color: "#545963" }}>No notifications yet</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  onClick={() => handleClick(notification)}
                  sx={{
                    py: "12px",
                    px: "0px",
                    bgcolor: notification.read ? "transparent" : "rgba(36,255,0,0.05)",
                    cursor: "pointer",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                  }}
                  secondaryAction={
                    <IconButton edge="end" onClick={(e) => { e.stopPropagation(); handleDelete(notification.id); }}>
                      <DeleteIcon sx={{ fontSize: 20, color: "#98A2B3" }} />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: notification.color, width: 40, height: 40 }}>
                      <notification.icon sx={{ fontSize: 20, color: "#fff" }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Typography sx={{ fontSize: 14, fontWeight: notification.read ? 500 : 600, color: "#000" }}>
                          {notification.title}
                        </Typography>
                        {!notification.read && (
                          <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#24FF00", flexShrink: 0 }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography sx={{ fontSize: 13, color: "#545963", mt: "2px" }}>
                          {notification.message}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: "#98A2B3", mt: "4px" }}>
                          {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ p: "12px", borderTop: "1px solid #ebebeb", position: "fixed", left: 0, right: 0, bottom: 0, bgcolor: "#fff", zIndex: 1301 }}>
          <Button
            fullWidth
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            sx={{
              bgcolor: "#f3f4f6",
              color: "#000",
              textTransform: "none",
              fontWeight: 600,
              fontSize: 14,
              borderRadius: "7.5px",
              py: "10px",
              "&:hover": { bgcolor: "#ecedf0" },
            }}
          >
            Mark all as read
          </Button>
        </Box>
    </Dialog>
  );
};

export default MobileNotifications;
