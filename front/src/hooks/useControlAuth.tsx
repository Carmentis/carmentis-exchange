import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useControlConfig } from './useControlConfig';
import { toast } from 'react-toastify';
import {useCarmentisAuthByPublicKey} from "@/contexts/AuthModalContext";

interface AuthState {
    isAuthenticated: boolean;
    token: string | null;
    publicKey: string | null;
    loading: boolean;
    error: Error | null;
}

export function useControlAuth() {
    const { CONTROL_API } = useControlConfig();
    const authenticateByPublicKey = useCarmentisAuthByPublicKey();
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        token: null,
        publicKey: null,
        loading: false,
        error: null,
    });

    // Initialize auth state from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('controlAuthToken');
        const storedPublicKey = localStorage.getItem('controlAuthPublicKey');

        if (storedToken && storedPublicKey) {
            setAuthState({
                isAuthenticated: true,
                token: storedToken,
                publicKey: storedPublicKey,
                loading: false,
                error: null,
            });

            // Verify the token is still valid
            verifyToken(storedToken);
        }
    }, []);

    // Verify token validity
    const verifyToken = async (token: string) => {
        try {
            await axios.get(`${CONTROL_API}/auth/status`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        } catch (error) {
            // If token is invalid, log out
            logout();
        }
    };

    // Generate a challenge for authentication
    const generateChallenge = async () => {
        setAuthState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const response = await axios.post(`${CONTROL_API}/auth/challenge`);
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

            // Store auth data
            localStorage.setItem('controlAuthToken', token);
            localStorage.setItem('controlAuthPublicKey', publicKey);

            setAuthState({
                isAuthenticated: true,
                token,
                publicKey,
                loading: false,
                error: null,
            });

            return response.data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error : new Error(String(error));
            setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
            toast.error('Failed to verify authentication');
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
            const errorMessage = error instanceof Error ? error : new Error(String(error));
            setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
            toast.error('Authentication failed');
            return false;
        }
    };

    // Logout
    const logout = useCallback(() => {
        localStorage.removeItem('controlAuthToken');
        localStorage.removeItem('controlAuthPublicKey');

        setAuthState({
            isAuthenticated: false,
            token: null,
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