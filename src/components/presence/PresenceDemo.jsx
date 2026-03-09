import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { PresenceIndicator, PresenceAvatar } from './index';
import { usePresence } from '../../hooks/usePresence';

/**
 * PresenceDemo component
 *
 * Demonstrates the presence indicator components
 */
const PresenceDemo = () => {
  const [demoStatus, setDemoStatus] = useState('online');

  // Mock user IDs for demo
  const mockUserIds = ['user1', 'user2', 'user3', 'user4', 'user5'];

  // Use the presence hook
  const { presenceMap, getPresence, isConnected } = usePresence(mockUserIds);

  // Mock users
  const mockUsers = [
    { id: 'user1', name: 'John Smith', avatar: null },
    { id: 'user2', name: 'Sarah Johnson', avatar: null },
    { id: 'user3', name: 'Mike Williams', avatar: null },
    { id: 'user4', name: 'Emma Davis', avatar: null },
    { id: 'user5', name: 'Tom Brown', avatar: null },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          Real-time Presence Indicators Demo
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          These components show user online/offline status with real-time Socket.io
          updates.
        </Typography>

        {/* Connection Status */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="body2">
            Socket Connection:{' '}
            <Box
              component="span"
              sx={{
                color: isConnected ? 'success.main' : 'error.main',
                fontWeight: 600,
              }}
            >
              {isConnected ? 'Connected' : 'Disconnected'}
            </Box>
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Presence Indicator Sizes */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          1. Presence Indicator Sizes
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Status dots in different sizes
        </Typography>

        <Box sx={{ display: 'flex', gap: 4, mb: 4, alignItems: 'center' }}>
          <Box>
            <Typography variant="caption" display="block" gutterBottom>
              Small
            </Typography>
            <PresenceIndicator status="online" size="small" />
          </Box>
          <Box>
            <Typography variant="caption" display="block" gutterBottom>
              Medium
            </Typography>
            <PresenceIndicator status="online" size="medium" />
          </Box>
          <Box>
            <Typography variant="caption" display="block" gutterBottom>
              Large
            </Typography>
            <PresenceIndicator status="online" size="large" />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Presence Status Types */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          2. Status Types
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Different status states with hover tooltips
        </Typography>

        <Box sx={{ display: 'flex', gap: 4, mb: 4, alignItems: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" display="block" gutterBottom>
              Online
            </Typography>
            <PresenceIndicator status="online" size="medium" />
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" display="block" gutterBottom>
              Away
            </Typography>
            <PresenceIndicator status="away" size="medium" />
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" display="block" gutterBottom>
              Offline
            </Typography>
            <PresenceIndicator
              status="offline"
              size="medium"
              lastSeen={new Date(Date.now() - 300000)} // 5 min ago
            />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Avatar with Presence */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          3. Avatar with Presence Badge
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          User avatars with presence indicators
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PresenceAvatar
                name="John Smith"
                status="online"
                size={56}
              />
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  John Smith
                </Typography>
                <Typography variant="caption" color="success.main">
                  Online
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PresenceAvatar
                name="Sarah Johnson"
                status="away"
                size={56}
              />
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Sarah Johnson
                </Typography>
                <Typography variant="caption" color="warning.main">
                  Away
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PresenceAvatar
                name="Mike Williams"
                status="offline"
                lastSeen={new Date(Date.now() - 3600000)} // 1 hour ago
                size={56}
              />
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Mike Williams
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Offline
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Interactive Demo */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          4. Interactive Status Demo
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Change status to see different states
        </Typography>

        <Box sx={{ mb: 2 }}>
          <ToggleButtonGroup
            value={demoStatus}
            exclusive
            onChange={(e, value) => value && setDemoStatus(value)}
            size="small"
          >
            <ToggleButton value="online">Online</ToggleButton>
            <ToggleButton value="away">Away</ToggleButton>
            <ToggleButton value="offline">Offline</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 4 }}>
          <PresenceAvatar
            name="Demo User"
            status={demoStatus}
            lastSeen={demoStatus === 'offline' ? new Date() : null}
            size={64}
          />
          <Box>
            <Typography variant="body1" fontWeight={600}>
              Demo User
            </Typography>
            <Typography
              variant="caption"
              color={
                demoStatus === 'online'
                  ? 'success.main'
                  : demoStatus === 'away'
                  ? 'warning.main'
                  : 'text.secondary'
              }
            >
              {demoStatus.charAt(0).toUpperCase() + demoStatus.slice(1)}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* User List with Presence */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          5. User List with Real-time Presence
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Example user list with presence tracking via usePresence hook
        </Typography>

        <Paper variant="outlined">
          <List>
            {mockUsers.map((user, index) => {
              const presence = getPresence(user.id);
              return (
                <React.Fragment key={user.id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <PresenceAvatar
                        name={user.name}
                        status={presence.status}
                        lastSeen={presence.lastSeen}
                        size={40}
                      />
                      <ListItemText
                        primary={user.name}
                        secondary={
                          presence.status === 'online'
                            ? 'Online'
                            : presence.status === 'away'
                            ? 'Away'
                            : presence.lastSeen
                            ? `Last seen ${new Date(presence.lastSeen).toLocaleTimeString()}`
                            : 'Offline'
                        }
                      />
                    </Box>
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        </Paper>
      </Paper>

      {/* Usage Instructions */}
      <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Features Demonstrated
        </Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          <li>
            <Typography variant="body2" paragraph>
              <strong>Animated Status Dots:</strong> Pulsing effect for online users
            </Typography>
          </li>
          <li>
            <Typography variant="body2" paragraph>
              <strong>Multiple Sizes:</strong> Small, medium, and large indicators
            </Typography>
          </li>
          <li>
            <Typography variant="body2" paragraph>
              <strong>Status Types:</strong> Online (green), Away (orange), Offline (grey)
            </Typography>
          </li>
          <li>
            <Typography variant="body2" paragraph>
              <strong>Last Seen Timestamps:</strong> Shows when user was last online
            </Typography>
          </li>
          <li>
            <Typography variant="body2" paragraph>
              <strong>Socket.io Integration:</strong> Real-time updates via usePresence hook
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>Idle Detection:</strong> Automatically sets status to 'away' after 5 minutes
            </Typography>
          </li>
        </Box>
      </Paper>
    </Container>
  );
};

export default PresenceDemo;
