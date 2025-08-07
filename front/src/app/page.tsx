'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { keyframes } from '@emotion/react';
import { styled } from '@mui/material/styles';

// Define animations for the background
const gradientShift = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const floatUp = keyframes`
  0% {
    transform: translateY(0px);
    opacity: 0;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(-100px);
    opacity: 0;
  }
`;

const floatSideways = keyframes`
  0% {
    transform: translateX(-20px);
  }
  50% {
    transform: translateX(20px);
  }
  100% {
    transform: translateX(-20px);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.7;
  }
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const rotateReverse = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(-360deg);
  }
`;

// Styled components for the animated background
const AnimatedBackground = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'linear-gradient(45deg, #000000, #1a1a1a, #333333, #1a1a1a, #000000)',
  backgroundSize: '400% 400%',
  animation: `${gradientShift} 12s ease infinite`,
  zIndex: -2,
  overflow: 'hidden',
}));

const Particle = styled(Box)(({ theme }) => ({
  position: 'absolute',
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  boxShadow: '0 0 15px rgba(255, 255, 255, 0.3)',
  animation: `${floatUp} 15s infinite linear, ${pulse} 4s infinite ease-in-out`,
}));

const ParticleLarge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  width: '15px',
  height: '15px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  boxShadow: '0 0 20px rgba(255, 255, 255, 0.2)',
  animation: `${floatUp} 20s infinite linear, ${floatSideways} 10s infinite ease-in-out`,
}));

const BlockchainNode = styled(Box)(({ theme }) => ({
  position: 'absolute',
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  border: '2px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 0 30px rgba(255, 255, 255, 0.1)',
  animation: `${pulse} 8s infinite ease-in-out`,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '80%',
    height: '80%',
    borderRadius: '50%',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    transform: 'translate(-50%, -50%)',
    animation: `${rotate} 10s infinite linear`,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '60%',
    height: '60%',
    borderRadius: '50%',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transform: 'translate(-50%, -50%)',
    animation: `${rotateReverse} 7s infinite linear`,
  }
}));

const Connection = styled(Box)(({ theme }) => ({
  position: 'absolute',
  height: '1px',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  boxShadow: '0 0 8px rgba(255, 255, 255, 0.1)',
  transformOrigin: '0 0',
  zIndex: -1,
  animation: `${pulse} 10s infinite ease-in-out`,
}));

export default function HomePage() {
  const router = useRouter();
  const [particles, setParticles] = useState<Array<{ id: number; left: number; delay: number; isLarge?: boolean }>>([]);
  const [nodes, setNodes] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [connections, setConnections] = useState<Array<{ id: number; x1: number; y1: number; x2: number; y2: number; width: number }>>([]);

  // Generate random particles, nodes, and connections on mount
  useEffect(() => {
    // Generate regular particles
    const regularParticles = Array.from({ length: 70 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 10,
      isLarge: false,
    }));
    
    // Generate large particles
    const largeParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i + 100, // Ensure unique IDs
      left: Math.random() * 100,
      delay: Math.random() * 10,
      isLarge: true,
    }));
    
    // Combine both types of particles
    setParticles([...regularParticles, ...largeParticles]);

    // Generate blockchain nodes
    const newNodes = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: 5 + Math.random() * 90,
      y: 5 + Math.random() * 90,
    }));
    setNodes(newNodes);

    // Generate connections between nodes
    const newConnections: Array<{ id: number; x1: number; y1: number; x2: number; y2: number; width: number }> = [];
    newNodes.forEach((node, i) => {
      // Connect to 2-4 other nodes for more connections
      const numConnections = 2 + Math.floor(Math.random() * 3);
      for (let j = 0; j < numConnections; j++) {
        const targetIndex = (i + 1 + j) % newNodes.length;
        newConnections.push({
          id: newConnections.length,
          x1: node.x,
          y1: node.y,
          x2: newNodes[targetIndex].x,
          y2: newNodes[targetIndex].y,
          width: Math.sqrt(
            Math.pow(node.x - newNodes[targetIndex].x, 2) +
            Math.pow(node.y - newNodes[targetIndex].y, 2)
          ),
        });
      }
    });
    setConnections(newConnections);
  }, []);

  const handlePurchaseTokens = () => {
    router.push('/payment');
  };

  const handleAdminAccess = () => {
    router.push('/control');
  };

  return (
    <>
      {/* Animated Background */}
      <AnimatedBackground>
        {/* Particles */}
        {particles.map((particle) => 
          particle.isLarge ? (
            <ParticleLarge
              key={particle.id}
              sx={{
                left: `${particle.left}%`,
                bottom: '-15px',
                animationDelay: `${particle.delay}s`,
              }}
            />
          ) : (
            <Particle
              key={particle.id}
              sx={{
                left: `${particle.left}%`,
                bottom: '-8px',
                animationDelay: `${particle.delay}s`,
              }}
            />
          )
        )}

        {/* Blockchain Nodes and Connections */}
        {connections.map((connection) => (
          <Connection
            key={`connection-${connection.id}`}
            sx={{
              left: `${connection.x1}%`,
              top: `${connection.y1}%`,
              width: `${connection.width}%`,
              transform: `rotate(${Math.atan2(
                connection.y2 - connection.y1,
                connection.x2 - connection.x1
              )}rad)`,
              animationDelay: `${connection.id % 5}s`,
            }}
          />
        ))}
        {nodes.map((node) => (
          <BlockchainNode
            key={`node-${node.id}`}
            sx={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              animationDelay: `${node.id % 4}s`,
            }}
          />
        ))}
      </AnimatedBackground>

      {/* Admin Access Button (Discreet) */}
      <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
        <Tooltip title="Admin Access">
          <IconButton
            onClick={handleAdminAccess}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              color: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
              },
            }}
          >
            <AdminPanelSettingsIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Main Content */}
      <Container
        maxWidth="md"
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Typography
          variant="h1"
          component="h1"
          sx={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: 700,
            textAlign: 'center',
            mb: 4,
            fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
            letterSpacing: '-0.02em',
          }}
        >
          Carmentis Blockchain
        </Typography>

        <Typography
          variant="h5"
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            textAlign: 'center',
            mb: 6,
            maxWidth: '800px',
            textShadow: '0 1px 5px rgba(0, 0, 0, 0.3)',
            fontWeight: 400,
          }}
        >
          A next-generation blockchain platform for secure, transparent, and efficient transactions
        </Typography>

        <Card
          sx={{
            maxWidth: 500,
            width: '100%',
            backdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            mb: 4,
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" component="h2" gutterBottom sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 600 }}>
              Purchase Tokens
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'rgba(0, 0, 0, 0.7)' }}>
              Get started with Carmentis by purchasing tokens. Our secure payment system ensures a smooth and safe transaction process.
            </Typography>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<AccountBalanceWalletIcon />}
              onClick={handlePurchaseTokens}
              sx={{
                py: 1.5,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  boxShadow: '0 6px 8px rgba(0, 0, 0, 0.08)',
                },
              }}
            >
              Purchase Tokens
            </Button>
          </CardContent>
        </Card>

        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            maxWidth: '600px',
            backdropFilter: 'blur(5px)',
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          By purchasing tokens, you agree to our terms of service and privacy policy. Carmentis is a secure blockchain platform that ensures the integrity and confidentiality of all transactions.
        </Typography>
      </Container>
    </>
  );
}