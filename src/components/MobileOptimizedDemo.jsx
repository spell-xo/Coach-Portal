import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Card,
  CardContent,
  Stack,
  Chip,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArchiveIcon from '@mui/icons-material/Archive';
import TouchTarget, { TouchButton, TouchIconButton } from './TouchTarget';
import PullToRefresh from './PullToRefresh';
import SwipeableListItem from './SwipeableListItem';
import BottomSheet from './BottomSheet';
import InstallPrompt, { OfflineBanner } from './InstallPrompt';

/**
 * MobileOptimizedDemo
 *
 * Demonstrates all mobile optimization features:
 * - Touch targets (44x44px minimum)
 * - Pull-to-refresh
 * - Swipeable list items
 * - Bottom sheet dialogs
 * - PWA install prompt
 * - Offline detection
 */
const MobileOptimizedDemo = () => {
  const [items, setItems] = useState([
    { id: 1, name: 'John Doe', role: 'Coach', avatar: 'J' },
    { id: 2, name: 'Jane Smith', role: 'Player', avatar: 'J' },
    { id: 3, name: 'Mike Johnson', role: 'Analyst', avatar: 'M' },
    { id: 4, name: 'Sarah Williams', role: 'Coach', avatar: 'S' },
    { id: 5, name: 'Tom Brown', role: 'Player', avatar: 'T' },
  ]);

  const [refreshing, setRefreshing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setRefreshing(false);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setSheetOpen(true);
  };

  const handleDelete = (item) => {
    setItems(items.filter((i) => i.id !== item.id));
  };

  const handleArchive = (item) => {
    console.log('Archive:', item);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Offline Banner */}
      <OfflineBanner />

      {/* PWA Install Prompt */}
      <InstallPrompt position="bottom" />

      <Container maxWidth="md" sx={{ paddingY: 3 }}>
        <Typography variant="h4" sx={{ marginBottom: 1, fontWeight: 600 }}>
          Mobile Optimizations Demo
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 3 }}>
          Try these features on mobile for the best experience
        </Typography>

        {/* Feature Cards */}
        <Stack spacing={2} sx={{ marginBottom: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ marginBottom: 1, fontWeight: 600 }}>
                🎯 Touch Targets
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 2 }}>
                All interactive elements are at least 44x44px (WCAG 2.1 AAA)
              </Typography>
              <Stack direction="row" spacing={2}>
                <TouchButton variant="contained">Touch Button</TouchButton>
                <TouchIconButton>
                  <PersonIcon />
                </TouchIconButton>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ marginBottom: 1, fontWeight: 600 }}>
                🔄 Pull to Refresh
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pull down on the list below to refresh data
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ marginBottom: 1, fontWeight: 600 }}>
                👆 Swipeable Actions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Swipe left on list items to reveal actions
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ marginBottom: 1, fontWeight: 600 }}>
                📱 Bottom Sheet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 2 }}>
                Mobile-friendly dialogs that slide up from bottom
              </Typography>
              <TouchButton onClick={() => setSheetOpen(true)}>
                Open Bottom Sheet
              </TouchButton>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ marginBottom: 1, fontWeight: 600 }}>
                💾 PWA Features
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Install app, offline support, and push notifications
              </Typography>
              <Stack direction="row" spacing={1} sx={{ marginTop: 1 }}>
                <Chip label="Installable" size="small" color="primary" />
                <Chip label="Offline Ready" size="small" color="success" />
                <Chip label="Push Enabled" size="small" color="info" />
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        {/* Pull to Refresh Demo */}
        <Card sx={{ height: 400 }}>
          <PullToRefresh onRefresh={handleRefresh} refreshing={refreshing}>
            <List sx={{ padding: 0 }}>
              {items.map((item, index) => (
                <React.Fragment key={item.id}>
                  <SwipeableListItem
                    rightActions={[
                      {
                        icon: <EditIcon />,
                        color: 'primary',
                        label: 'Edit',
                        onAction: () => handleEdit(item),
                      },
                      {
                        icon: <DeleteIcon />,
                        color: 'error',
                        label: 'Delete',
                        onAction: () => handleDelete(item),
                      },
                    ]}
                  >
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ backgroundColor: 'primary.main' }}>
                          {item.avatar}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={item.name}
                        secondary={item.role}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                    </ListItem>
                  </SwipeableListItem>
                  {index < items.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </PullToRefresh>
        </Card>
      </Container>

      {/* Bottom Sheet */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={selectedItem ? `Edit ${selectedItem.name}` : 'Options'}
        snapPoints={[0.5, 0.8]}
      >
        <Stack spacing={2}>
          <Typography variant="body1">
            This is a bottom sheet dialog optimized for mobile devices.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Features:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Swipe down to dismiss</li>
            <li>Snap points for different heights</li>
            <li>Backdrop with blur effect</li>
            <li>Focus trap for accessibility</li>
            <li>Prevents body scroll</li>
            <li>Keyboard support (Escape to close)</li>
          </ul>
          <TouchButton
            variant="contained"
            fullWidth
            onClick={() => setSheetOpen(false)}
          >
            Got it!
          </TouchButton>
        </Stack>
      </BottomSheet>
    </Box>
  );
};

export default MobileOptimizedDemo;
