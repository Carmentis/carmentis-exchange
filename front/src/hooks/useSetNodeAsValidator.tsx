import {useAsyncFn} from "react-use";
import useAuthenticatedApiClient from "@/hooks/useAuthenticatedApiClient";
import {CometBFTPublicKey} from "@cmts-dev/carmentis-sdk/client";

export default function useSetNodeAsValidator() {
    const {client} = useAuthenticatedApiClient();
    const [{
        loading: isUpdateNodeStatus,
        error
    }, setNodeStatus] = useAsyncFn(async (nodePublicKey: CometBFTPublicKey, asValidator: boolean) => {
        return client.put(`/nodes/validator`, {
            asValidator,
            nodePublicKey: nodePublicKey.getPublicKey(),
            nodePublicKeyType: nodePublicKey.getType()
        })
    });


    return {isUpdatingNodeStatus: isUpdateNodeStatus, setNodeAsValidator: setNodeStatus, error}
}
