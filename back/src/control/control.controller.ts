import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Req, UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { NodeService } from './node.service';
import {
  GenerateChallengeResponseDto,
  VerifyChallengeRequestDto,
  VerifyChallengeResponseDto,
  AuthStatusResponseDto,
} from './dto/auth.dto';
import { CreateNodeDto, NodeDto, UpdateNodeDto } from './dto/node.dto';
import { NodeStatusResponseDto } from './dto/node-status.dto';
import { Request } from 'express';
import { Public } from './decorators/public.decorator';
import { EnvService } from '../env/env.service';
import { BlockchainFacade } from '@cmts-dev/carmentis-sdk/server';
import { JwtAuthGuard } from './guards/jwt-auth.guard';


@UseGuards(JwtAuthGuard)
@Controller('/api/control')
export class ControlController {
  private readonly logger = new Logger(ControlController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly nodeService: NodeService,
    private readonly envService: EnvService,
  ) {}

  /**
   * Generate a new authentication challenge
   * @returns The generated challenge
   */
  @Public()
  @Post('auth/challenge')
  @HttpCode(HttpStatus.OK)
  async generateChallenge(): Promise<GenerateChallengeResponseDto> {
    this.logger.log('Generating authentication challenge');
    return this.authService.generateChallenge();
  }

  /**
   * Verify a challenge signature
   * @param verifyChallengeDto The challenge verification data
   * @returns The JWT token if the signature is valid
   */
  @Public()
  @Post('auth/verify')
  @HttpCode(HttpStatus.OK)
  async verifyChallenge(
    @Body() verifyChallengeDto: VerifyChallengeRequestDto,
  ): Promise<VerifyChallengeResponseDto> {
    this.logger.log(`Verifying challenge: ${verifyChallengeDto.challengeId}`);
    return this.authService.verifyChallenge(
      verifyChallengeDto.challengeId,
      verifyChallengeDto.signature,
      verifyChallengeDto.publicKey,
    );
  }

  /**
   * Get the authentication status
   * @param req The request object
   * @returns The authentication status
   */
  @Get('auth/status')
  async getAuthStatus(@Req() req: Request): Promise<AuthStatusResponseDto> {
    this.logger.log('Getting authentication status');
    return {
      publicKey: req['publicKey'],
      authenticated: true,
    };
  }

  /**
   * Get all nodes
   * @returns All nodes
   */
  @Get('nodes')
  async getAllNodes(): Promise<NodeDto[]> {
    this.logger.log('Getting all nodes');
    return this.nodeService.findAll();
  }

  /**
   * Get a node by ID
   * @param id The node ID
   * @returns The node
   */
  @Get('nodes/:id')
  async getNodeById(@Param('id') id: string): Promise<NodeDto> {
    this.logger.log(`Getting node with ID: ${id}`);
    return this.nodeService.findOne(id);
  }

  /**
   * Create a new node
   * @param createNodeDto The node data
   * @returns The created node
   */
  @Post('nodes')
  async createNode(@Body() createNodeDto: CreateNodeDto): Promise<NodeDto> {
    this.logger.log(`Creating node: ${createNodeDto.name}`);
    return this.nodeService.create(createNodeDto);
  }

  /**
   * Update a node
   * @param id The node ID
   * @param updateNodeDto The node data
   * @returns The updated node
   */
  @Put('nodes/:id')
  async updateNode(
    @Param('id') id: string,
    @Body() updateNodeDto: UpdateNodeDto,
  ): Promise<NodeDto> {
    this.logger.log(`Updating node with ID: ${id}`);
    return this.nodeService.update(id, updateNodeDto);
  }

  /**
   * Delete a node
   * @param id The node ID
   */
  @Delete('nodes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNode(@Param('id') id: string): Promise<void> {
    this.logger.log(`Deleting node with ID: ${id}`);
    return this.nodeService.remove(id);
  }

  /**
   * Set a node as a validator
   * @param id The node ID
   * @returns The updated node
   */
  @Put('nodes/:id/validator')
  async setNodeAsValidator(@Param('id') id: string): Promise<NodeDto> {
    this.logger.log(`Setting node with ID ${id} as validator`);
    return this.nodeService.setAsValidator(id);
  }

  /**
   * Remove a node as a validator
   * @param id The node ID
   * @returns The updated node
   */
  @Delete('nodes/:id/validator')
  async removeNodeAsValidator(@Param('id') id: string): Promise<NodeDto> {
    this.logger.log(`Removing node with ID ${id} as validator`);
    return this.nodeService.removeAsValidator(id);
  }

  /**
   * Get all validator nodes
   * @returns All validator nodes
   */
  @Get('nodes/validators')
  async getAllValidatorNodes(): Promise<NodeDto[]> {
    this.logger.log('Getting all validator nodes');
    return this.nodeService.findAllValidators();
  }

  /**
   * Get information about the connected node
   * @returns The connected node information
   */
  @Get('connected-node')
  async getConnectedNode(): Promise<NodeStatusResponseDto> {
    this.logger.log('Getting connected node information');
    
    try {
      // Get the node URL from the environment service
      const nodeUrl = this.envService.nodeUrl;
      
      if (!nodeUrl) {
        throw new Error('Node URL is not defined');
      }
      
      // Create a provider and blockchain instance
      const blockchain = BlockchainFacade.createFromNodeUrl(nodeUrl);

      // Get the node status
      const nodeStatus = await blockchain.getNodeStatus();
      
      // Return the node information
      return {
        address: nodeStatus.getRpcAddress() || 'Unknown RPC address',
        url: nodeUrl,
        status: nodeStatus,
        chainId: nodeStatus.getChainId() || 'Unknown chain',
      };
    } catch (error) {
      this.logger.error(`Error getting connected node information: ${error}`);
      throw error;
    }
  }
}