import {
  Controller, Get, Post, Put, Param, Body, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { HospitalsService, CreateHospitalDto } from './hospitals.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { BloodGroup } from '../../database/entities/user.entity';
import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';

class VerifyHospitalDto {
  @IsOptional() @IsString() admin_notes?: string;
}

class UpdateHospitalInventoryDto {
  @ApiProperty({ enum: BloodGroup }) @IsEnum(BloodGroup) blood_group: BloodGroup;
  @ApiProperty() @IsInt() @Min(0) available_units: number;
}

@ApiTags('hospitals')
@Controller('hospitals')
export class HospitalsController {
  constructor(private readonly service: HospitalsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a hospital (admin only)' })
  create(@Body() dto: CreateHospitalDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List hospitals' })
  findAll(@Query('city') city?: string, @Query('verified') verified?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.findAll({ city, is_verified: verified === 'true' ? true : undefined, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hospital details' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Put(':id/verify')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify a hospital (admin only)' })
  verify(@Param('id', ParseUUIDPipe) id: string, @Body() dto: VerifyHospitalDto) {
    return this.service.verify(id, dto.admin_notes);
  }

  @Put(':id/inventory')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update hospital blood stock for a blood group (admin only)' })
  updateInventory(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateHospitalInventoryDto) {
    return this.service.updateInventory(id, dto.blood_group, dto.available_units);
  }
}
