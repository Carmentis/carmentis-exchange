import {env} from "next-runtime-env";
import useApiConfig from "@/hooks/useApiConfig";

const STANCER_API = env('NEXT_PUBLIC_STANCER_API') || 'https://api.stancer.com/v1';

export function usePaymentConfig() {
    const {EXCHANGE_API} = useApiConfig();
    return {
        EXCHANGE_API,
        STANCER_API,
    }
}