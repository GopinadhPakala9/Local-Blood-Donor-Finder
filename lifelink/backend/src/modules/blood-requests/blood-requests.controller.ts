import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
  ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BloodRequestsService } from './blood-requests.service';
import { CreateBloodRequestDto } from './dto/create-blood-request.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BloodGroup } from '../../database/entities/user.entity';
import { Urgency, RequestStatus } from '../../database/entities/blood-request.entity';

class FilterRequestsDto {
  @ApiProperty({ enum: BloodGroup, required: false })
  @IsOptional() @IsEnum(BloodGroup)
  blood_group?: BloodGroup;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  city?: string;

  @ApiProperty({ enum: Urgency, required: false })
  @IsOptional() @IsEnum(Urgency)
  urgency?: Urgency;

  @ApiProperty({ enum: RequestStatus, required: false, default: 'Open' })
  @IsOptional() @IsEnum(RequestStatus)
  status?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number;
}

@ApiTags('blood-requests')
@Controller('blood-requests')
export class BloodRequestsController {
  constructor(private readonly service: BloodRequestsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an emergency blood request' })
  create(@CurrentUser() user: User, @Body() dto: CreateBloodRequestDto) {
    return this.service.create(user.id, dto);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user\'s blood requests' })
  findMine(@CurrentUser() user: User, @Query() filters: FilterRequestsDto) {
    return this.service.findAll({ ...filters, requester_id: user.id });
  }

  @Get()
  @ApiOperation({ summary: 'List blood requests with filters' })
  findAll(@Query() filters: FilterRequestsDto) {
    return this.service.findAll(filters);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby open blood requests' })
  @ApiQuery({ name: 'latitude', required: true, type: Number })
  @ApiQuery({ name: 'longitude', required: true, type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number })
  getNearby(
    @Query('latitude') lat: number,
    @Query('longitude') lng: number,
    @Query('radius') radius: number = 20,
  ) {
    return this.service.getNearby(lat, lng, radius);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get blood request details' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update blood request (owner or admin)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: Partial<CreateBloodRequestDto>,
  ) {
    return this.service.update(id, user.id, user.role, dto as any);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a blood request' })
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.service.cancel(id, user.id, user.role);
  }

  @Post(':id/fulfill')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark blood request as fulfilled (by requester)' })
  fulfill(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.service.fulfill(id, user.id, user.role);
  }
}
