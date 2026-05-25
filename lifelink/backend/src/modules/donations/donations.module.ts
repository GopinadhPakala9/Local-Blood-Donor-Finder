import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';
import { Donation } from '../../database/entities/donation.entity';
import { Reward } from '../../database/entities/reward.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Donation, Reward])],
  controllers: [DonationsController],
  providers: [DonationsService],
  exports: [DonationsService],
})
export class DonationsModule {}
