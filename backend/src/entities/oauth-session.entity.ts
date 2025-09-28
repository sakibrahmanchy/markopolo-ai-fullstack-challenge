import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('oauth_sessions')
export class OAuthSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  source: 'gtm' | 'facebook_pixel' | 'shopify';

  @Column()
  accessToken: string;

  @Column({ nullable: true })
  refreshToken: string;

  @Column({ nullable: true })
  tokenExpiresAt: Date;

  @Column({ nullable: true })
  accountId: string; // User's account ID from OAuth provider

  @Column({ nullable: true })
  accountName: string; // User's account name from OAuth provider

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column({ default: 'active' })
  status: 'active' | 'expired' | 'revoked';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
