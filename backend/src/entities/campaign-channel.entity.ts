import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Campaign } from './campaign.entity';

@Entity('campaign_channels')
export class CampaignChannel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  campaignId: string;

  @Column()
  channelType: 'email' | 'sms' | 'push' | 'whatsapp';

  @Column('jsonb')
  config: Record<string, any>;

  @Column({ default: 'pending' })
  status: 'pending' | 'sending' | 'sent' | 'failed';

  @Column({ default: 0 })
  sentCount: number;

  @Column({ default: 0 })
  deliveredCount: number;

  @Column({ default: 0 })
  openedCount: number;

  @Column({ default: 0 })
  clickedCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Campaign, campaign => campaign.channels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;
}
