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
import { useConnectedNode } from '@/hooks/useConnectedNode';

interface ConnectedNodeCardProps {
  className?: string;
}

export default function ConnectedNodeCard({ className }: ConnectedNodeCardProps) {
  const { nodeInfo, loading, error } = useConnectedNode();

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
        ) : nodeInfo ? (
          <>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Address:</strong>{' '}
              <Tooltip title={nodeInfo.address}>
                <span>
                  {nodeInfo.address.length > 20
                    ? `${nodeInfo.address.substring(0, 10)}...${nodeInfo.address.substring(
                        nodeInfo.address.length - 4
                      )}`
                    : nodeInfo.address}
                </span>
              </Tooltip>
            </Typography>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>URL:</strong> {nodeInfo.url}
            </Typography>

            {nodeInfo.version && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Version:</strong> {nodeInfo.version}
              </Typography>
            )}

            <Divider sx={{ my: 1.5 }} />

            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Status:</strong>
              </Typography>
              
              {nodeInfo.status && typeof nodeInfo.status === 'object' ? (
                <Box sx={{ pl: 2 }}>
                  {Object.entries(nodeInfo.status)
                    .filter(([key]) => key !== 'address' && key !== 'version')
                    .map(([key, value]) => (
                      <Typography key={key} variant="body2" color="text.secondary" gutterBottom>
                        <strong>{key}:</strong> {String(value)}
                      </Typography>
                    ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No detailed status available
                </Typography>
              )}
            </Box>
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