<AppBar
  position="static"
  sx={{
    backgroundColor: "#FFFFFF",
    color: "#000000",
    width: "100%",
  }}>
  <Toolbar sx={{ minHeight: { xs: 64, sm: 70 } }}>
    {/* AIM Logo */}
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        mr: 4,
        cursor: "pointer",
      }}
      onClick={() => handleNavigation(isClubContext ? `/clubs/${activeContext?.clubId}/dashboard` : "/dashboard")}>
      {/* AIM Icon */}
      <Box
        component="img"
        src={aimIcon}
        alt="AIM"
        sx={{
          height: { xs: 36, sm: 40 },
          width: "auto",
          filter: "invert(73%) sepia(89%) saturate(7485%) hue-rotate(51deg) brightness(106%) contrast(107%)", // Convert to AIM Green
        }}
      />

      {/* Club Badge or AIM Text */}
      {isClubContext && clubBadgeUrl ? (
        <Box
          component="img"
          src={clubBadgeUrl}
          alt="Club Badge"
          sx={{
            height: { xs: 36, sm: 40 },
            width: { xs: 36, sm: 40 },
            objectFit: "contain",
            borderRadius: 1,
          }}
        />
      ) : (
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: { xs: "1.125rem", sm: "1.25rem" },
            color: "text.primary",
            display: { xs: "none", sm: "block" },
          }}>
          AIM
        </Typography>
      )}

      {/* Portal Label */}
      <Typography
        variant="body1"
        sx={{
          fontWeight: 500,
          color: "text.secondary",
          fontSize: { xs: "0.875rem", sm: "1rem" },
          display: { xs: "none", md: "block" },
        }}>
        {isClubContext ? activeContext?.clubName || "Club Portal" : `${primaryRole === "player" ? "Player" : "Coach"} Portal`}
      </Typography>
    </Box>

    {/* Desktop Menu */}
    <Box sx={{ flexGrow: 1, display: { xs: "none", sm: "flex" }, gap: 0.5 }}>
      {menuItems.map((item) => (
        <Button
          key={item.path}
          onClick={() => !item.disabled && handleNavigation(item.path)}
          disabled={item.disabled}
          startIcon={item.icon}
          sx={{
            color: isActive(item.path) ? "secondary.main" : "text.primary", // Green for active state
            backgroundColor: isActive(item.path) ? "rgba(36, 255, 0, 0.08)" : "transparent",
            fontWeight: isActive(item.path) ? 600 : 500,
            px: 2,
            py: 1,
            borderRadius: 2,
            "&:hover": {
              backgroundColor: isActive(item.path) ? "rgba(36, 255, 0, 0.12)" : "rgba(0, 0, 0, 0.04)",
            },
            "&.Mui-disabled": {
              color: "text.disabled",
            },
          }}>
          {item.label}
        </Button>
      ))}
    </Box>

    {/* Search Button */}
    <Tooltip title="Search (Cmd+K)">
      <IconButton
        onClick={() => setCommandPaletteOpen(true)}
        sx={{ mr: 1 }}
        aria-label="search">
        <SearchIcon />
      </IconButton>
    </Tooltip>

    {/* Notification Center */}
    <NotificationCenter />

    {/* Theme Switcher */}
    <ThemeSwitcher />

    {/* Context Switcher */}
    <ContextSwitcher />

    {/* Role Switcher (if user has multiple roles) - Legacy for coach/player */}
    {hasMultipleRoles && !isClubContext && (
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
        sx={{ mr: 2, textTransform: "capitalize" }}>
        {primaryRole}
      </Button>
    )}

    {/* User Menu */}
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography
        variant="body2"
        sx={{ display: { xs: "none", md: "block" } }}>
        {user?.name}
      </Typography>
      <IconButton
        onClick={handleUserMenuOpen}
        size="small"
        sx={{ ml: 1 }}
        aria-controls={Boolean(userMenuAnchor) ? "user-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={Boolean(userMenuAnchor) ? "true" : undefined}>
        <Avatar
          src={user?.profilePicture}
          sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}>
          {user?.name?.charAt(0) || "C"}
        </Avatar>
      </IconButton>
    </Box>

    {/* Mobile Menu */}
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
      sx={{ display: { sm: "none" } }}>
      {menuItems.map((item) => (
        <MenuItem
          key={item.path}
          onClick={() => !item.disabled && handleNavigation(item.path)}
          disabled={item.disabled}
          selected={isActive(item.path)}>
          <ListItemIcon>{item.icon}</ListItemIcon>
          {item.label}
        </MenuItem>
      ))}
    </Menu>

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

    {/* User Dropdown Menu */}
    <Menu
      anchorEl={userMenuAnchor}
      id="user-menu"
      open={Boolean(userMenuAnchor)}
      onClose={handleUserMenuClose}
      onClick={handleUserMenuClose}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}>
      <MenuItem
        onClick={() => navigate("/profile")}
        disabled>
        <ListItemIcon>
          <PersonIcon fontSize="small" />
        </ListItemIcon>
        Profile
      </MenuItem>
      <MenuItem
        onClick={() => navigate("/settings")}
        disabled>
        <ListItemIcon>
          <SettingsIcon fontSize="small" />
        </ListItemIcon>
        Settings
      </MenuItem>
      <Divider />
      <MenuItem onClick={handleLogout}>
        <ListItemIcon>
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        Logout
      </MenuItem>
    </Menu>
  </Toolbar>
</AppBar>;
