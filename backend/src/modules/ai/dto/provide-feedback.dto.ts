import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsObject, IsNumber } from 'class-validator';

export class ProvideFeedbackDto {
  @ApiProperty({ example: 'uuid' })
  @IsString()
  recommendationId: string;

  @ApiProperty({ example: 'positive', enum: ['positive', 'negative', 'neutral'] })
  @IsEnum(['positive', 'negative', 'neutral'])
  feedback: 'positive' | 'negative' | 'neutral';

  @ApiProperty({ 
    example: { openRate: 0.25, clickRate: 0.08, conversionRate: 0.03, revenue: 1500 },
    required: false 
  })
  @IsOptional()
  @IsObject()
  campaignResults?: {
    openRate?: number;
    clickRate?: number;
    conversionRate?: number;
    revenue?: number;
  };
}
