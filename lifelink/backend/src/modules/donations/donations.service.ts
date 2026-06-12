import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation } from '../../database/entities/donation.entity';
import { Reward, RewardAction } from '../../database/entities/reward.entity';
import { BloodRequest, RequestStatus } from '../../database/entities/blood-request.entity';
import { IsDateString, IsOptional, IsInt, Min, Max, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogDonationDto {
  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  donated_on: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional() @IsInt() @Min(1) @Max(5)
  units?: number;

  @ApiProperty({ required: false })
  @IsOptional() @IsUUID()
  blood_request_id?: string;
}

@Injectable()
export class DonationsService {
  constructor(
    @InjectRepository(Donation) private donationsRepo: Repository<Donation>,
    @InjectRepository(Reward) private rewardsRepo: Repository<Reward>,
    @InjectRepository(BloodRequest) private requestsRepo: Repository<BloodRequest>,
  ) {}

  async logDonation(donorId: string, dto: LogDonationDto): Promise<Donation> {
    const donation = this.donationsRepo.create({
      donor_id: donorId,
      donated_on: new Date(dto.donated_on),
      units: dto.units || 1,
      blood_request_id: dto.blood_request_id,
    });
    const saved = await this.donationsRepo.save(donation);

    // Auto-fulfill the linked blood request
    if (dto.blood_request_id) {
      await this.requestsRepo.update(dto.blood_request_id, { status: RequestStatus.FULFILLED });
    }

    await this.rewardsRepo.save(this.rewardsRepo.create({
      user_id: donorId,
      points: 100,
      action: RewardAction.DONATION,
      description: `Donated ${saved.units} unit(s) of blood on ${dto.donated_on}`,
    }));

    return saved;
  }

  async getMyDonations(donorId: string): Promise<Donation[]> {
    return this.donationsRepo.find({
      where: { donor_id: donorId },
      order: { donated_on: 'DESC' },
    });
  }

  async findById(id: string): Promise<Donation> {
    const d = await this.donationsRepo.findOne({ where: { id } });
    if (!d) throw new NotFoundException('Donation not found');
    return d;
  }

  async getCertificateUrl(donationId: string, donorId: string): Promise<{ url: string }> {
    const donation = await this.findById(donationId);
    if (donation.donor_id !== donorId) throw new NotFoundException();
    if (donation.certificate_url) return { url: donation.certificate_url };
    // In production: generate PDF and upload to S3
    const mockUrl = `https://lifelink-certs.s3.ap-south-1.amazonaws.com/cert_${donationId}.pdf`;
    await this.donationsRepo.update(donationId, { certificate_url: mockUrl });
    return { url: mockUrl };
  }
}
