import {useEffect, useState} from "react";
import axios from "axios";
import {usePaymentConfig} from "@/hooks/usePaymentConfig";

/**
 * Hook to fetch exchange configuration
 * @returns {Object} Object containing nodeUrl and loading/error states
 */
export function useExchangeConfig() {
    const [nodeUrl, setNodeUrl] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const {EXCHANGE_API} = usePaymentConfig();

    useEffect(() => {
        const fetchConfig = async () => {
            if (!EXCHANGE_API) {
                setError(new Error("The NEXT_PUBLIC_EXCHANGE_API variable is not defined"));
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(EXCHANGE_API + '/networkConfig');
                setNodeUrl(response.data.nodeUrl);
                setLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err : new Error(String(err)));
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    return {nodeUrl, loading, error};
}