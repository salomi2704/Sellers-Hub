import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateWebhookEndpointStatusDto {
  @ApiProperty()
  @IsBoolean()
  isActive!: boolean;
}
