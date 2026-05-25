import { Controller, Get, Put, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Admin dashboard stats' })
  getStats() {
    return this.service.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users (paginated)' })
  getUsers(@Query('page') page: number = 1, @Query('limit') limit: number = 20, @Query('role') role?: string) {
    return this.service.getUsers(page, limit, role);
  }

  @Put('users/:id/verify')
  @ApiOperation({ summary: 'Verify a user' })
  verifyUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.verifyUser(id);
  }

  @Put('users/:id/ban')
  @ApiOperation({ summary: 'Ban a user' })
  banUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.banUser(id);
  }

  @Get('hospitals')
  @ApiOperation({ summary: 'Get hospitals pending approval' })
  getPendingHospitals() {
    return this.service.getPendingHospitals();
  }

  @Put('hospitals/:id/verify')
  @ApiOperation({ summary: 'Verify a hospital' })
  verifyHospital(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.verifyHospital(id);
  }
}
