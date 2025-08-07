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
  Req,
  UnauthorizedException,
  UseGuards,
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
import { Request } from 'express';

// Simple JWT auth guard
class JwtAuthGuard {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: any): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    
    try {
      const publicKey = await this.authService.validateToken(token);
      request['publicKey'] = publicKey;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

@Controller('/api/control')
export class ControlController {
  private readonly logger = new Logger(ControlController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly nodeService: NodeService,
  ) {}

  /**
   * Generate a new authentication challenge
   * @returns The generated challenge
   */
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
  @UseGuards(new JwtAuthGuard(new AuthService(null, null, null)))
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
  @UseGuards(new JwtAuthGuard(new AuthService(null, null, null)))
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
  @UseGuards(new JwtAuthGuard(new AuthService(null, null, null)))
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
  @UseGuards(new JwtAuthGuard(new AuthService(null, null, null)))
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
  @UseGuards(new JwtAuthGuard(new AuthService(null, null, null)))
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
  @UseGuards(new JwtAuthGuard(new AuthService(null, null, null)))
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
  @UseGuards(new JwtAuthGuard(new AuthService(null, null, null)))
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
  @UseGuards(new JwtAuthGuard(new AuthService(null, null, null)))
  async removeNodeAsValidator(@Param('id') id: string): Promise<NodeDto> {
    this.logger.log(`Removing node with ID ${id} as validator`);
    return this.nodeService.removeAsValidator(id);
  }

  /**
   * Get all validator nodes
   * @returns All validator nodes
   */
  @Get('nodes/validators')
  @UseGuards(new JwtAuthGuard(new AuthService(null, null, null)))
  async getAllValidatorNodes(): Promise<NodeDto[]> {
    this.logger.log('Getting all validator nodes');
    return this.nodeService.findAllValidators();
  }
}