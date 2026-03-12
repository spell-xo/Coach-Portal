import React from "react";
import { Dialog, Box, Typography, IconButton, List, ListItem, ListItemAvatar, Avatar, Badge } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsClubContext, selectActiveContext } from "../store/authSlice";

const mockChats = [
  {
    id: 1,
    name: "U18 Premier Squad",
    members: 24,
    lastMessage: "Coach Mike: Great session today team!",
    timestamp: "2m ago",
    unread: 3,
    avatar: null,
    isTeam: true,
  },
  {
    id: 2,
    name: "U16 Development",
    members: 18,
    lastMessage: "Training moved to 4pm tomorrow",
    timestamp: "15m ago",
    unread: 1,
    avatar: null,
    isTeam: true,
  },
  {
    id: 3,
    name: "Sarah Johnson",
    members: null,
    lastMessage: "Can you review the drill plan?",
    timestamp: "1h ago",
    unread: 0,
    avatar: null,
    isTeam: false,
  },
  {
    id: 4,
    name: "U14 Academy",
    members: 16,
    lastMessage: "New player has been added",
    timestamp: "3h ago",
    unread: 0,
    avatar: null,
    isTeam: true,
  },
];

const MobileMessages = ({ open, onClose }) => {
  const navigate = useNavigate();
  const isClubContext = useSelector(selectIsClubContext);
  const activeContext = useSelector(selectActiveContext);
  const totalUnread = mockChats.reduce((sum, c) => sum + c.unread, 0);

  const handleChatClick = (chat) => {
    onClose();
    const clubId = activeContext?.clubId;
    if (isClubContext && clubId) {
      navigate(`/clubs/${clubId}/messages`);
    } else {
      navigate("/messages");
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
      <Box sx={{ px: "16px", pt: "16px", pb: "10px" }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: "10px", bgcolor: "#F3F4F6", borderRadius: "7px", p: "10px" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
            <Box>
              <Typography sx={{ fontSize: 20, fontWeight: 600, color: "#000" }}>
            Messages
              </Typography>
              <Typography sx={{ fontSize: 13, color: "#545963", mt: "2px" }}>
                Team and coaching chats
              </Typography>
            </Box>
            {totalUnread > 0 && (
              <Box sx={{ bgcolor: "#24FF00", borderRadius: "10px", px: "8px", py: "2px", alignSelf: "flex-start", mt: "2px" }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#000" }}>{totalUnread}</Typography>
              </Box>
            )}
          </Box>
          <IconButton onClick={onClose} sx={{ p: "6px", borderRadius: "7px", bgcolor: "#F3F4F6", border: "1px solid #EAECF0" }}>
            <CloseIcon sx={{ fontSize: 24 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Chat List */}
      <Box sx={{ flex: 1, overflowY: "auto", px: "16px", pb: "96px" }}>
        <List disablePadding>
          {mockChats.map((chat) => (
            <ListItem
              key={chat.id}
              onClick={() => handleChatClick(chat)}
              sx={{
                py: "12px",
                px: "0px",
                cursor: "pointer",
                borderBottom: "1px solid #f3f4f6",
                "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
              }}
            >
              <ListItemAvatar>
                <Avatar
                  sx={{
                    width: 44,
                    height: 44,
                    bgcolor: chat.isTeam ? "#f3f4f6" : "#e8f5e9",
                    color: chat.isTeam ? "#545963" : "#2e7d32",
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  {chat.name.charAt(0)}
                </Avatar>
              </ListItemAvatar>
              <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#000" }} noWrap>
                    {chat.name}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: "#98A2B3", flexShrink: 0, ml: 1 }}>
                    {chat.timestamp}
                  </Typography>
                </Box>
                {chat.isTeam && chat.members && (
                  <Typography sx={{ fontSize: 11, color: "#98A2B3" }}>
                    {chat.members} members
                  </Typography>
                )}
                <Typography sx={{ fontSize: 13, color: "#545963", mt: "2px" }} noWrap>
                  {chat.lastMessage}
                </Typography>
              </Box>
              {chat.unread > 0 && (
                <Badge
                  badgeContent={chat.unread}
                  sx={{
                    "& .MuiBadge-badge": {
                      bgcolor: "#24FF00",
                      color: "#000",
                      fontWeight: 600,
                      fontSize: 11,
                      minWidth: 20,
                      height: 20,
                    },
                  }}
                />
              )}
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Search chats */}
      <Box sx={{ p: "12px", borderTop: "1px solid #ebebeb", position: "fixed", left: 0, right: 0, bottom: 0, bgcolor: "#fff", zIndex: 1301 }}>
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
          <Typography sx={{ fontSize: 14, color: "#98A2B3" }}>Search chats...</Typography>
        </Box>
      </Box>
    </Dialog>
  );
};

export default MobileMessages;
