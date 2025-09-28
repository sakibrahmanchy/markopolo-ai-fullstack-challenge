import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsObject, IsNotEmpty } from 'class-validator';

export class CreateDataSourceDto {
  @ApiProperty({ 
    example: 'gtm',
    enum: ['gtm', 'facebook_pixel', 'shopify'],
    description: 'Type of data source to connect'
  })
  @IsEnum(['gtm', 'facebook_pixel', 'shopify'])
  sourceType: 'gtm' | 'facebook_pixel' | 'shopify';

  @ApiProperty({ 
    example: 'Main Website GTM',
    description: 'Friendly name for the data source'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    example: {
      containerId: 'GTM-XXXXXXX'
    },
    description: 'Configuration object specific to the data source type (optional for OAuth-based connections)',
    required: false
  })
  @IsObject()
  config?: Record<string, any>;
}
