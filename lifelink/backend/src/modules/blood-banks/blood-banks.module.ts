import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BloodBanksController } from './blood-banks.controller';
import { BloodBanksService } from './blood-banks.service';
import { BloodBank } from '../../database/entities/blood-bank.entity';
import { BloodBankInventory } from '../../database/entities/blood-bank-inventory.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BloodBank, BloodBankInventory])],
  controllers: [BloodBanksController],
  providers: [BloodBanksService],
  exports: [BloodBanksService],
})
export class BloodBanksModule {}
