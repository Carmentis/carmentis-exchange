import {useState} from "react";
import axios from "axios";
import {SEPAPaymentData} from "@/app/payment/api";
import {usePaymentConfig} from "@/hooks/usePaymentConfig";

/**
 * Hook to process SEPA payments
 * @returns {Object} Object containing processPayment function and loading/error states
 */
export function useSEPAPayment() {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const [paymentData, setPaymentData] = useState<any>(null);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const {EXCHANGE_API} = usePaymentConfig();

    const processPayment = async (paymentDetails: SEPAPaymentData) => {
        if (!EXCHANGE_API) {
            throw new Error("The NEXT_PUBLIC_EXCHANGE_API variable is not defined");
        }

        setLoading(true);
        setError(null);
        setPaymentStatus('processing');

        try {
            // Send SEPA payment information to the backend
            const response = await axios.post(`${EXCHANGE_API}/processPayment`, {
                paymentMethod: 'sepa',
                amount: paymentDetails.amount,
                currency: paymentDetails.currency || 'eur',
                status: 'pending', // SEPA payments are pending until confirmed by the bank
                details: {
                    accountHolderName: paymentDetails.accountHolderName,
                    iban: paymentDetails.iban,
                    bic: paymentDetails.bic,
                    reference: paymentDetails.reference || `TOKEN-${Date.now()}`
                }
            });

            setPaymentData(response.data);
            setPaymentStatus('success');
            setLoading(false);
            return response.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err : new Error(String(err));
            console.error(`SEPA payment processing error:`, errorMessage);
            setError(errorMessage);
            setPaymentStatus('error');
            setLoading(false);
            throw errorMessage;
        }
    };

    return {processPayment, loading, error, paymentData, paymentStatus};
}