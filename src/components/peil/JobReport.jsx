import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';
import bulkJobService from '../../api/bulkJobService';

const JobReport = ({ jobId }) => {
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await bulkJobService.getJob(jobId);
        setJob(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [jobId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 1, fontSize: '0.8rem' }}>{error}</Alert>;
  }

  if (!job) return null;

  const summary = job.summary;
  const items = job.items || [];
  const classifications = summary?.classifications || {};

  return (
    <Box sx={{ px: 1.5, pb: 1.5 }}>
      {/* Summary Stats */}
      {summary && (
        <Box sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            {Object.entries(classifications).map(([cls, count]) => (
              <Chip
                key={cls}
                label={`${cls}: ${count}`}
                size="small"
                color={cls === 'GOOD' ? 'success' : cls === 'BAD' ? 'error' : 'default'}
                sx={{ fontSize: '0.7rem', height: 22 }}
              />
            ))}
          </Box>
          {summary.avg_compliance_score != null && (
            <Typography variant="caption" color="text.secondary">
              Avg compliance: {summary.avg_compliance_score}%
            </Typography>
          )}
          {summary.duration_seconds != null && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              Duration: {(() => { const s = summary.duration_seconds; const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60; return h > 0 ? `${h}h ${m}m ${sec}s` : m > 0 ? `${m}m ${sec}s` : `${sec}s`; })()}
            </Typography>
          )}
        </Box>
      )}

      <Divider sx={{ mb: 1 }} />

      {/* Per-drill Results */}
      <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700, py: 0.5 }}>Player / Drill</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700, py: 0.5 }}>Status</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700, py: 0.5 }}>Result</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700, py: 0.5 }}>Score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow
                key={idx}
                sx={{
                  '&:last-child td': { borderBottom: 0 },
                  cursor: item.user_id ? 'pointer' : 'default',
                  '&:hover': item.user_id ? { bgcolor: 'action.hover' } : {},
                }}
                onClick={() => {
                  if (item.user_id && item.drill_id) {
                    navigate(`/players/${item.user_id}/drills/${item.drill_id}`);
                  }
                }}
              >
                <TableCell sx={{ fontSize: '0.7rem', py: 0.25, maxWidth: 160 }}>
                  <Typography variant="caption" fontWeight="bold" noWrap title={item.drill_id}>
                    {item.player_name || item.drill_id?.slice(-8) || '-'}
                  </Typography>
                  {item.game_type && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.6rem' }}>
                      {item.game_type}
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ fontSize: '0.7rem', py: 0.25 }}>
                  <Chip
                    label={item.status}
                    size="small"
                    color={
                      item.status === 'success' ? 'success' :
                      item.status === 'failed' ? 'error' :
                      item.status === 'processing' ? 'primary' :
                      item.status === 'skipped' ? 'info' :
                      'default'
                    }
                    sx={{ fontSize: '0.6rem', height: 18 }}
                  />
                </TableCell>
                <TableCell sx={{ fontSize: '0.7rem', py: 0.25 }}>
                  {item.classification || '-'}
                </TableCell>
                <TableCell sx={{ fontSize: '0.7rem', py: 0.25 }}>
                  {item.compliance_score != null ? `${item.compliance_score}%` : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {/* Errors Section */}
      {summary?.errors?.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" fontWeight="bold" color="error.main">
            Errors ({summary.errors.length})
          </Typography>
          {summary.errors.slice(0, 5).map((err, idx) => (
            <Typography key={idx} variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
              {err.drill_id?.slice(-8)}: {err.error}
            </Typography>
          ))}
          {summary.errors.length > 5 && (
            <Typography variant="caption" color="text.secondary">
              ...and {summary.errors.length - 5} more
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default JobReport;
