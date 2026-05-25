import {
  IsString, IsEnum, IsInt, IsOptional, IsDateString,
  IsNumber, Min, Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BloodGroup } from '../../../database/entities/user.entity';
import { Urgency } from '../../../database/entities/blood-request.entity';

export class CreateBloodRequestDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  patient_name: string;

  @ApiProperty({ enum: BloodGroup, example: 'O+' })
  @IsEnum(BloodGroup)
  blood_group: BloodGroup;

  @ApiProperty({ example: 2, description: 'Number of units required' })
  @IsInt()
  @Min(1)
  @Max(10)
  units_required: number;

  @ApiProperty({ example: 'Apollo Hospital' })
  @IsString()
  hospital_name: string;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  contact_number: string;

  @ApiProperty({ example: '2024-01-20', required: false })
  @IsOptional()
  @IsDateString()
  required_date?: string;

  @ApiProperty({ enum: Urgency, default: Urgency.NORMAL })
  @IsEnum(Urgency)
  urgency: Urgency;

  @ApiProperty({ example: 'Mumbai', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 19.076, required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ example: 72.8777, required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}
