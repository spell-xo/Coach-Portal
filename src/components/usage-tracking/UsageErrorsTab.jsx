import React from 'react';
import { Box, Paper, Typography, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const ERROR_COLORS = {
  rate_limit: '#ed6c02',
  timeout: '#fbc02d',
  service_unavailable: '#ef6c00',
  auth_error: '#d32f2f',
  model_not_found: '#7b1fa2',
  invalid_request: '#c62828',
  unknown: '#9e9e9e',
};

const ERROR_LABELS = {
  rate_limit: 'Rate Limit',
  timeout: 'Timeout',
  service_unavailable: 'Unavailable',
  auth_error: 'Auth Error',
  model_not_found: 'Not Found',
  invalid_request: 'Invalid Request',
  unknown: 'Unknown',
};

const formatNumber = (num) => {
  if (num == null) return '0';
  return num.toLocaleString();
};

const formatPercent = (value) => {
  if (value == null) return '0%';
  return `${(value * 100).toFixed(0)}%`;
};

const StatCard = ({ title, value, color }) => (
  <Paper sx={{ p: 3, flex: 1, minWidth: 160 }}>
    <Typography variant="body2" color="text.secondary" gutterBottom>
      {title}
    </Typography>
    <Typography variant="h4" sx={{ fontWeight: 700, color: color || 'text.primary' }}>
      {value}
    </Typography>
  </Paper>
);

const ErrorTypeChip = ({ type }) => {
  const color = ERROR_COLORS[type] || ERROR_COLORS.unknown;
  const label = ERROR_LABELS[type] || type;
  return (
    <Chip
      label={label}
      size="small"
      sx={{ backgroundColor: color, color: '#fff', fontWeight: 600, fontSize: '0.75rem' }}
    />
  );
};

const FallbackChip = ({ succeeded }) => {
  if (succeeded === true) {
    return <Chip label="Success" size="small" color="success" variant="outlined" />;
  }
  if (succeeded === false) {
    return <Chip label="Failed" size="small" color="error" variant="outlined" />;
  }
  return <Typography variant="body2" color="text.secondary">-</Typography>;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Paper sx={{ p: 1.5 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{label}</Typography>
      {payload.map((entry) => (
        <Typography key={entry.name} variant="body2" sx={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </Typography>
      ))}
    </Paper>
  );
};

const UsageErrorsTab = ({ data = [], recentErrors = [], totals = {} }) => {
  // Determine which error types have data for the chart
  const errorTypesWithData = Object.keys(ERROR_COLORS).filter((et) =>
    data.some((d) => (d[et] || 0) > 0)
  );

  return (
    <Box>
      {/* Summary cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <StatCard
          title="Total Errors"
          value={formatNumber(totals.total_errors)}
          color="error.main"
        />
        <StatCard
          title="Rate Limits"
          value={formatNumber(totals.rate_limit)}
          color="#ed6c02"
        />
        <StatCard
          title="Fallback Success Rate"
          value={formatPercent(totals.fallback_success_rate)}
          color="success.main"
        />
      </Box>

      {/* Error timeline chart */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Error Timeline</Typography>
        {data.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No errors recorded in this period
          </Typography>
        ) : (
          <Box sx={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {errorTypesWithData.map((et) => (
                  <Bar
                    key={et}
                    dataKey={et}
                    name={ERROR_LABELS[et]}
                    stackId="errors"
                    fill={ERROR_COLORS[et]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Paper>

      {/* Recent errors table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Recent Errors</Typography>
        {recentErrors.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No recent errors
          </Typography>
        ) : (
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Error Type</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Fallback Model</TableCell>
                  <TableCell>Fallback Result</TableCell>
                  <TableCell>Component</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentErrors.map((err, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                      {err.created_at ? new Date(err.created_at).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {err.model_id || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <ErrorTypeChip type={err.error_type} />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {err.error_message ? err.error_message.substring(0, 120) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {err.fallback_model || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <FallbackChip succeeded={err.fallback_succeeded} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {err.component || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default UsageErrorsTab;
