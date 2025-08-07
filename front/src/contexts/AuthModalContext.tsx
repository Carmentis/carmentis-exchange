'use client';

import React, {createContext, useContext, useState, ReactNode, useCallback} from 'react';
import {Modal, Box, Paper, Typography, Button, CircularProgress} from '@mui/material';
import {wiClient} from "@cmts-dev/carmentis-sdk/client";
import {env} from "next-runtime-env";

// Define the context type
interface AuthModalContextType {
    showModal: (content: ReactNode) => void;
    hideModal: () => void;
    isOpen: boolean;
    isLoading: boolean;
    authenticateByPublicKey: (challenge: string, onSuccess: (signature: string, publicKey: string) => void, onError: (error: Error) => void) => void;
}

// Create the context with a default undefined value
const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

// Modal style
const modalStyle = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
    backdropFilter: 'blur(10px)',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
};

// Provider component
export function AuthModalProvider({children}: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [modalContent, setModalContent] = useState<ReactNode>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Function to show the modal
    const showModal = useCallback((content: ReactNode) => {
        setModalContent(content);
        setIsOpen(true);
    }, []);

    // Function to hide the modal
    const hideModal = useCallback(() => {
        setIsOpen(false);
        // Clear content after animation completes
        setTimeout(() => setModalContent(null), 300);
    }, []);



    // Function to authenticate by public key
    const authenticateByPublicKey = useCallback(
        (
            challenge: string,
            onSuccess: (signature: string, publicKey: string) => void,
            onError: (error: Error) => void
        ) => {
            setIsLoading(true);

            // Create authentication content
            const authContent = (
                <Box>
                    <Typography variant="h6" component="h2" gutterBottom>
                        Wallet Authentication
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        Please sign the message with your wallet to authenticate.
                    </Typography>

                    <Box sx={{mt: 2, mb: 2}}>
                        <div id="qr-code" style={{
                            width: '100%',
                            height: '200px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            {isLoading && <CircularProgress/>}
                        </div>
                    </Box>

                    <Box sx={{mt: 2, display: 'flex', justifyContent: 'center'}}>
                        <Button
                            id="extension-button"
                            variant="contained"
                            sx={{
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                },
                            }}
                        >
                            Connect Wallet Extension
                        </Button>
                    </Box>
                </Box>
            );

            // Show the modal with authentication content
            showModal(authContent);

            // Get the operator URL from environment
            const operatorUrl = env('NEXT_PUBLIC_OPERATOR_URL') || '';

            // Initialize the wallet integration client
            setTimeout(() => {
                try {
                    const client = new wiClient();
                    client.attachQrCodeContainer("qr-code");
                    client.setServerUrl(operatorUrl);
                    client.attachExtensionButton("extension-button");

                    client.authenticationByPublicKey(challenge)
                        .then((result) => {
                            setIsLoading(false);
                            onSuccess(result.signature, result.publicKey);
                            hideModal();
                        })
                        .catch((error) => {
                            setIsLoading(false);
                            onError(error);
                            hideModal();
                        });
                } catch (error) {
                    setIsLoading(false);
                    onError(error instanceof Error ? error : new Error(String(error)));
                    hideModal();
                }
            }, 500);
        },
        [showModal, hideModal]
    );

    return (
        <AuthModalContext.Provider
            value={{
                showModal,
                hideModal,
                authenticateByPublicKey,
                isOpen,
                isLoading
            }}
        >
            {children}
            <Modal
                open={isOpen}
                onClose={hideModal}
                aria-labelledby="auth-modal-title"
                aria-describedby="auth-modal-description"
            >
                <Paper sx={modalStyle}>
                    {modalContent}
                </Paper>
            </Modal>
        </AuthModalContext.Provider>
    );
}

// Hook to use the auth modal context
export function useAuthModal() {
    const context = useContext(AuthModalContext);
    if (context === undefined) {
        throw new Error('useAuthModal must be used within an AuthModalProvider');
    }
    return context;
};

export function useCarmentisAuthByPublicKey() {
    const {authenticateByPublicKey} = useAuthModal();
    return authenticateByPublicKey;
}