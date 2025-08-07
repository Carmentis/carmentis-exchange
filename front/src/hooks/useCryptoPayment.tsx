import {useState} from "react";
import {CryptoPaymentData} from "@/app/payment/api";
import axios from 'axios';
import {env} from "next-runtime-env";
import {usePaymentConfig} from "@/hooks/usePaymentConfig";



/**
 * Hook to process cryptocurrency payments
 * @returns {Object} Object containing processPayment function and loading/error states
 */
export function useCryptoPayment() {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const [paymentData, setPaymentData] = useState<any>(null);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const {EXCHANGE_API} = usePaymentConfig();

    const processPayment = async (paymentDetails: CryptoPaymentData) => {
        if (!EXCHANGE_API) {
            throw new Error("The NEXT_PUBLIC_EXCHANGE_API variable is not defined");
        }

        setLoading(true);
        setError(null);
        setPaymentStatus('processing');

        try {
            // Send cryptocurrency payment information to the backend
            const response = await axios.post(`${EXCHANGE_API}/processPayment`, {
                paymentMethod: 'crypto',
                amount: paymentDetails.amount,
                status: 'pending', // Crypto payments are pending until confirmed on the blockchain
                details: {
                    cryptoType: paymentDetails.cryptoType,
                    walletAddress: paymentDetails.walletAddress
                }
            });

            setPaymentData(response.data);
            setPaymentStatus('success');
            setLoading(false);
            return response.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err : new Error(String(err));
            console.error(`Cryptocurrency payment processing error:`, errorMessage);
            setError(errorMessage);
            setPaymentStatus('error');
            setLoading(false);
            throw errorMessage;
        }
    };

    return {processPayment, loading, error, paymentData, paymentStatus};
}