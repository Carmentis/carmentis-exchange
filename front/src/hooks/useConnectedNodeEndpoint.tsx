import useAuthenticatedApiClient from "@/hooks/useAuthenticatedApiClient";
import {useAsync} from "react-use";

export function useConnectedNodeEndpoint() {
    const {client, isAuthenticated} = useAuthenticatedApiClient();
    const {value: nodeEndpoint, loading, error} = useAsync(async () => {
        if (!isAuthenticated) return null;
        const {data: {nodeEndpoint}} = await client.get<{ nodeEndpoint: string }>("/connectedNode");
        return nodeEndpoint;
    }, [client]);
    return {nodeEndpoint, loading, error}
}