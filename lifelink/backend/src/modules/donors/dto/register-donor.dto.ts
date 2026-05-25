import {
  IsString, IsEnum, IsNumber, IsOptional, IsDateString,
  Min, Max, IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BloodGroup, Gender } from '../../../database/entities/user.entity';

export class RegisterDonorDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ enum: BloodGroup, example: 'O+' })
  @IsEnum(BloodGroup)
  blood_group: BloodGroup;

  @ApiProperty({ enum: Gender, example: 'male' })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: '1990-01-15' })
  @IsDateString()
  dob: string;

  @ApiProperty({ example: 70, description: 'Weight in kg (min 45)' })
  @IsNumber()
  @Min(45, { message: 'Minimum weight for donation is 45 kg' })
  @Max(300)
  weight: number;

  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Maharashtra' })
  @IsString()
  state: string;

  @ApiProperty({ example: 19.076, required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ example: 72.8777, required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  is_available?: boolean;
}
