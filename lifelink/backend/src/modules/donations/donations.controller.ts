import { Controller, Get, Post, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DonationsService, LogDonationDto } from './donations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@ApiTags('donations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('donations')
export class DonationsController {
  constructor(private readonly service: DonationsService) {}

  @Post()
  @ApiOperation({ summary: 'Log a blood donation' })
  logDonation(@CurrentUser() user: User, @Body() dto: LogDonationDto) {
    return this.service.logDonation(user.id, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my donation history' })
  getMyDonations(@CurrentUser() user: User) {
    return this.service.getMyDonations(user.id);
  }

  @Get(':id/certificate')
  @ApiOperation({ summary: 'Get donation certificate PDF URL' })
  getCertificate(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.service.getCertificateUrl(id, user.id);
  }
}
