import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsObject } from 'class-validator';

export class TestConnectionDto {
  @ApiProperty({ 
    example: 'gtm',
    enum: ['gtm', 'facebook_pixel', 'shopify'],
    description: 'Type of data source to test'
  })
  @IsEnum(['gtm', 'facebook_pixel', 'shopify'])
  sourceType: 'gtm' | 'facebook_pixel' | 'shopify';

  @ApiProperty({ 
    example: {
      containerId: 'GTM-XXXXXXX',
      apiKey: 'your-api-key'
    },
    description: 'Configuration object to test'
  })
  @IsObject()
  config: Record<string, any>;
}
