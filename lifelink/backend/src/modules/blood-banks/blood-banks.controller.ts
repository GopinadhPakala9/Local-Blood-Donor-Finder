import {
  Controller, Get, Post, Put, Param, Body, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BloodBanksService, CreateBloodBankDto } from './blood-banks.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BloodGroup } from '../../database/entities/user.entity';
import { IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class UpdateInventoryDto {
  @ApiProperty({ enum: BloodGroup }) @IsEnum(BloodGroup) blood_group: BloodGroup;
  @ApiProperty() @IsInt() @Min(0) available_units: number;
}

@ApiTags('blood-banks')
@Controller('blood-banks')
export class BloodBanksController {
  constructor(private readonly service: BloodBanksService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a blood bank' })
  create(@Body() dto: CreateBloodBankDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List blood banks with inventory' })
  findAll(@Query('city') city?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.findAll({ city, page, limit });
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby blood banks' })
  getNearby(
    @Query('latitude') lat: number,
    @Query('longitude') lng: number,
    @Query('radius') radius: number = 20,
  ) {
    return this.service.getNearby(lat, lng, radius);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get blood bank details with inventory' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Put(':id/inventory')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update blood unit stock for a blood group' })
  updateInventory(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateInventoryDto) {
    return this.service.updateInventory(id, dto.blood_group, dto.available_units);
  }
}
