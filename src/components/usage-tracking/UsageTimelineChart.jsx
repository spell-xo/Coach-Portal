import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const formatTokens = (value) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value;
};

const formatCost = (value) => `$${value.toFixed(2)}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Paper sx={{ p: 1.5 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{label}</Typography>
      {payload.map((entry) => (
        <Typography key={entry.name} variant="body2" sx={{ color: entry.color }}>
          {entry.name}: {entry.name === 'Est. Cost' ? `$${Number(entry.value).toFixed(2)}` : formatTokens(entry.value)}
        </Typography>
      ))}
    </Paper>
  );
};

const UsageTimelineChart = ({ data }) => {
  if (!data?.length) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">No timeline data available</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Usage Over Time</Typography>
      <Box sx={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="tokens" tickFormatter={formatTokens} />
            <YAxis yAxisId="cost" orientation="right" tickFormatter={formatCost} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="tokens"
              type="monotone"
              dataKey="prompt_tokens"
              name="Input Tokens"
              stroke="#1976d2"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="tokens"
              type="monotone"
              dataKey="completion_tokens"
              name="Output Tokens"
              stroke="#9c27b0"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="cost"
              type="monotone"
              dataKey="estimated_cost_usd"
              name="Est. Cost"
              stroke="#2e7d32"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default UsageTimelineChart;
