'use client';

import {PropsWithChildren} from 'react';
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


export default function layout({children}: PropsWithChildren) {
    const { isAuthenticated, publicKey, logout, loading } = useAuth();

    if (loading) return <>Loading...</>

    return <Box sx={{ flexGrow: 1 }}>
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
                <Tooltip title="Logout">
                    <IconButton color="inherit" onClick={logout}>
                        <LogoutIcon />
                    </IconButton>
                </Tooltip>
            </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {children}
        </Container>



    </Box>
}
/*
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
 */