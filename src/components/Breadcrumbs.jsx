import React from "react";
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, Box } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import HomeIcon from "@mui/icons-material/Home";
import { selectActiveContext, selectPrimaryRole } from "../store/authSlice";
import { getDashboardPath } from "../utils/navigation";

const pathNameMap = {
  dashboard: "Dashboard",
  teams: "Teams",
  players: "Players",
  messages: "Messages",
  analytics: "Analytics",
  clubs: "Clubs",
  profile: "Profile",
  staff: "Staff",
  invitations: "Invitations",
  "drill-uploads": "Drills",
  "bulk-import": "Bulk Import",
  create: "Create",
};

const Breadcrumbs = ({ items }) => {
  const location = useLocation();
  const activeContext = useSelector(selectActiveContext);
  const primaryRole = useSelector(selectPrimaryRole);
  const homePath = getDashboardPath(activeContext, primaryRole);

  const generateBreadcrumbs = () => {
    if (items) return items;

    const pathnames = location.pathname.split("/").filter((x) => x);
    const breadcrumbs = [];

    pathnames.forEach((value, index) => {
      const to = `/${pathnames.slice(0, index + 1).join("/")}`;
      const label = pathNameMap[value] || value;

      // Skip IDs (MongoDB ObjectId pattern or UUIDs)
      if (/^[0-9a-fA-F]{24}$/.test(value) || /^[0-9a-f-]{36}$/.test(value)) {
        return;
      }

      breadcrumbs.push({
        label,
        to,
        active: index === pathnames.length - 1,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length === 0) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <MuiBreadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{
          "& .MuiBreadcrumbs-separator": {
            color: "text.disabled",
          },
        }}>
        <Link
          component={RouterLink}
          to={homePath}
          underline="hover"
          sx={{
            display: "flex",
            alignItems: "center",
            color: "text.secondary",
            "&:hover": {
              color: "primary.main",
            },
          }}>
          <HomeIcon sx={{ mr: 0.5, fontSize: 20 }} />
          Home
        </Link>

        {breadcrumbs.map((crumb, index) => {
          if (crumb.active) {
            return (
              <Typography
                key={index}
                color="text.primary"
                sx={{ fontWeight: 600 }}>
                {crumb.label}
              </Typography>
            );
          }

          if (crumb.to === "/clubs") {
            return (
              <Typography
                key={index}
                color="text.secondary">
                {crumb.label}
              </Typography>
            );
          }

          return (
            <Link
              key={index}
              component={RouterLink}
              to={crumb.to}
              underline="hover"
              sx={{
                color: "text.secondary",
                "&:hover": {
                  color: "primary.main",
                },
              }}>
              {crumb.label}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
};

export default Breadcrumbs;
