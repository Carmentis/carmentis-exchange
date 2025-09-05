import { BlockchainFacade } from '@cmts-dev/carmentis-sdk/client';
import {useAsync} from "react-use";
import {useConnectionNodeUrl} from "@/app/payment/connection.context";
import {toast} from "react-toastify";
import error = toast.error;

export function useGetAllNodes() {
    const {nodeUrl, loading} = useConnectionNodeUrl();
    return useAsync(async (node: string, loading: boolean) => {
            // Get the node URL from environment
            if (loading || nodeUrl === undefined) return []

            // Create a blockchain instance
            const blockchain = BlockchainFacade.createFromNodeUrl(nodeUrl);

            // Get the nodes from the blockchain
            const nodesHashesList = await blockchain.getAllValidatorNodes();
            const nodesList = await Promise.all(nodesHashesList.map(async (nodeHash) => {
                const node = await blockchain.loadValidatorNode(nodeHash);
                const orgId = node.getOrganizationId();
                const organisationHoldingNode = await blockchain.loadOrganization(orgId);
                return {node, organisationHoldingNode}
            }))

            return nodesList;
    }, [nodeUrl, loading]);
    

}