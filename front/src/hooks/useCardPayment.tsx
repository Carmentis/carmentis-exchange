import {useState} from "react";
import axios from "axios";
import {CardPaymentData} from "@/app/payment/api";
import {usePaymentConfig} from "@/hooks/usePaymentConfig";

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

    const processPayment = async (paymentDetails: CardPaymentData) => {
        if (!EXCHANGE_API) {
            throw new Error("The NEXT_PUBLIC_EXCHANGE_API variable is not defined");
        }

        setLoading(true);
        setError(null);
        setPaymentStatus('processing');

        try {
            // Call the backend payment endpoint
            const response = await axios.post(`${EXCHANGE_API}/payment`, {
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
            });

            setPaymentData(response.data);

            // Open the redirection URL in a new tab
            if (response.data && response.data.redirect_url) {
                window.open(response.data.redirect_url, '_blank');

                // Start polling for payment status
                if (response.data.payment_id) {
                    const checkPaymentStatus = async () => {
                        try {
                            const statusResponse = await axios.post(`${EXCHANGE_API}/payment/result/${response.data.payment_id}`);

                            if (statusResponse.data && statusResponse.data.status) {
                                if (statusResponse.data.status === 'completed') {
                                    // Payment completed successfully
                                    setPaymentStatus('success');
                                    setLoading(false);

                                    // Redirect to success page
                                    //window.location.href = '/payment/success';
                                    //return;
                                } else if (statusResponse.data.status === 'failed') {
                                    // Payment failed
                                    throw new Error('Payment failed');
                                }
                            }

                            // If payment is still pending, check again after 2 seconds
                            setTimeout(checkPaymentStatus, 2000);
                        } catch (statusError) {
                            setError(statusError instanceof Error ? statusError : new Error(String(statusError)));
                            setPaymentStatus('error');
                            setLoading(false);
                        }
                    };

                    // Start checking payment status
                    checkPaymentStatus();
                }
            }

            return response.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err : new Error(String(err));
            console.error(`Payment processing error:`, errorMessage);
            setError(errorMessage);
            setPaymentStatus('error');
            setLoading(false);
            throw errorMessage;
        }
    };

    return {processPayment, loading, error, paymentData, paymentStatus};
}