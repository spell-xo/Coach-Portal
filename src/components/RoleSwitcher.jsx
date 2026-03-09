import SportsIcon from "@mui/icons-material/Sports";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectUserRoles, selectPrimaryRole, updateUserRole, selectHasMultipleRoles, selectIsClubContext } from "../store/authSlice";
import authService from "../api/authService";
import { Button, Menu, MenuItem, ListItemIcon, CircularProgress } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";

export default function RoleSwitcher() {
  const [switchingRole, setSwitchingRole] = useState(false);
  const [roleMenuAnchor, setRoleMenuAnchor] = useState(null);
  const userRoles = useSelector(selectUserRoles);
  const primaryRole = useSelector(selectPrimaryRole);
  const hasMultipleRoles = useSelector(selectHasMultipleRoles);
  const isClubContext = useSelector(selectIsClubContext);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleRoleMenuOpen = (event) => {
    setRoleMenuAnchor(event.currentTarget);
  };

  const handleRoleMenuClose = () => {
    setRoleMenuAnchor(null);
  };

  const handleSwitchRole = async (newRole) => {
    if (newRole === primaryRole) {
      handleRoleMenuClose();
      return;
    }

    setSwitchingRole(true);
    try {
      const response = await authService.switchRole(newRole);

      if (response.success) {
        // Update Redux store with new role and token
        dispatch(
          updateUserRole({
            roles: response.data.user.roles,
            primaryRole: response.data.user.primaryRole,
            accessToken: response.data.accessToken,
          })
        );

        // Navigate to appropriate dashboard
        if (newRole === "coach") {
          navigate("/dashboard");
        } else if (newRole === "player") {
          navigate("/player/dashboard");
        }
      }
    } catch (error) {
      console.error("Error switching role:", error);
    } finally {
      setSwitchingRole(false);
      handleRoleMenuClose();
    }
  };

  // Role Switcher (if user has multiple roles) - Legacy for coach/player
  if (!hasMultipleRoles || isClubContext) {
    return null;
  }

  return (
    <>
      <Button
        color="inherit"
        onClick={handleRoleMenuOpen}
        startIcon={
          switchingRole ? (
            <CircularProgress
              size={16}
              color="inherit"
            />
          ) : (
            <SwapHorizIcon />
          )
        }
        disabled={switchingRole}
        sx={{
          paddingLeft: { xs: 4, lg: 3 },
          textTransform: "capitalize",
          width: "100%",
          justifyContent: "flex-start",
        }}>
        {primaryRole}
      </Button>
      {/* Role Switcher Menu */}
      <Menu
        anchorEl={roleMenuAnchor}
        id="role-menu"
        open={Boolean(roleMenuAnchor)}
        onClose={handleRoleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}>
        {userRoles.map((role) => (
          <MenuItem
            key={role}
            onClick={() => handleSwitchRole(role)}
            selected={role === primaryRole}
            sx={{ textTransform: "capitalize" }}>
            <ListItemIcon>{role === "coach" ? <SportsIcon fontSize="small" /> : <PersonIcon fontSize="small" />}</ListItemIcon>
            {role === "coach" ? "Coach" : "Player"}
            {role === primaryRole && " (current)"}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
