import {useState, useEffect, useRef} from "react";
import axios, {AxiosError} from "axios";
import {CardPaymentData} from "@/app/payment/api";
import {usePaymentConfig} from "@/hooks/usePaymentConfig";

const MAX_POLLING_ATTEMPTS = 60; // 2 minutes (60 * 2 seconds)
const POLLING_INTERVAL = 2000; // 2 seconds

/**
 * Check if error is a network error (should retry) or a business error (should stop)
 */
function isNetworkError(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
        // Network errors don't have a response
        return !error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK';
    }
    return false;
}

/**
 * Hook to process card payments using the backend payment endpoint
 * @returns {Object} Object containing processPayment function and loading/error states
 */
export function useCardPayment() {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const [paymentData, setPaymentData] = useState<any>(null);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const {EXCHANGE_API} = usePaymentConfig();

    // Use refs to track polling state and allow cleanup
    const pollingRef = useRef<{
        timeoutId: NodeJS.Timeout | null;
        attempts: number;
        cancelled: boolean;
    }>({
        timeoutId: null,
        attempts: 0,
        cancelled: false
    });

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            pollingRef.current.cancelled = true;
            if (pollingRef.current.timeoutId) {
                clearTimeout(pollingRef.current.timeoutId);
            }
        };
    }, []);

    const processPayment = async (paymentDetails: CardPaymentData) => {
        if (!EXCHANGE_API) {
            throw new Error("The NEXT_PUBLIC_EXCHANGE_API variable is not defined");
        }

        setLoading(true);
        setError(null);
        setPaymentStatus('processing');

        // Reset polling state
        pollingRef.current = {
            timeoutId: null,
            attempts: 0,
            cancelled: false
        };

        try {
            // Prepare payment payload
            const paymentPayload = {
                card: {
                    number: paymentDetails.cardNumber.replace(/\s/g, ''),
                    exp_month: parseInt(paymentDetails.expiryDate.split('/')[0], 10),
                    exp_year: parseInt('20' + paymentDetails.expiryDate.split('/')[1], 10),
                    cvc: paymentDetails.cvc,
                    name: paymentDetails.cardholderName
                },
                amount: paymentDetails.amount * 100, // Convert to cents
                tokens: paymentDetails.amount, // Assuming 1 token = 1 currency unit
                walletPublicKey: paymentDetails.walletPublicKey || 'wallet-' + Date.now()
            };

            console.log('Payment payload:', paymentPayload);

            // Call the backend payment endpoint
            const response = await axios.post(`${EXCHANGE_API}/payment`, paymentPayload);

            setPaymentData(response.data);

            // Open the redirection URL in a new tab
            if (response.data && response.data.redirect_url) {
                window.open(response.data.redirect_url, '_blank');

                // Start polling for payment status
                if (response.data.payment_id) {
                    const checkPaymentStatus = async () => {
                        // Check if polling was cancelled
                        if (pollingRef.current.cancelled) {
                            return;
                        }

                        // Check if max attempts reached
                        if (pollingRef.current.attempts >= MAX_POLLING_ATTEMPTS) {
                            const timeoutError = new Error('Payment verification timeout. Please check your payment status later.');
                            setError(timeoutError);
                            setPaymentStatus('error');
                            setLoading(false);
                            return;
                        }

                        pollingRef.current.attempts++;

                        try {
                            const statusResponse = await axios.get(`${EXCHANGE_API}/payment/status/${response.data.payment_id}`);

                            if (pollingRef.current.cancelled) {
                                return;
                            }

                            if (statusResponse.data && statusResponse.data.status) {
                                if (statusResponse.data.status === 'completed') {
                                    // Payment completed successfully
                                    setPaymentStatus('success');
                                    setLoading(false);
                                    return;
                                } else if (statusResponse.data.status === 'failed') {
                                    // Payment failed - business error, stop polling
                                    const failedError = new Error('Payment failed. Please try again.');
                                    setError(failedError);
                                    setPaymentStatus('error');
                                    setLoading(false);
                                    return;
                                }
                            }

                            // If payment is still pending, check again after interval
                            pollingRef.current.timeoutId = setTimeout(checkPaymentStatus, POLLING_INTERVAL);
                        } catch (statusError) {
                            if (pollingRef.current.cancelled) {
                                return;
                            }

                            // Differentiate between network errors and business errors
                            if (isNetworkError(statusError)) {
                                // Network error - retry after interval
                                console.warn('Network error while checking payment status, retrying...', statusError);
                                pollingRef.current.timeoutId = setTimeout(checkPaymentStatus, POLLING_INTERVAL);
                            } else {
                                // Business error - stop polling
                                const businessError = statusError instanceof Error ? statusError : new Error(String(statusError));
                                setError(businessError);
                                setPaymentStatus('error');
                                setLoading(false);
                            }
                        }
                    };

                    // Start checking payment status
                    checkPaymentStatus();
                }
            }

            return response.data;
        } catch (err) {
            console.error('Payment processing error:', err);

            let errorMessage: Error;

            if (axios.isAxiosError(err)) {
                console.error('Response data:', err.response?.data);
                console.error('Response status:', err.response?.status);
                console.error('Response headers:', err.response?.headers);

                // Extract error message from server response
                const serverMessage = err.response?.data?.message;
                if (serverMessage) {
                    // Handle array of messages or single message
                    if (Array.isArray(serverMessage)) {
                        errorMessage = new Error(serverMessage.join(', '));
                    } else {
                        errorMessage = new Error(serverMessage);
                    }
                } else {
                    errorMessage = new Error(err.message || 'Payment processing failed');
                }
            } else {
                errorMessage = err instanceof Error ? err : new Error(String(err));
            }

            setError(errorMessage);
            setPaymentStatus('error');
            setLoading(false);
            throw errorMessage;
        }
    };

    return {processPayment, loading, error, paymentData, paymentStatus};
}