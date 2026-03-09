import { icons } from "../styles/icons";

// Check if a path is active based on current pathname
export const isActive = (pathname, path) => {
  return pathname === path || pathname.startsWith(path + "/");
};

// Determine menu items based on context and role
export const getMenuItems = (isClubContext, activeClubRole, isPlatformAdmin, primaryRole, activeContext, isPlatformEngineering = false) => {
  // SUPERADMIN and PLATFORM_ENGINEERING (DAW tier) get superadmin dashboard menu
  if (primaryRole === "superadmin" || isPlatformEngineering) {
    return [
      { label: "Superadmin Dashboard", path: "/superadmin/dashboard", icon: icons.dashboard },
      { label: "Drills", path: "/superadmin/drills", icon: icons.cloudUpload },
      { label: "Users", path: "/superadmin/users", icon: icons.person },
      { label: "Instructions", path: "/superadmin/drill-instructions", icon: icons.description },
      { label: "Coach Points Config", path: "/superadmin/coach-points-config", icon: icons.stars },
      { label: "Parental Consent", path: "/superadmin/parental-consent", icon: icons.familyRestroom },
      { label: "Sandbox", path: "/superadmin/sandbox", icon: icons.science },
      { label: "Cohort", path: "/superadmin/cohort", icon: icons.barChart },
      { label: "LLM Config", path: "/superadmin/llm-config", icon: icons.tune },
      { label: "Usage Tracking", path: "/superadmin/usage", icon: icons.barChart },
    ];
  }

  // If in club context, show club-specific menu based on role
  if (isClubContext) {
    const clubId = activeContext?.clubId;

    // PLATFORM_ADMIN gets full access to everything
    if (isPlatformAdmin) {
      return [
        { label: "Club Dashboard", path: `/clubs/${clubId}/dashboard`, icon: icons.dashboard },
        { label: "Teams", path: `/clubs/${clubId}/teams`, icon: icons.group },
        { label: "Staff", path: `/clubs/${clubId}/staff`, icon: icons.sports },
        { label: "Players", path: `/clubs/${clubId}/players`, icon: icons.person },
        { label: "Challenges", path: "/challenges", icon: icons.emojiEvents },
        { label: "Missions", path: "/missions", icon: icons.assignment },
        { label: "Drills", path: `/clubs/${clubId}/drill-uploads`, icon: icons.cloudUpload },
        { label: "Invitations", path: `/clubs/${clubId}/invitations`, icon: icons.mail },
        { label: "Analytics", path: `/clubs/${clubId}/analytics`, icon: icons.barChart },
        { label: "Messages", path: `/clubs/${clubId}/messages`, icon: icons.message },
        { label: "Instructions", path: `/clubs/${clubId}/drill-instructions`, icon: icons.description },
        { label: "Coach Points", path: `/clubs/${clubId}/coach-points`, icon: icons.stars },
        {
          label: "Settings",
          icon: icons.settings,
          children: [
            { label: "Club Profile", path: `/clubs/${clubId}/profile` },
            { label: "Training Exercises", path: `/clubs/${clubId}/training-exercises` },
            { label: "Recommendation Rules", path: `/clubs/${clubId}/recommendation-rules` },
          ]
        },
      ];
    }

    // CLUB_MANAGER gets full club management menu
    if (activeClubRole === "club_manager") {
      return [
        { label: "Club Dashboard", path: `/clubs/${clubId}/dashboard`, icon: icons.dashboard },
        { label: "Teams", path: `/clubs/${clubId}/teams`, icon: icons.group },
        { label: "Staff", path: `/clubs/${clubId}/staff`, icon: icons.sports },
        { label: "Players", path: `/clubs/${clubId}/players`, icon: icons.person },
        { label: "Challenges", path: "/challenges", icon: icons.emojiEvents },
        { label: "Missions", path: "/missions", icon: icons.assignment },
        { label: "Drills", path: `/clubs/${clubId}/drill-uploads`, icon: icons.cloudUpload },
        { label: "Invitations", path: `/clubs/${clubId}/invitations`, icon: icons.mail },
        { label: "Analytics", path: `/clubs/${clubId}/analytics`, icon: icons.barChart },
        { label: "Instructions", path: `/clubs/${clubId}/drill-instructions`, icon: icons.description },
        { label: "Coach Points", path: `/clubs/${clubId}/coach-points`, icon: icons.stars },
        {
          label: "Settings",
          icon: icons.settings,
          children: [
            { label: "Club Profile", path: `/clubs/${clubId}/profile` },
            { label: "Training Exercises", path: `/clubs/${clubId}/training-exercises` },
            { label: "Recommendation Rules", path: `/clubs/${clubId}/recommendation-rules` },
          ]
        },
      ];
    }

    // HEAD_COACH can create teams and manage staff
    if (activeClubRole === "head_coach") {
      return [
        { label: "Club Dashboard", path: `/clubs/${clubId}/dashboard`, icon: icons.dashboard },
        { label: "Teams", path: `/clubs/${clubId}/teams`, icon: icons.group },
        { label: "Staff", path: `/clubs/${clubId}/staff`, icon: icons.sports },
        { label: "Players", path: `/clubs/${clubId}/players`, icon: icons.person },
        { label: "Challenges", path: "/challenges", icon: icons.emojiEvents },
        { label: "Missions", path: "/missions", icon: icons.assignment },
        { label: "Drills", path: `/clubs/${clubId}/drill-uploads`, icon: icons.cloudUpload },
        { label: "Invitations", path: `/clubs/${clubId}/invitations`, icon: icons.mail },
        { label: "Analytics", path: `/clubs/${clubId}/analytics`, icon: icons.barChart },
        { label: "Instructions", path: `/clubs/${clubId}/drill-instructions`, icon: icons.description },
        { label: "Coach Points", path: `/clubs/${clubId}/coach-points`, icon: icons.stars },
        {
          label: "Settings",
          icon: icons.settings,
          children: [
            { label: "Training Exercises", path: `/clubs/${clubId}/training-exercises` },
            { label: "Recommendation Rules", path: `/clubs/${clubId}/recommendation-rules` },
          ]
        },
      ];
    }

    // COACH sees teams in club context (not personal /teams)
    if (activeClubRole === "coach") {
      return [
        { label: "Club Dashboard", path: `/clubs/${clubId}/dashboard`, icon: icons.dashboard },
        { label: "My Teams", path: `/clubs/${clubId}/teams`, icon: icons.group },
        { label: "Players", path: `/clubs/${clubId}/players`, icon: icons.person },
        { label: "Challenges", path: "/challenges", icon: icons.emojiEvents },
        { label: "Missions", path: "/missions", icon: icons.assignment },
        { label: "Drills", path: `/clubs/${clubId}/drill-uploads`, icon: icons.cloudUpload },
        { label: "Messages", path: `/clubs/${clubId}/messages`, icon: icons.message },
        { label: "Instructions", path: `/clubs/${clubId}/drill-instructions`, icon: icons.description },
        { label: "Coach Points", path: `/clubs/${clubId}/coach-points`, icon: icons.stars },
        {
          label: "Settings",
          icon: icons.settings,
          children: [
            { label: "Training Exercises", path: `/clubs/${clubId}/training-exercises` },
            { label: "Recommendation Rules", path: `/clubs/${clubId}/recommendation-rules` },
          ]
        },
      ];
    }
  }

  // Personal context or legacy - show original menu based on primary role
  const isPlayerMode = primaryRole === "player";

  if (isPlayerMode) {
    return [
      { label: "Dashboard", path: "/player/dashboard", icon: icons.dashboard },
      { label: "My Teams", path: "/player/teams", icon: icons.group },
      { label: "Drills", path: "/player/drills", icon: icons.playCircle },
      { label: "Challenges", path: "/player/challenges", icon: icons.emojiEvents },
    ];
  }

  // Default coach menu (personal context)
  return [
    { label: "Dashboard", path: "/dashboard", icon: icons.dashboard },
    { label: "Teams", path: "/teams", icon: icons.group },
    { label: "Players", path: "/players", icon: icons.person },
    { label: "Challenges", path: "/challenges", icon: icons.emojiEvents },
    { label: "Missions", path: "/missions", icon: icons.assignment },
    { label: "Messages", path: "/messages", icon: icons.message },
    { label: "Coach Points", path: "/coach-points", icon: icons.stars },
    { label: "Analytics", path: "/analytics", icon: icons.barChart, disabled: true },
  ];
};

export const openedMixin = (theme, drawerWidth) => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

export const closedMixin = (theme) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(9.5)} + 1px)`,
  },
});
