import React, { useState, useEffect } from "react";
import { IconButton, Badge, Popover, Box, Typography, List, ListItem, ListItemText, ListItemAvatar, Avatar, Button, Divider, Tooltip } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import GroupIcon from "@mui/icons-material/Group";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import MessageIcon from "@mui/icons-material/Message";
import SportsIcon from "@mui/icons-material/Sports";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { formatDistanceToNow } from "date-fns";

const NotificationCenter = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Simulated notifications - in production, fetch from API
  useEffect(() => {
    // Mock notifications for demo
    const mockNotifications = [
      {
        id: 1,
        type: "team_invite",
        title: "New Team Invitation",
        message: "You have been invited to join U18 Premier Squad",
        icon: GroupIcon,
        color: "primary",
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
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
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
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
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
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
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        read: true,
        actionUrl: "/staff",
      },
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter((n) => !n.read).length);
  }, []);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const markAsRead = (notificationId) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotification = (notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    const notification = notifications.find((n) => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          onClick={handleOpen}
          color="inherit"
          aria-label="notifications">
          <Badge
            badgeContent={unreadCount}
            color="error">
            {unreadCount > 0 ? <NotificationsIcon /> : <NotificationsNoneIcon />}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
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
            width: 400,
            maxHeight: 600,
            overflow: "hidden",
            mt: 1,
          },
        }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600 }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={markAllAsRead}
              startIcon={<CheckCircleIcon />}>
              Mark all read
            </Button>
          )}
        </Box>

        {/* Notification List */}
        <Box sx={{ maxHeight: 500, overflowY: "auto" }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <NotificationsNoneIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
              <Typography
                variant="body1"
                color="text.secondary">
                No notifications yet
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary">
                We'll notify you when something happens
              </Typography>
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
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      button
                      onClick={() => {
                        markAsRead(notification.id);
                        handleClose();
                        // Navigate to action URL if provided
                        if (notification.actionUrl) {
                          window.location.href = notification.actionUrl;
                        }
                      }}
                      sx={{
                        py: 2,
                        px: 2,
                        bgcolor: notification.read ? "transparent" : "action.hover",
                        "&:hover": {
                          bgcolor: notification.read ? "action.hover" : "action.selected",
                        },
                      }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: `${notification.color}.main`,
                            width: 40,
                            height: 40,
                          }}>
                          <notification.icon fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: notification.read ? 400 : 600 }}>
                              {notification.title}
                            </Typography>
                            {!notification.read && (
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  bgcolor: "primary.main",
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 0.5 }}>
                              {notification.message}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ mt: 0.5, display: "block" }}>
                              {formatDistanceToNow(notification.timestamp, {
                                addSuffix: true,
                              })}
                            </Typography>
                          </Box>
                        }
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotification(notification.id);
                        }}
                        sx={{ ml: 1 }}>
                        <Typography variant="caption">×</Typography>
                      </IconButton>
                    </ListItem>
                    {index < notifications.length - 1 && <Divider />}
                  </Box>
                ))}
              </AnimatePresence>
            </List>
          )}
        </Box>

        {/* Footer */}
        {notifications.length > 0 && (
          <Box
            sx={{
              p: 1.5,
              borderTop: "1px solid",
              borderColor: "divider",
              textAlign: "center",
            }}>
            <Button
              size="small"
              fullWidth
              onClick={handleClose}>
              View All Notifications
            </Button>
          </Box>
        )}
      </Popover>
    </>
  );
};

export default NotificationCenter;
