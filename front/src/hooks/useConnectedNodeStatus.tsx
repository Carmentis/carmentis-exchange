import {useAsync} from "react-use";
import useAuthenticatedApiClient from "@/hooks/useAuthenticatedApiClient";
import {BlockchainFacade} from "@cmts-dev/carmentis-sdk/client";
import {useConnectedNodeEndpoint} from "@/hooks/useConnectedNodeEndpoint";


export function useConnectedNodeStatus() {
    const {nodeEndpoint} = useConnectedNodeEndpoint();
    const {client} = useAuthenticatedApiClient();
    const {value: nodeStatus, loading, error} = useAsync(async () => {
        if (!nodeEndpoint) return null;
        const blockchain = BlockchainFacade.createFromNodeUrl(nodeEndpoint);
        return await blockchain.getNodeStatus();
    }, [nodeEndpoint, client]);
    return {nodeEndpoint, nodeStatus,loading,error}
}