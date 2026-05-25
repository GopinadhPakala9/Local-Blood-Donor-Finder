import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleLoginDto {
  @ApiProperty({ description: 'Firebase ID token from Google Sign-In' })
  @IsString()
  idToken: string;
}
