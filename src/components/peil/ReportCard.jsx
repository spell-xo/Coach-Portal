import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import TableChartIcon from '@mui/icons-material/TableChart';
import wizardService from '../../api/wizardService';

const ReportCard = ({ reportId, sessionId, report }) => {
  const [expanded, setExpanded] = useState(false);
  const [exporting, setExporting] = useState(null);

  const handleExport = async (format) => {
    setExporting(format);
    try {
      await wizardService.exportReport(sessionId, reportId, format);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(null);
    }
  };

  const title = report?.title || reportId;
  const rowCount = report?.row_count || '?';
  const columnCount = report?.column_count || '?';
  const summary = report?.summary || '';
  const previewData = report?.data?.slice(0, 20) || [];
  const columns = report?.columns || [];

  return (
    <Card sx={{ my: 1, border: '1px solid', borderColor: 'primary.light', borderRadius: 2 }}>
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <TableChartIcon color="primary" />
          <Typography variant="subtitle1" fontWeight="bold">{title}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Chip label={`${rowCount} rows`} size="small" variant="outlined" />
          <Chip label={`${columnCount} columns`} size="small" variant="outlined" />
          <Chip label={reportId} size="small" color="primary" variant="outlined" />
        </Box>
        {summary && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {summary}
          </Typography>
        )}
      </CardContent>

      {previewData.length > 0 && (
        <>
          <Box sx={{ px: 2, pb: 0 }}>
            <Button
              size="small"
              onClick={() => setExpanded(!expanded)}
              endIcon={
                <ExpandMoreIcon
                  sx={{
                    transform: expanded ? 'rotate(180deg)' : 'none',
                    transition: '0.2s',
                  }}
                />
              }
            >
              {expanded ? 'Hide Preview' : 'Preview'}
            </Button>
          </Box>
          <Collapse in={expanded}>
            <TableContainer
              component={Paper}
              sx={{ mx: 2, mb: 2, maxHeight: 400, maxWidth: 'calc(100% - 32px)' }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {columns.map((col, i) => (
                      <TableCell key={i} sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                        {col.label || col.name}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.map((row, ri) => (
                    <TableRow key={ri}>
                      {columns.map((col, ci) => (
                        <TableCell key={ci} sx={{ whiteSpace: 'nowrap' }}>
                          {row[col.name] ?? '\u2014'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Collapse>
        </>
      )}

      <CardActions sx={{ pt: 0 }}>
        <Button
          size="small"
          startIcon={<DownloadIcon />}
          onClick={() => handleExport('csv')}
          disabled={exporting === 'csv'}
        >
          {exporting === 'csv' ? 'Exporting...' : 'CSV'}
        </Button>
        <Button
          size="small"
          startIcon={<DownloadIcon />}
          onClick={() => handleExport('json')}
          disabled={exporting === 'json'}
        >
          {exporting === 'json' ? 'Exporting...' : 'JSON'}
        </Button>
        <Button
          size="small"
          startIcon={<DownloadIcon />}
          onClick={() => handleExport('md')}
          disabled={exporting === 'md'}
        >
          {exporting === 'md' ? 'Exporting...' : 'Markdown'}
        </Button>
      </CardActions>
    </Card>
  );
};

export default ReportCard;
