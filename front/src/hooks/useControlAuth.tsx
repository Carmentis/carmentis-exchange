import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useControlConfig } from './useControlConfig';
import { toast } from 'react-toastify';
import {useCarmentisAuthByPublicKey} from "@/contexts/AuthModalContext";
import useAuthenticatedApiClient from "@/hooks/useAuthenticatedApiClient";
import {useTokenJWT} from "@/hooks/useTokenJWT";

interface AuthState {
    isAuthenticated: boolean;
    publicKey: string | null;
    loading: boolean;
    error: Error | null;
}

export function useControlAuth() {
    const { CONTROL_API } = useControlConfig();
    const {client} = useAuthenticatedApiClient()
    const {token, setToken, clearToken} = useTokenJWT();
    const authenticateByPublicKey = useCarmentisAuthByPublicKey();
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        publicKey: null,
        loading: false,
        error: null,
    });

    // Initialize auth state from localStorage on mount
    useEffect(() => {
        const storedPublicKey = localStorage.getItem('controlAuthPublicKey');

        if (storedPublicKey) {
            setAuthState({
                isAuthenticated: true,
                publicKey: storedPublicKey,
                loading: false,
                error: null,
            });

            // Verify the token is still valid

        }
    }, [token]);

    // Verify token validity
    const verifyToken = async (token: string) => {

        try {
            await client.get("/auth/status")
        } catch (error) {
            // If token is invalid, log out
            logout();
        }
    };

    // Generate a challenge for authentication
    const generateChallenge = async () => {
        setAuthState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const response = await client.post(`/auth/challenge`);
            return response.data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error : new Error(String(error));
            setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
            toast.error('Failed to generate authentication challenge');
            throw errorMessage;
        }
    };

    // Sign a challenge with the wallet using the modal
    const signChallenge = async (challenge: string) => {
        try {
            // Return a promise that resolves when the user successfully authenticates
            return new Promise<{ signature: string, publicKey: string }>((resolve, reject) => {
                // Show the authentication modal and handle the result
                authenticateByPublicKey(
                    challenge,
                    // Success callback
                    (signature, publicKey) => {
                        resolve({ signature, publicKey });
                    },
                    // Error callback
                    (error) => {
                        toast.error('Failed to sign challenge with wallet');
                        reject(error);
                    }
                );
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error : new Error(String(error));
            toast.error('Failed to sign challenge with wallet');
            throw errorMessage;
        }
    };

    // Verify a signed challenge
    const verifyChallenge = async (challengeId: string, signature: string, publicKey: string) => {
        try {
            const response = await axios.post(`${CONTROL_API}/auth/verify`, {
                challengeId,
                signature,
                publicKey,
            });

            const { token } = response.data;
            setToken(token);
            localStorage.setItem('controlAuthPublicKey', publicKey);
            setAuthState({
                isAuthenticated: true,
                loading: false,
                error: null,
                publicKey,
            });

            return response.data;
        } catch (error) {
            let errorMessage: Error;
            let toastMessage = 'Failed to verify authentication';
            
            // Extract specific error message from axios error response if available
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                const backendMessage = error.response.data.message;
                errorMessage = new Error(backendMessage);
                toastMessage = backendMessage;
            } else {
                errorMessage = error instanceof Error ? error : new Error(String(error));
            }
            
            setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
            toast.error(toastMessage);
            throw errorMessage;
        }
    };

    // Login with wallet
    const login = async () => {
        setAuthState(prev => ({ ...prev, loading: true, error: null }));

        try {
            // Generate a challenge
            const { challengeId, challenge } = await generateChallenge();

            // Sign the challenge with the wallet
            const { signature, publicKey } = await signChallenge(challenge);

            // Verify the signed challenge
            await verifyChallenge(challengeId, signature, publicKey);

            toast.success('Authentication successful');
            return true;
        } catch (error) {
            // The specific error message might already be displayed by verifyChallenge
            // But we'll handle it here as well for completeness
            let errorMessage: Error;
            let toastMessage = 'Authentication failed';
            
            // Extract specific error message from axios error response if available
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                const backendMessage = error.response.data.message;
                errorMessage = new Error(backendMessage);
                // Don't show duplicate toast if the error came from verifyChallenge
                // which already showed a toast
                if (!error.message.includes('Failed to verify authentication')) {
                    toastMessage = backendMessage;
                }
            } else {
                errorMessage = error instanceof Error ? error : new Error(String(error));
            }
            
            setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
            toast.error(toastMessage);
            return false;
        }
    };

    // Logout
    const logout = useCallback(() => {
        clearToken()
        localStorage.removeItem('controlAuthPublicKey');

        setAuthState({
            isAuthenticated: false,
            publicKey: null,
            loading: false,
            error: null,
        });

        toast.info('Logged out successfully');
    }, []);

    return {
        ...authState,
        login,
        logout,
    };
}