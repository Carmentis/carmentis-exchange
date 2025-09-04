import { Injectable, Logger } from '@nestjs/common';

import {
    BlockchainFacade,
    CometBFTPublicKey,
    ValidatorNodeNetworkIntegrationPublicationExecutionContext,
} from '@cmts-dev/carmentis-sdk/server';
import { CryptoService } from '../crypto/crypto.service';
import { ControlConfigService } from '../config/services/ControlConfigService';

@Injectable()
export class NodeService {
    private readonly logger = new Logger(NodeService.name);

    constructor(
        private readonly controlConfigService: ControlConfigService,
        private readonly cryptoService: CryptoService,
    ) {}

    setAsValidator(
        nodePublicKey: string,
        nodePublicKeyType: string,
    ): Promise<boolean> {
        return this.adjustVotingPower(nodePublicKey, nodePublicKeyType, 10);
    }

    setAsReplicator(nodePublicKey: string, nodePublicKeyType: string) {
        return this.adjustVotingPower(nodePublicKey, nodePublicKeyType, 0);
    }

    private async adjustVotingPower(
        nodePublicKey: string,
        nodePublicKeyType: string,
        votingPower: number,
    ) {
        // create the blockchain client
        const issuerPrivateKey = this.cryptoService.getIssuerPrivateKey();
        const nodeUrl = this.controlConfigService.getNodeUrl();
        const blockchain = BlockchainFacade.createFromNodeUrlAndPrivateKey(
            nodeUrl,
            issuerPrivateKey,
        );
        const validatorNodeId =
            await blockchain.getValidatorNodeByCometBFTPublicKey(
                CometBFTPublicKey.createFromEd25519PublicKey(nodePublicKey),
            );
        const validatorNodeNetworkIntegrationPublicationContext =
            new ValidatorNodeNetworkIntegrationPublicationExecutionContext()
                .withExistingValidatorNodeId(validatorNodeId)
                .withVotingPower(votingPower);
        await blockchain.publishValidatorNodeNetworkIntegration(
            validatorNodeNetworkIntegrationPublicationContext,
        );
        await blockchain.loadValidatorNode(validatorNodeId);
        return true;
    }
}
