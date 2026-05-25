import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({
    example: '+919876543210 or user@example.com',
    description: 'Phone number (E.164) or email address',
  })
  @IsString()
  identifier: string;
}
