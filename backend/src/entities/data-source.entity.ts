import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { DataEvent } from './data-event.entity';
import { OAuthSession } from './oauth-session.entity';

@Entity('data_sources')
export class DataSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  sourceType: 'gtm' | 'facebook_pixel' | 'shopify';

  @Column()
  name: string;

  @Column('jsonb', { nullable: true })
  config: Record<string, any>;

  @Column({ nullable: true })
  oauthSessionId: string;

  @Column({ default: 'active' })
  status: 'active' | 'inactive' | 'error' | 'needs_reauth';

  @Column({ nullable: true })
  lastSyncAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.dataSources, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => DataEvent, event => event.dataSource)
  events: DataEvent[];

  @ManyToOne(() => OAuthSession, { nullable: true })
  @JoinColumn({ name: 'oauthSessionId' })
  oauthSession: OAuthSession;
}
