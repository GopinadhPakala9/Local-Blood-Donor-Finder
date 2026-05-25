import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RewardsService } from './rewards.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@ApiTags('rewards')
@Controller('rewards')
export class RewardsController {
  constructor(private readonly service: RewardsService) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my reward points, badge and history' })
  getMyRewards(@CurrentUser() user: User) {
    return this.service.getMyRewards(user.id);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get top donors leaderboard' })
  getLeaderboard() {
    return this.service.getLeaderboard();
  }
}
