import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DataSource } from './data-source.entity';

@Entity('data_events')
export class DataEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  dataSourceId: string;

  @Column()
  eventType: string;

  @Column('jsonb')
  eventData: Record<string, any>;

  @Column({ nullable: true })
  processedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => DataSource, dataSource => dataSource.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dataSourceId' })
  dataSource: DataSource;
}
