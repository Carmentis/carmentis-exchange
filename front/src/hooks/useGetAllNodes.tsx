import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useControlConfig } from './useControlConfig';
import { toast } from 'react-toastify';
import { BlockchainFacade } from '@cmts-dev/carmentis-sdk/client';
import { env } from 'next-runtime-env';
import {useAsync} from "react-use";

export function useGetAllNodes() {
    return useAsync(async () => {
            // Get the node URL from environment
            const nodeUrl = "http://localhost:26657"

            // Create a blockchain instance
            const blockchain = BlockchainFacade.createFromNodeUrl(nodeUrl);

            // Get the nodes from the blockchain
            const nodesHashesList = await blockchain.getAllValidatorNodes();
            console.log(nodesHashesList)
            const nodesList = await Promise.all(nodesHashesList.map(async (nodeHash) => {
                const node = await blockchain.loadValidatorNode(nodeHash);
                const orgId = node.getOrganizationId();
                const organisationHoldingNode = await blockchain.loadOrganization(orgId);
                return {node, organisationHoldingNode}
            }))

            return nodesList;
    });
    

}