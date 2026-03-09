import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const formatTokens = (value) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value;
};

const UsageByUserTab = ({ data }) => {
  if (!data?.length) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">No user data available</Typography>
      </Paper>
    );
  }

  const top10 = [...data]
    .sort((a, b) => (b.total_tokens || 0) - (a.total_tokens || 0))
    .slice(0, 10);

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Top 10 Users by Token Usage</Typography>
        <Box sx={{ width: '100%', height: 350 }}>
          <ResponsiveContainer>
            <BarChart data={top10} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={(row) => row.email || row.name || row.user_id} tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
              <YAxis tickFormatter={formatTokens} />
              <Tooltip formatter={(value) => formatTokens(value)} />
              <Bar dataKey="prompt_tokens" name="Input Tokens" fill="#1976d2" stackId="tokens" />
              <Bar dataKey="completion_tokens" name="Output Tokens" fill="#9c27b0" stackId="tokens" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell align="right">Prompt Tokens</TableCell>
              <TableCell align="right">Completion Tokens</TableCell>
              <TableCell align="right">Total Tokens</TableCell>
              <TableCell align="right">Messages</TableCell>
              <TableCell align="right">API Calls</TableCell>
              <TableCell align="right">Est. Cost</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.user_id}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {row.email || row.name || row.user_id}
                  </Typography>
                </TableCell>
                <TableCell align="right">{(row.prompt_tokens || 0).toLocaleString()}</TableCell>
                <TableCell align="right">{(row.completion_tokens || 0).toLocaleString()}</TableCell>
                <TableCell align="right">{(row.total_tokens || 0).toLocaleString()}</TableCell>
                <TableCell align="right">{(row.message_count || 0).toLocaleString()}</TableCell>
                <TableCell align="right">{(row.api_calls || 0).toLocaleString()}</TableCell>
                <TableCell align="right">${(row.estimated_cost_usd || 0).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UsageByUserTab;
