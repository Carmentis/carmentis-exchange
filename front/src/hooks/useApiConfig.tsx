import {env} from "next-runtime-env";

const EXCHANGE_API = env('NEXT_PUBLIC_EXCHANGE_API');
export default function useApiConfig() {
    if (!EXCHANGE_API) {
        console.error("The NEXT_PUBLIC_EXCHANGE_API variable is not defined");
    }

    return {EXCHANGE_API}
}