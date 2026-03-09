import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const UsageByToolTab = ({ data }) => {
  if (!data?.length) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">No tool data available</Typography>
      </Paper>
    );
  }

  const sorted = [...data].sort((a, b) => (b.invocation_count || 0) - (a.invocation_count || 0));

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Tool Invocations</Typography>
      <Box sx={{ width: '100%', height: Math.max(300, sorted.length * 40) }}>
        <ResponsiveContainer>
          <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="tool_name" tick={{ fontSize: 12 }} width={110} />
            <Tooltip />
            <Bar dataKey="invocation_count" name="Invocations" fill="#1976d2" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default UsageByToolTab;
