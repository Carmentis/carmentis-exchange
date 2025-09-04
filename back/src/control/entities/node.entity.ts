import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('nodes')
export class NodeEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column({ length: 255 })
    publicKey: string;

    @Column({ length: 255 })
    endpoint: string;

    @Column({ default: false })
    isValidator: boolean;

    @Column({ default: 'pending' })
    status: 'pending' | 'active' | 'inactive';

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
