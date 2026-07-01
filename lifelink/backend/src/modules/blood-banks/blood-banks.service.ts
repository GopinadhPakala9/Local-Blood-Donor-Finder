import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BloodBank } from '../../database/entities/blood-bank.entity';
import { BloodBankInventory } from '../../database/entities/blood-bank-inventory.entity';
import { BloodGroup } from '../../database/entities/user.entity';
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBloodBankDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() phone?: string;
  @ApiProperty() @IsString() city: string;
  @ApiProperty() @IsString() state: string;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() latitude?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() longitude?: number;
}

@Injectable()
export class BloodBanksService {
  constructor(
    @InjectRepository(BloodBank) private banksRepo: Repository<BloodBank>,
    @InjectRepository(BloodBankInventory) private inventoryRepo: Repository<BloodBankInventory>,
  ) {}

  async create(dto: CreateBloodBankDto): Promise<BloodBank> {
    const bank = this.banksRepo.create(dto);
    const saved = await this.banksRepo.save(bank);
    const bloodGroups = Object.values(BloodGroup);
    const inventory = bloodGroups.map((bg) =>
      this.inventoryRepo.create({ blood_bank_id: saved.id, blood_group: bg, available_units: 0 }),
    );
    await this.inventoryRepo.save(inventory);
    return this.findById(saved.id);
  }

  async findAll(filters: { city?: string; page?: number; limit?: number }) {
    const { city } = filters;
    const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
    const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 20;
    const qb = this.banksRepo.createQueryBuilder('b')
      .leftJoinAndSelect('b.inventory', 'inv');
    if (city) qb.andWhere('LOWER(b.city) = LOWER(:city)', { city });
    qb.orderBy('b.name', 'ASC').skip((page - 1) * limit).take(limit);
    const [banks, total] = await qb.getManyAndCount();
    return { banks, total, page, limit };
  }

  async findById(id: string): Promise<BloodBank> {
    const bank = await this.banksRepo.findOne({
      where: { id },
      relations: ['inventory'],
    });
    if (!bank) throw new NotFoundException('Blood bank not found');
    return bank;
  }

  async updateInventory(bankId: string, bloodGroup: BloodGroup, units: number): Promise<BloodBankInventory> {
    let inv = await this.inventoryRepo.findOne({
      where: { blood_bank_id: bankId, blood_group: bloodGroup },
    });
    if (!inv) {
      inv = this.inventoryRepo.create({ blood_bank_id: bankId, blood_group: bloodGroup, available_units: units });
    } else {
      inv.available_units = units;
    }
    return this.inventoryRepo.save(inv);
  }

  async getNearby(lat: number, lng: number, radiusKm: number = 20): Promise<any[]> {
    return this.banksRepo.query(
      `SELECT b.*,
        ROUND((6371 * acos(
          cos(radians($1)) * cos(radians(b.latitude)) *
          cos(radians(b.longitude) - radians($2)) +
          sin(radians($1)) * sin(radians(b.latitude))
        ))::numeric, 1) as distance_km
       FROM blood_banks b
       WHERE b.latitude IS NOT NULL
         AND (6371 * acos(
           cos(radians($1)) * cos(radians(b.latitude)) *
           cos(radians(b.longitude) - radians($2)) +
           sin(radians($1)) * sin(radians(b.latitude))
         )) <= $3
       ORDER BY distance_km ASC
       LIMIT 20`,
      [lat, lng, radiusKm],
    );
  }
}
