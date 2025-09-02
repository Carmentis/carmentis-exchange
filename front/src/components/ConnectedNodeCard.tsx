'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Tooltip,
  Divider,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import InfoIcon from '@mui/icons-material/Info';
import { useConnectedNodeStatus } from '@/hooks/useConnectedNodeStatus';
import {useConnectedNodeEndpoint} from "@/hooks/useConnectedNodeEndpoint";

interface ConnectedNodeCardProps {
  className?: string;
}

export default function ConnectedNodeCard({ className }: ConnectedNodeCardProps) {
  const { nodeEndpoint, nodeStatus, loading, error } = useConnectedNodeStatus();

  return (
    <Card className={className} sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            Connected Node
          </Typography>
          <Chip
            icon={<LinkIcon fontSize="small" />}
            label="Active"
            color="success"
            size="small"
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Typography color="error" variant="body2">
            Error loading node information: {error.message}
          </Typography>
        ) : nodeStatus ? (
          <>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>URL:</strong> {nodeEndpoint}
            </Typography>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Chain:</strong> {nodeStatus.getChainId()}
            </Typography>

          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 2 }}>
            <InfoIcon color="disabled" sx={{ mr: 1 }} />
            <Typography color="text.secondary">No node information available</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}