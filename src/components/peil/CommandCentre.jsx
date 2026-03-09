import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChatIcon from '@mui/icons-material/Chat';
import WorkIcon from '@mui/icons-material/Work';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CommandCentreChat from './CommandCentreChat';
import JobsPanel from './JobsPanel';
import TagsPanel from './TagsPanel';

const DRAWER_WIDTH = 480;

const CommandCentre = ({ open, onClose, selectedDrills, currentFilters, totalFilteredCount, onTagFilter, onRefreshDrills }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [activeJobCount, setActiveJobCount] = useState(0);

  return (
    <Drawer
      variant="persistent"
      anchor="right"
      open={open}
      sx={{
        width: open ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderLeft: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          minHeight: 56,
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold" noWrap>
          Peil Command Centre
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, val) => setActiveTab(val)}
        variant="fullWidth"
        sx={{ borderBottom: '1px solid', borderColor: 'divider', minHeight: 42 }}
      >
        <Tab
          icon={<ChatIcon sx={{ fontSize: 18 }} />}
          iconPosition="start"
          label="Chat"
          sx={{ minHeight: 42, textTransform: 'none', fontSize: '0.8rem' }}
        />
        <Tab
          icon={
            <Badge badgeContent={activeJobCount} color="primary" max={9}>
              <WorkIcon sx={{ fontSize: 18 }} />
            </Badge>
          }
          iconPosition="start"
          label="Jobs"
          sx={{ minHeight: 42, textTransform: 'none', fontSize: '0.8rem' }}
        />
        <Tab
          icon={<LocalOfferIcon sx={{ fontSize: 18 }} />}
          iconPosition="start"
          label="Tags"
          sx={{ minHeight: 42, textTransform: 'none', fontSize: '0.8rem' }}
        />
      </Tabs>

      {/* Tab Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeTab === 0 && (
          <CommandCentreChat
            selectedDrills={selectedDrills}
            currentFilters={currentFilters}
            totalFilteredCount={totalFilteredCount}
            onStartValidation={(drillIds) => {
              setActiveTab(1); // Switch to Jobs tab after starting
            }}
          />
        )}
        {activeTab === 1 && (
          <JobsPanel
            selectedDrills={selectedDrills}
            onActiveJobCountChange={setActiveJobCount}
          />
        )}
        {activeTab === 2 && (
          <TagsPanel
            selectedDrills={selectedDrills}
            onTagFilter={onTagFilter}
            onRefreshDrills={onRefreshDrills}
          />
        )}
      </Box>
    </Drawer>
  );
};

export { DRAWER_WIDTH as COMMAND_CENTRE_WIDTH };
export default CommandCentre;
