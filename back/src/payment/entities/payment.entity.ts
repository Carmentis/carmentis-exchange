import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

export class PaymentStatus {
    static PENDING = 'pending';
    static COMPLETED = 'completed';
    static FAILED = 'failed';
}

@Entity('payments')
export class PaymentEntity {
    @PrimaryColumn()
    id: string;

    @Column({ nullable: false })
    paymentId: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
    amount: number;

    @Column({ nullable: false })
    tokens: number;

    @Column({ nullable: false })
    walletPublicKey: string;

    @Column({
        default: PaymentStatus.PENDING,
    })
    status: string;

    @Column({ nullable: true })
    cardId: string;

    @Column({ nullable: true })
    redirectUrl: string;

    @Column({ type: 'json', nullable: true })
    metadata: Record<string, unknown>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
