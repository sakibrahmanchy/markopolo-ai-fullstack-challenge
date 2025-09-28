import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({ description: 'Title of the conversation' })
  @IsString()
  @IsNotEmpty()
  title: string;
}
