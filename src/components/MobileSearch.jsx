import React, { useState, useEffect, useCallback } from "react";
import { Dialog, Box, Typography, IconButton, InputBase, List, ListItem, ListItemButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsClubContext, selectActiveContext } from "../store/authSlice";
import clubService from "../api/clubService";

const AimLogoVector = () => (
  <svg width="21" height="25" viewBox="275 208 105 125" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M295.4 228.6H315.9V252.8L295.4 275.7V228.6ZM356.1 208L336.5 229.9V208H275V310.6L295.5 331.1V306.1L316 283.2V331.1H336.5V260.3L357 237.4V331.1L377.5 310.6V208H356H356.1Z"
      fill="currentColor"
    />
  </svg>
);

const MobileSearch = ({ open, onClose }) => {
  const navigate = useNavigate();
  const isClubContext = useSelector(selectIsClubContext);
  const activeContext = useSelector(selectActiveContext);
  const clubId = activeContext?.clubId;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [allTeams, setAllTeams] = useState([]);

  useEffect(() => {
    if (open && isClubContext && clubId) {
      clubService
        .getTeams(clubId)
        .then((res) => {
          setAllTeams(res.data?.teams || res.data || []);
        })
        .catch(() => setAllTeams([]));
    }
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open, isClubContext, clubId]);

  const handleSearch = useCallback(
    (value) => {
      setQuery(value);
      if (!value.trim()) {
        setResults([]);
        return;
      }
      const lower = value.toLowerCase();
      const filtered = allTeams.filter(
        (t) => (t.name || "").toLowerCase().includes(lower) || (t.ageGroup || "").toLowerCase().includes(lower)
      );
      setResults(filtered);
    },
    [allTeams]
  );

  const handleSelect = (team) => {
    onClose();
    if (clubId) {
      navigate(`/clubs/${clubId}/teams/${team._id || team.id}`);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{ sx: { bgcolor: "#fff", display: "flex", flexDirection: "column" } }}
    >
      {/* Header: Logo + Close */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: "16px", py: "16px" }}>
        <Box sx={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <AimLogoVector />
          <Typography sx={{ fontSize: 28, fontWeight: 700, color: "#000", textTransform: "uppercase", lineHeight: "23px" }}>
            AIM
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ p: 0 }}>
          <CloseIcon sx={{ fontSize: 24 }} />
        </IconButton>
      </Box>

      {/* Search Input */}
      <Box sx={{ px: "16px", pb: "12px" }}>
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
          <SearchIcon sx={{ fontSize: 24, color: "#888" }} />
          <InputBase
            placeholder="Search teams..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
            sx={{ flex: 1, fontSize: 14, fontWeight: 500, color: "#000" }}
          />
        </Box>
      </Box>

      {/* Results */}
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {query && results.length === 0 && (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography sx={{ fontSize: 14, color: "#545963" }}>No teams found</Typography>
          </Box>
        )}
        <List disablePadding>
          {results.map((team) => (
            <ListItem key={team._id || team.id} disablePadding>
              <ListItemButton
                onClick={() => handleSelect(team)}
                sx={{ px: "16px", py: "12px", borderBottom: "1px solid #f3f4f6" }}
              >
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#000" }}>
                      {team.name}
                    </Typography>
                    {team.status === "active" && (
                      <Box sx={{ bgcolor: "rgba(36,255,0,0.15)", borderRadius: "4px", px: "6px", py: "1px" }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#1CC900" }}>Active</Typography>
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", gap: "12px", mt: "2px" }}>
                    {team.playerCount !== undefined && (
                      <Typography sx={{ fontSize: 12, color: "#545963" }}>
                        {team.playerCount} players
                      </Typography>
                    )}
                    {team.coachCount !== undefined && (
                      <Typography sx={{ fontSize: 12, color: "#545963" }}>
                        {team.coachCount} coaches
                      </Typography>
                    )}
                  </Box>
                </Box>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Dialog>
  );
};

export default MobileSearch;
