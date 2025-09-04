import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
} from 'typeorm';

@Entity('auth_challenges')
export class AuthChallengeEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    challenge: string;

    @Column({ length: 255, nullable: true })
    publicKey: string;

    @Column({ default: false })
    verified: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ nullable: true })
    verifiedAt: Date;

    @Column({ default: 300 }) // 5 minutes expiration
    expiresInSeconds: number;

    isExpired(): boolean {
        const now = new Date();
        const expirationTime = new Date(this.createdAt);
        expirationTime.setSeconds(
            expirationTime.getSeconds() + this.expiresInSeconds,
        );
        return now > expirationTime;
    }
}
