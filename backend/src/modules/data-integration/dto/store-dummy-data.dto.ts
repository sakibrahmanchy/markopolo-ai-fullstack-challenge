import { IsString, IsObject, IsOptional, IsArray, IsNumber } from 'class-validator';

export class StoreDummyDataDto {
  @IsString()
  sourceType: 'gtm' | 'facebook_pixel' | 'shopify';

  @IsString()
  eventType: string;

  @IsObject()
  eventData: Record<string, any>;

  @IsOptional()
  @IsNumber()
  count?: number = 1;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  eventTypes?: string[];
}