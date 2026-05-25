import {
  Controller, Get, Put, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsEnum, IsNumber, IsBoolean, Min, Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, BloodGroup, Gender } from '../../database/entities/user.entity';

class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  email?: string;

  @ApiProperty({ required: false, enum: BloodGroup })
  @IsOptional() @IsEnum(BloodGroup)
  blood_group?: BloodGroup;

  @ApiProperty({ required: false, enum: Gender })
  @IsOptional() @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({ required: false })
  @IsOptional() @IsNumber() @Min(18) @Max(200)
  weight?: number;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  state?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsNumber()
  latitude?: number;

  @ApiProperty({ required: false })
  @IsOptional() @IsNumber()
  longitude?: number;
}

class UpdateFcmTokenDto {
  @ApiProperty()
  @IsString()
  fcmToken: string;
}

class UpdateAvailabilityDto {
  @ApiProperty()
  @IsBoolean()
  isAvailable: boolean;
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@CurrentUser() user: User) {
    return user;
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.usersService.update(user.id, dto);
  }

  @Put('me/fcm-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update FCM push notification token' })
  async updateFcmToken(@CurrentUser() user: User, @Body() dto: UpdateFcmTokenDto) {
    await this.usersService.updateFcmToken(user.id, dto.fcmToken);
    return { message: 'FCM token updated' };
  }

  @Put('me/availability')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle donor availability' })
  updateAvailability(@CurrentUser() user: User, @Body() dto: UpdateAvailabilityDto) {
    return this.usersService.updateAvailability(user.id, dto.isAvailable);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get donation statistics for current user' })
  getStats(@CurrentUser() user: User) {
    return this.usersService.getUserStats(user.id);
  }
}
