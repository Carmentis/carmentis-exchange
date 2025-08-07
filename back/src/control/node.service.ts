import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NodeEntity } from './entities/node.entity';
import { CreateNodeDto, UpdateNodeDto } from './dto/node.dto';

@Injectable()
export class NodeService {
  private readonly logger = new Logger(NodeService.name);

  constructor(
    @InjectRepository(NodeEntity)
    private readonly nodeRepository: Repository<NodeEntity>,
  ) {}

  /**
   * Get all nodes
   * @returns All nodes
   */
  async findAll(): Promise<NodeEntity[]> {
    this.logger.log('Finding all nodes');
    return this.nodeRepository.find();
  }

  /**
   * Get a node by ID
   * @param id The node ID
   * @returns The node
   */
  async findOne(id: string): Promise<NodeEntity> {
    this.logger.log(`Finding node with ID: ${id}`);
    const node = await this.nodeRepository.findOne({ where: { id } });
    
    if (!node) {
      this.logger.error(`Node not found: ${id}`);
      throw new NotFoundException(`Node with ID ${id} not found`);
    }
    
    return node;
  }

  /**
   * Create a new node
   * @param createNodeDto The node data
   * @returns The created node
   */
  async create(createNodeDto: CreateNodeDto): Promise<NodeEntity> {
    this.logger.log(`Creating node: ${createNodeDto.name}`);
    const node = this.nodeRepository.create(createNodeDto);
    return this.nodeRepository.save(node);
  }

  /**
   * Update a node
   * @param id The node ID
   * @param updateNodeDto The node data
   * @returns The updated node
   */
  async update(id: string, updateNodeDto: UpdateNodeDto): Promise<NodeEntity> {
    this.logger.log(`Updating node with ID: ${id}`);
    const node = await this.findOne(id);
    
    // Update the node
    Object.assign(node, updateNodeDto);
    
    return this.nodeRepository.save(node);
  }

  /**
   * Delete a node
   * @param id The node ID
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Removing node with ID: ${id}`);
    const node = await this.findOne(id);
    
    await this.nodeRepository.remove(node);
  }

  /**
   * Set a node as a validator
   * @param id The node ID
   * @returns The updated node
   */
  async setAsValidator(id: string): Promise<NodeEntity> {
    this.logger.log(`Setting node with ID ${id} as validator`);
    const node = await this.findOne(id);
    
    node.isValidator = true;
    node.status = 'active';
    
    return this.nodeRepository.save(node);
  }

  /**
   * Remove a node as a validator
   * @param id The node ID
   * @returns The updated node
   */
  async removeAsValidator(id: string): Promise<NodeEntity> {
    this.logger.log(`Removing node with ID ${id} as validator`);
    const node = await this.findOne(id);
    
    node.isValidator = false;
    
    return this.nodeRepository.save(node);
  }

  /**
   * Get all validator nodes
   * @returns All validator nodes
   */
  async findAllValidators(): Promise<NodeEntity[]> {
    this.logger.log('Finding all validator nodes');
    return this.nodeRepository.find({ where: { isValidator: true } });
  }
}