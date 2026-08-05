import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HospitalsController } from './hospitals.controller';
import { HospitalsService } from './hospitals.service';
import { Hospital } from '../../database/entities/hospital.entity';
import { HospitalInventory } from '../../database/entities/hospital-inventory.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Hospital, HospitalInventory])],
  controllers: [HospitalsController],
  providers: [HospitalsService],
  exports: [HospitalsService],
})
export class HospitalsModule {}
