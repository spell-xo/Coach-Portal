import { Alert, AlertTitle, Box, Select, MenuItem, Typography, Button, Chip } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, selectActiveContext, selectIsPlatformAdmin, setActiveContext } from "../store/authSlice";
import { useState } from "react";
import BuildIcon from "@mui/icons-material/Build";

export default function PlatformAdminBanner() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const activeContext = useSelector(selectActiveContext);
  const isPlatformAdmin = useSelector(selectIsPlatformAdmin);
  const [contextView, setContextView] = useState(activeContext?.role || "club_manager");

  // Only show banner if user is platform admin
  if (!isPlatformAdmin) {
    return null;
  }

  const handleContextSwitch = (event) => {
    const newRole = event.target.value;
    setContextView(newRole);

    // Update the active context role in Redux
    // This changes which role the platform admin is viewing as
    dispatch(
      setActiveContext({
        activeContext: {
          ...activeContext,
          role: newRole,
        },
      })
    );

    console.log("Switched context view to:", newRole);
  };

  const handleExitToAdmin = () => {
    // Close this window and return to admin
    window.close();
  };

  return (
    <Alert
      severity="warning"
      icon={<BuildIcon />}
      sx={{
        mb: 2,
        borderRadius: 1,
        "& .MuiAlert-message": {
          width: "100%",
        },
      }}>
      <AlertTitle sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
        <BuildIcon fontSize="small" />
        Platform Admin Mode Active
      </AlertTitle>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mt: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 500 }}>
            View as:
          </Typography>
          <Select
            value={contextView}
            onChange={handleContextSwitch}
            size="small"
            sx={{
              minWidth: 150,
              bgcolor: "background.paper",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "warning.main",
              },
            }}>
            <MenuItem value="club_manager">Club Manager</MenuItem>
            <MenuItem value="head_coach">Head Coach</MenuItem>
            <MenuItem value="coach">Coach</MenuItem>
          </Select>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography
            variant="caption"
            color="text.secondary">
            Viewing as {user.email} • Actions attributed to your admin account
          </Typography>
        </Box>

        <Button
          variant="outlined"
          size="small"
          onClick={handleExitToAdmin}
          sx={{
            borderColor: "warning.main",
            color: "warning.dark",
            "&:hover": {
              borderColor: "warning.dark",
              bgcolor: "warning.lighter",
            },
          }}>
          Exit to Admin
        </Button>

        <Chip
          label={`Club: ${activeContext?.clubName || "Unknown"}`}
          size="small"
          color="info"
          variant="outlined"
        />
      </Box>
    </Alert>
  );
}
