import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hospital } from '../../database/entities/hospital.entity';
import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHospitalDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() phone?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() email?: string;
  @ApiProperty() @IsString() city: string;
  @ApiProperty() @IsString() state: string;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() latitude?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() longitude?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() license_number?: string;
}

@Injectable()
export class HospitalsService {
  constructor(@InjectRepository(Hospital) private repo: Repository<Hospital>) {}

  create(dto: CreateHospitalDto): Promise<Hospital> {
    return this.repo.save(this.repo.create(dto));
  }

  async findAll(filters: { city?: string; is_verified?: boolean; page?: number; limit?: number }) {
    const { city, is_verified } = filters;
    const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
    const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 20;
    const qb = this.repo.createQueryBuilder('h');
    if (city) qb.andWhere('LOWER(h.city) = LOWER(:city)', { city });
    if (is_verified !== undefined) qb.andWhere('h.is_verified = :is_verified', { is_verified });
    qb.orderBy('h.name', 'ASC').skip((page - 1) * limit).take(limit);
    const [hospitals, total] = await qb.getManyAndCount();
    return { hospitals, total, page, limit };
  }

  async findById(id: string): Promise<Hospital> {
    const h = await this.repo.findOne({ where: { id } });
    if (!h) throw new NotFoundException('Hospital not found');
    return h;
  }

  async verify(id: string, adminNotes?: string): Promise<Hospital> {
    await this.repo.update(id, { is_verified: true, admin_notes: adminNotes });
    return this.findById(id);
  }
}
