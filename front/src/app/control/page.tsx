'use client';

import {useEffect, useState} from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth.context';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Typography,
  Paper,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import {wiClient} from "@cmts-dev/carmentis-sdk/client";
import {useCarmentisAuthByPublicKey} from "@/contexts/AuthModalContext";

export default function ControlLoginPage() {
  const { isAuthenticated, loading, login } = useAuth();
  const authenticateByPublicKey  = useCarmentisAuthByPublicKey();
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    router.push('/control/dashboard');
    return null;
  }

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const success = await login();
      if (success) {
        router.push('/control/dashboard');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };
    /*
    const operatorUrl = env('NEXT_PUBLIC_OPERATOR_URL');
    useEffect(() => {
        const client = new wiClient;
        client.attachQrCodeContainer("qr-code");
        client.setServerUrl(operatorUrl);
        client.attachExtensionButton("extension-button")
        client.authenticationByPublicKey(challenge)
            .then(onChallengeResponse)
            .catch(console.error);
    }, []);

     */

  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: 2,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Carmentis Control
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Sign in with your wallet to access the control dashboard
          </Typography>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Wallet Authentication
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Click the button below to connect your wallet. You'll be asked to sign a message to verify your identity.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<AccountBalanceWalletIcon />}
              onClick={handleLogin}
              disabled={loading || isLoggingIn}
              sx={{
                py: 1.5,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                },
              }}
            >
              {isLoggingIn || loading ? (
                <>
                  <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                  Connecting...
                </>
              ) : (
                'Connect Wallet'
              )}
            </Button>
          </CardContent>
        </Card>

        <Typography variant="body2" color="text.secondary" align="center">
          By connecting your wallet, you agree to the terms of service and privacy policy.
        </Typography>
      </Paper>
    </Container>
  );
}