'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../auth.context';
import { useGetAllNodes } from '@/hooks/useGetAllNodes';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import {
    AppBar,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Grid,
    IconButton,
    Switch,
    Toolbar,
    Typography,
    Tooltip,
    Paper,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PendingIcon from '@mui/icons-material/Pending';
import ConnectedNodeCard from '@/components/ConnectedNodeCard';
import Nodes from './Nodes';

export default function DashboardPage() {



    return (
        <Grid container spacing={3}>
            {/* Connected Node Card - Side Panel */}
            <Grid item xs={12} md={3}>
                <Box sx={{ position: { md: 'sticky' }, top: { md: '24px' } }}>
                    <ConnectedNodeCard />
                </Box>
            </Grid>

            {/* Main Content */}
            <Grid item xs={12} md={9}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" gutterBottom>
                        Blockchain Nodes
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage validator nodes for your blockchain network
                    </Typography>
                </Box>

                <Nodes/>
            </Grid>
        </Grid>
    );
}