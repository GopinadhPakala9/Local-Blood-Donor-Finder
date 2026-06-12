import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleLoginDto {
  @ApiProperty({ description: 'Google OAuth access token from client-side sign-in' })
  @IsString()
  accessToken: string;
}
