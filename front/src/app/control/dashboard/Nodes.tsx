'use client';

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
import {Avatar, CardHeader, Divider, Stack} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import BusinessIcon from '@mui/icons-material/Business';


import {useAuth} from "@/app/control/auth.context";
import {useGetAllNodes} from "@/hooks/useGetAllNodes";
import {useRouter} from "next/navigation";
import {useState} from "react";
import useSetNodeAsValidator from "@/hooks/useSetNodeAsValidator";

export default function Nodes() {
    const {isAuthenticated, publicKey, logout} = useAuth();
    const {value, loading, error} = useGetAllNodes();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const {setNodeAsValidator, isUpdatingNodeStatus} = useSetNodeAsValidator();

    // State for confirmation modal
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [nodeToToggle, setNodeToToggle] = useState<{ id: string, makeValidator: boolean } | null>(null);


    // Handle refresh
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            //await fetchNodes();
        } finally {
            setRefreshing(false);
        }
    };

    // Handle logout
    const handleLogout = () => {
        logout();

    };

    // Handle validator switch toggle
    const handleValidatorSwitchToggle = (id: string, currentValue: boolean) => {
        setNodeToToggle({id, makeValidator: !currentValue});
        setConfirmModalOpen(true);
    };

    // Handle confirmation modal close
    const handleConfirmModalClose = () => {
        setConfirmModalOpen(false);
        setNodeToToggle(null);
    };


    if (loading && !refreshing) {
        return <Box sx={{display: 'flex', justifyContent: 'center', my: 4}}>
            <CircularProgress/>
        </Box>
    }

    if (!value || error) {
        return <Box sx={{my: 4}}>
            <Typography color="error" align="center">
                Error loading nodes: {error.message}
            </Typography>
            <Box sx={{display: 'flex', justifyContent: 'center', mt: 2}}>
                <Button variant="outlined" onClick={handleRefresh}>
                    Try Again
                </Button>
            </Box>
        </Box>
    }

    if (value.length === 0) {
        return <Box sx={{my: 4}}>
            <Typography align="center">No nodes found</Typography>
        </Box>
    }


    const renderedNodes = value.map(({node, organisationHoldingNode}) => {
        const isValidator = node.getVotingPower() !== 0;
        const nodePublicKey = node.getPublicKey();

        return (
            <Grid item xs={12}  key={node.getCometPublicKey()}>
                <Card
                    sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: 2,
                    }}
                >
                    <CardHeader
                        avatar={
                            <Avatar sx={{bgcolor: isValidator ? 'primary.main' : 'grey.500'}}>
                                {organisationHoldingNode.getName()?.[0] ?? '?'}
                            </Avatar>
                        }
                        title={
                            <Stack direction="row" spacing={1} alignItems="center">
                                <BusinessIcon fontSize="small"/>
                                <Typography variant="subtitle1" fontWeight={600}>
                                    {organisationHoldingNode.getName()}
                                </Typography>
                            </Stack>
                        }
                        subheader={
                            <Stack direction="row" spacing={1} alignItems="center">
                                <VpnKeyIcon fontSize="small"/>
                                <Typography
                                    variant="caption"
                                    sx={{fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace'}}
                                >
                                    {node.getCometPublicKey()}
                                </Typography>
                                <Tooltip title="Copier la clé publique">
                                    <IconButton
                                        size="small"
                                        onClick={() => navigator.clipboard.writeText(node.getCometPublicKey())}
                                    >
                                        <ContentCopyIcon fontSize="inherit"/>
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        }
                        sx={{
                            bgcolor: (theme) => (theme.palette.mode === 'light' ? 'grey.50' : 'grey.900'),
                            pb: 1.5,
                        }}
                    />

                    <CardContent sx={{pt: 2}}>
                        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                            {isValidator ? (
                                <Chip
                                    icon={<VerifiedUserIcon fontSize="small"/>}
                                    label="Validator"
                                    color="primary"
                                    size="small"
                                    sx={{fontWeight: 600}}
                                />
                            ) : (
                                <Chip label="Non-Validator" size="small" variant="outlined"/>
                            )}

                            <Chip
                                label={`Voting power: ${node.getVotingPower()}`}
                                size="small"
                                variant={isValidator ? 'filled' : 'outlined'}
                                color={isValidator ? 'success' : 'default'}
                            />
                        </Stack>
                    </CardContent>

                    <Divider/>

                    <CardActions sx={{display: 'flex', justifyContent: 'end', alignItems: 'center', py: 1.5}}>
                        <Button disabled={!isValidator || isUpdatingNodeStatus} variant={"contained"} onClick={() => setNodeAsValidator(nodePublicKey,false)}>
                            Set as replicator
                        </Button>
                        <Button disabled={isValidator || isUpdatingNodeStatus} variant={"contained"} onClick={() => setNodeAsValidator(nodePublicKey,true)}>
                            Set as validator
                        </Button>
                    </CardActions>
                </Card>
            </Grid>
        );
    });


    return <Grid container spacing={3}>
        {renderedNodes}
    </Grid>
}