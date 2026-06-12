import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../../database/entities/user.entity';
import { Hospital } from '../../database/entities/hospital.entity';
import { Donation } from '../../database/entities/donation.entity';
import { BloodRequest } from '../../database/entities/blood-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Hospital, Donation, BloodRequest])],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
