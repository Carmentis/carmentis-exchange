'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../auth.context';
import { useNodes } from '@/hooks/useNodes';
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

export default function DashboardPage() {
    const { isAuthenticated, publicKey, logout } = useAuth();
    const { nodes, loading, error, fetchNodes, setAsValidator, removeAsValidator } = useNodes();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    
    // State for confirmation modal
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [nodeToToggle, setNodeToToggle] = useState<{ id: string, makeValidator: boolean } | null>(null);

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

    // Handle validator switch toggle
    const handleValidatorSwitchToggle = (id: string, currentValue: boolean) => {
        setNodeToToggle({ id, makeValidator: !currentValue });
        setConfirmModalOpen(true);
    };

    // Handle confirmation modal close
    const handleConfirmModalClose = () => {
        setConfirmModalOpen(false);
        setNodeToToggle(null);
    };

    // Handle confirmation
    const handleConfirmToggle = async () => {
        if (!nodeToToggle) return;
        
        try {
            if (nodeToToggle.makeValidator) {
                await setAsValidator(nodeToToggle.id);
            } else {
                await removeAsValidator(nodeToToggle.id);
            }
        } catch (error) {
            console.error('Failed to toggle validator status:', error);
            // The error toast is already shown by the useNodes hook
        } finally {
            handleConfirmModalClose();
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
                                    <Grid item xs={12} sm={6} lg={4} key={node.id}>
                                        <Card>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                    <Typography variant="h6" component="div" noWrap>
                                                        {node.id}
                                                    </Typography>
                                                </Box>


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

                                            <CardActions sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Validator
                                                </Typography>
                                                <Switch
                                                    checked={node.isValidator}
                                                    onChange={() => handleValidatorSwitchToggle(node.id, node.isValidator)}
                                                    disabled={loading}
                                                    color="primary"
                                                />
                                            </CardActions>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Grid>
                </Grid>
            </Container>

            {/* Confirmation Modal */}
            <Dialog
                open={confirmModalOpen}
                onClose={handleConfirmModalClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {nodeToToggle?.makeValidator 
                        ? "Set Node as Validator" 
                        : "Remove Node as Validator"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {nodeToToggle?.makeValidator
                            ? "Are you sure you want to set this node as a validator? This will allow the node to participate in consensus."
                            : "Are you sure you want to remove this node as a validator? This will prevent the node from participating in consensus."}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleConfirmModalClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmToggle} color="primary" autoFocus>
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}