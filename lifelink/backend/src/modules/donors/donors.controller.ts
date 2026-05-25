import {
  Controller, Get, Post, Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DonorsService } from './donors.service';
import { RegisterDonorDto } from './dto/register-donor.dto';
import { SearchDonorDto } from './dto/search-donor.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@ApiTags('donors')
@Controller('donors')
export class DonorsController {
  constructor(private readonly donorsService: DonorsService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register current user as a blood donor' })
  register(@CurrentUser() user: User, @Body() dto: RegisterDonorDto) {
    return this.donorsService.register(user.id, dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search donors by blood group, distance, city' })
  search(@Query() query: SearchDonorDto) {
    return this.donorsService.search(query);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby available donors' })
  @ApiQuery({ name: 'latitude', required: true, type: Number })
  @ApiQuery({ name: 'longitude', required: true, type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number })
  getNearby(
    @Query('latitude') lat: number,
    @Query('longitude') lng: number,
    @Query('radius') radius: number = 10,
  ) {
    return this.donorsService.getNearby(lat, lng, radius);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get donor profile by ID (hides exact location)' })
  @ApiQuery({ name: 'latitude', required: false, type: Number })
  @ApiQuery({ name: 'longitude', required: false, type: Number })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('latitude') lat?: number,
    @Query('longitude') lng?: number,
  ) {
    return this.donorsService.findById(id, lat, lng);
  }
}
