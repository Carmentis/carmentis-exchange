import {useState} from "react";
import axios from "axios";
import {usePaymentConfig} from "@/hooks/usePaymentConfig";

/**
 * Hook to create a token account
 * @returns {Object} Object containing createAccount function and loading/error states
 */
export function useCreateTokenAccount() {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const [data, setData] = useState<any>(null);
    const {EXCHANGE_API} = usePaymentConfig();

    const createAccount = async (accountData: { publicKey: string; tokenAmount: number }) => {
        if (!EXCHANGE_API) {
            throw new Error("The NEXT_PUBLIC_EXCHANGE_API variable is not defined");
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(EXCHANGE_API + '/creditTokenAccount', {
                publicKey: accountData.publicKey,
                tokenAmount: accountData.tokenAmount,
            });
            setData(response.data);
            setLoading(false);
            return response.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err : new Error(String(err));
            console.error(`Cannot credit the account: got the following error:`, errorMessage);
            setError(errorMessage);
            setLoading(false);
            throw errorMessage;
        }
    };

    return {createAccount, loading, error, data};
}