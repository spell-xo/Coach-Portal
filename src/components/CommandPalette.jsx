import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Dialog,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import SearchIcon from '@mui/icons-material/Search';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import MessageIcon from '@mui/icons-material/Message';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import SportsIcon from '@mui/icons-material/Sports';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AddIcon from '@mui/icons-material/Add';
import { selectActiveContext, selectIsClubContext } from '../store/authSlice';

const CommandPalette = ({ open, onClose }) => {
  const navigate = useNavigate();
  const activeContext = useSelector(selectActiveContext);
  const isClubContext = useSelector(selectIsClubContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const clubId = activeContext?.clubId;

  // Define all available commands
  const allCommands = useMemo(() => {
    const commands = [
      // Navigation
      {
        id: 'nav-dashboard',
        title: 'Go to Dashboard',
        description: 'Navigate to your dashboard',
        icon: DashboardIcon,
        action: () => navigate('/dashboard'),
        keywords: ['dashboard', 'home'],
        category: 'Navigation',
      },
      {
        id: 'nav-teams',
        title: 'Go to Teams',
        description: 'View and manage teams',
        icon: GroupIcon,
        action: () => navigate('/teams'),
        keywords: ['teams', 'roster'],
        category: 'Navigation',
      },
      {
        id: 'nav-players',
        title: 'Go to Players',
        description: 'View all players',
        icon: PersonIcon,
        action: () => navigate('/players'),
        keywords: ['players', 'roster', 'athletes'],
        category: 'Navigation',
      },
      {
        id: 'nav-messages',
        title: 'Go to Messages',
        description: 'View your messages',
        icon: MessageIcon,
        action: () => navigate('/messages'),
        keywords: ['messages', 'chat', 'communication'],
        category: 'Navigation',
      },
    ];

    // Add club-specific commands if in club context
    if (isClubContext && clubId) {
      commands.push(
        {
          id: 'nav-club-dashboard',
          title: 'Go to Club Dashboard',
          description: `Navigate to ${activeContext?.clubName || 'club'} dashboard`,
          icon: DashboardIcon,
          action: () => navigate(`/clubs/${clubId}/dashboard`),
          keywords: ['club', 'dashboard', activeContext?.clubName?.toLowerCase()],
          category: 'Navigation',
        },
        {
          id: 'nav-club-teams',
          title: 'Go to Club Teams',
          description: 'View club teams',
          icon: GroupIcon,
          action: () => navigate(`/clubs/${clubId}/teams`),
          keywords: ['club', 'teams'],
          category: 'Navigation',
        },
        {
          id: 'nav-club-players',
          title: 'Go to Club Players',
          description: 'View all club players',
          icon: PersonIcon,
          action: () => navigate(`/clubs/${clubId}/players`),
          keywords: ['club', 'players'],
          category: 'Navigation',
        },
        {
          id: 'nav-club-staff',
          title: 'Go to Staff',
          description: 'Manage club staff',
          icon: SportsIcon,
          action: () => navigate(`/clubs/${clubId}/staff`),
          keywords: ['staff', 'coaches', 'management'],
          category: 'Navigation',
        },
        {
          id: 'nav-club-drills',
          title: 'Go to Drills',
          description: 'Manage drill uploads',
          icon: CloudUploadIcon,
          action: () => navigate(`/clubs/${clubId}/drill-uploads`),
          keywords: ['drills', 'uploads', 'videos'],
          category: 'Navigation',
        },
        {
          id: 'nav-club-analytics',
          title: 'Go to Analytics',
          description: 'View club analytics',
          icon: BarChartIcon,
          action: () => navigate(`/clubs/${clubId}/analytics`),
          keywords: ['analytics', 'stats', 'reports'],
          category: 'Navigation',
        },
        // Quick Actions
        {
          id: 'action-create-team',
          title: 'Create New Team',
          description: 'Create a new team in the club',
          icon: AddIcon,
          action: () => navigate(`/clubs/${clubId}/teams/create`),
          keywords: ['create', 'team', 'new', 'add'],
          category: 'Actions',
        },
        {
          id: 'action-invite-player',
          title: 'Invite Player',
          description: 'Send a player invitation',
          icon: PersonAddIcon,
          action: () => navigate(`/clubs/${clubId}/players/invite`),
          keywords: ['invite', 'player', 'add', 'new'],
          category: 'Actions',
        },
        {
          id: 'action-bulk-import',
          title: 'Bulk Import Players',
          description: 'Import multiple players from CSV',
          icon: CloudUploadIcon,
          action: () => navigate(`/clubs/${clubId}/players/bulk-import`),
          keywords: ['bulk', 'import', 'csv', 'upload', 'players'],
          category: 'Actions',
        }
      );
    }

    return commands;
  }, [navigate, isClubContext, clubId, activeContext]);

  // Filter commands based on search query
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) {
      return allCommands;
    }

    const query = searchQuery.toLowerCase();
    return allCommands.filter((command) => {
      const titleMatch = command.title.toLowerCase().includes(query);
      const descriptionMatch = command.description.toLowerCase().includes(query);
      const keywordsMatch = command.keywords.some((keyword) =>
        keyword.includes(query)
      );
      return titleMatch || descriptionMatch || keywordsMatch;
    });
  }, [searchQuery, allCommands]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups = {};
    filteredCommands.forEach((command) => {
      if (!groups[command.category]) {
        groups[command.category] = [];
      }
      groups[command.category].push(command);
    });
    return groups;
  }, [filteredCommands]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        executeCommand(filteredCommands[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [filteredCommands, selectedIndex, onClose]
  );

  // Execute selected command
  const executeCommand = (command) => {
    command.action();
    onClose();
    setSearchQuery('');
    setSelectedIndex(0);
  };

  // Reset when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Update selected index when filtered commands change
  useEffect(() => {
    if (selectedIndex >= filteredCommands.length) {
      setSelectedIndex(Math.max(0, filteredCommands.length - 1));
    }
  }, [filteredCommands, selectedIndex]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'background.paper',
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Search Input */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            fullWidth
            placeholder="Search commands... (type to filter)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { border: 'none' },
              },
            }}
          />
        </Box>

        {/* Command List */}
        <Box sx={{ maxHeight: '60vh', overflowY: 'auto', py: 1 }}>
          {filteredCommands.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No commands found
              </Typography>
            </Box>
          ) : (
            Object.entries(groupedCommands).map(([category, commands]) => (
              <Box key={category}>
                <Typography
                  variant="caption"
                  sx={{
                    px: 2,
                    py: 1,
                    display: 'block',
                    color: 'text.secondary',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                  }}
                >
                  {category}
                </Typography>
                <List disablePadding>
                  <AnimatePresence>
                    {commands.map((command, index) => {
                      const globalIndex = filteredCommands.indexOf(command);
                      const isSelected = globalIndex === selectedIndex;

                      return (
                        <ListItem
                          key={command.id}
                          component={motion.div}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: index * 0.02 }}
                          button
                          selected={isSelected}
                          onClick={() => executeCommand(command)}
                          sx={{
                            py: 1.5,
                            px: 2,
                            borderRadius: 1,
                            mx: 1,
                            mb: 0.5,
                            bgcolor: isSelected ? 'action.selected' : 'transparent',
                            '&:hover': {
                              bgcolor: 'action.hover',
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <command.icon
                              sx={{
                                fontSize: 20,
                                color: isSelected ? 'primary.main' : 'text.secondary',
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={command.title}
                            secondary={command.description}
                            primaryTypographyProps={{
                              variant: 'body2',
                              fontWeight: 500,
                            }}
                            secondaryTypographyProps={{
                              variant: 'caption',
                            }}
                          />
                        </ListItem>
                      );
                    })}
                  </AnimatePresence>
                </List>
              </Box>
            ))
          )}
        </Box>

        {/* Footer with keyboard hints */}
        <Box
          sx={{
            p: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.default',
            display: 'flex',
            gap: 2,
            justifyContent: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip label="↑↓" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
            <Typography variant="caption" color="text.secondary">
              Navigate
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip label="↵" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
            <Typography variant="caption" color="text.secondary">
              Select
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip label="ESC" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
            <Typography variant="caption" color="text.secondary">
              Close
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;
