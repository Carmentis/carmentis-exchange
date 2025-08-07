'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../auth.context';
import { useNodes } from '@/hooks/useNodes';
import { useRouter } from 'next/navigation';
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
    Grid,
    IconButton,
    Toolbar,
    Typography,
    Tooltip,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PendingIcon from '@mui/icons-material/Pending';

export default function DashboardPage() {
    const { isAuthenticated, publicKey, logout } = useAuth();
    const { nodes, loading, error, fetchNodes, setAsValidator, removeAsValidator } = useNodes();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);

    // If not authenticated, redirect to login page
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/control');
        }
    }, [isAuthenticated, router]);

    // Handle refresh
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchNodes();
        } finally {
            setRefreshing(false);
        }
    };

    // Handle logout
    const handleLogout = () => {
        logout();
        router.push('/control');
    };

    // Handle set as validator
    const handleSetAsValidator = async (id: string) => {
        try {
            await setAsValidator(id);
        } catch (error) {
            console.error('Failed to set node as validator:', error);
        }
    };

    // Handle remove as validator
    const handleRemoveAsValidator = async (id: string) => {
        try {
            await removeAsValidator(id);
        } catch (error) {
            console.error('Failed to remove node as validator:', error);
        }
    };

    // Get status chip color
    const getStatusChipColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'success';
            case 'pending':
                return 'warning';
            case 'inactive':
                return 'error';
            default:
                return 'default';
        }
    };

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <CheckCircleIcon fontSize="small" />;
            case 'pending':
                return <PendingIcon fontSize="small" />;
            case 'inactive':
                return <CancelIcon fontSize="small" />;
            default:
                return null;
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" color="default" elevation={0}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Carmentis Control Dashboard
                    </Typography>
                    {publicKey && (
                        <Tooltip title={publicKey}>
                            <Chip
                                label={`${publicKey.substring(0, 6)}...${publicKey.substring(publicKey.length - 4)}`}
                                size="small"
                                sx={{ mr: 2 }}
                            />
                        </Tooltip>
                    )}
                    <Tooltip title="Refresh nodes">
                        <IconButton
                            color="inherit"
                            onClick={handleRefresh}
                            disabled={loading || refreshing}
                        >
                            {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Logout">
                        <IconButton color="inherit" onClick={handleLogout}>
                            <LogoutIcon />
                        </IconButton>
                    </Tooltip>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" gutterBottom>
                        Blockchain Nodes
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage validator nodes for your blockchain network
                    </Typography>
                </Box>

                {loading && !refreshing ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Box sx={{ my: 4 }}>
                        <Typography color="error" align="center">
                            Error loading nodes: {error.message}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Button variant="outlined" onClick={handleRefresh}>
                                Try Again
                            </Button>
                        </Box>
                    </Box>
                ) : nodes.length === 0 ? (
                    <Box sx={{ my: 4 }}>
                        <Typography align="center">No nodes found</Typography>
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        {nodes.map((node) => (
                            <Grid item xs={12} sm={6} md={4} key={node.id}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="h6" component="div" noWrap>
                                                {node.name}
                                            </Typography>
                                            <Chip
                                                icon={getStatusIcon(node.status)}
                                                label={node.status}
                                                color={getStatusChipColor(node.status) as any}
                                                size="small"
                                            />
                                        </Box>

                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            <strong>Endpoint:</strong> {node.endpoint}
                                        </Typography>

                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            <strong>Public Key:</strong>{' '}
                                            <Tooltip title={node.publicKey}>
                        <span>
                          {node.publicKey.substring(0, 10)}...
                            {node.publicKey.substring(node.publicKey.length - 4)}
                        </span>
                                            </Tooltip>
                                        </Typography>

                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                            {node.isValidator ? (
                                                <Chip
                                                    icon={<VerifiedUserIcon fontSize="small" />}
                                                    label="Validator"
                                                    color="primary"
                                                    size="small"
                                                />
                                            ) : (
                                                <Chip label="Non-Validator" size="small" variant="outlined" />
                                            )}
                                        </Box>
                                    </CardContent>

                                    <CardActions>
                                        {node.isValidator ? (
                                            <Button
                                                size="small"
                                                color="error"
                                                onClick={() => handleRemoveAsValidator(node.id)}
                                                disabled={loading}
                                            >
                                                Remove Validator Status
                                            </Button>
                                        ) : (
                                            <Button
                                                size="small"
                                                color="primary"
                                                onClick={() => handleSetAsValidator(node.id)}
                                                disabled={loading}
                                            >
                                                Set as Validator
                                            </Button>
                                        )}
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Container>
        </Box>
    );
}