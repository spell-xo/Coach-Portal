import React from 'react';
import { Card, CardContent, Skeleton, Box } from '@mui/material';

const SkeletonStatCard = () => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="text" width="40%" height={48} sx={{ mt: 1 }} />
          </Box>
          <Skeleton variant="circular" width={56} height={56} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default SkeletonStatCard;
