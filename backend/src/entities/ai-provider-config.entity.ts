import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('ai_provider_config')
export class AIProviderConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  providerName: string; // 'gpt', 'custom', 'hybrid'

  @Column()
  isActive: boolean;

  @Column('jsonb')
  config: {
    apiKey?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    customSettings?: Record<string, any>;
  };

  @Column('jsonb', { nullable: true })
  performanceMetrics: {
    averageResponseTime?: number;
    successRate?: number;
    costPerRequest?: number;
    accuracy?: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
