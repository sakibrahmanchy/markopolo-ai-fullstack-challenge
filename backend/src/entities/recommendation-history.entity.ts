import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Conversation } from './conversation.entity';

@Entity('recommendation_history')
export class RecommendationHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  conversationId: string;

  @Column('text')
  originalQuery: string;

  @Column('jsonb')
  aiRecommendation: Record<string, any>;

  @Column({ nullable: true })
  userAccepted: boolean;

  @Column('jsonb', { nullable: true })
  campaignResults: {
    openRate?: number;
    clickRate?: number;
    conversionRate?: number;
    revenue?: number;
  };

  @Column('jsonb', { nullable: true })
  userFeedback: {
    feedback: 'positive' | 'negative' | 'neutral';
    comment?: string;
    timestamp?: Date;
  };

  @Column({ nullable: true })
  aiProvider: string; // 'gpt', 'custom', 'hybrid'

  @Column('jsonb', { nullable: true })
  context: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Conversation, { nullable: true })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;
}
