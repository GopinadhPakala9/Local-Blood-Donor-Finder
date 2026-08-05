import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Donation } from '../../database/entities/donation.entity';
import { Reward, RewardAction } from '../../database/entities/reward.entity';
import { BloodRequest, RequestStatus } from '../../database/entities/blood-request.entity';
import { User, UserRole } from '../../database/entities/user.entity';
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

  // Self-reported donation. Creates a PENDING record only — NO points and NO
  // request fulfilment until the request owner (or an admin) confirms it.
  async logDonation(donorId: string, dto: LogDonationDto): Promise<Donation> {
    // Guard: one credit per request (block duplicate pending/verified claims).
    if (dto.blood_request_id) {
      const existing = await this.donationsRepo.count({
        where: { donor_id: donorId, blood_request_id: dto.blood_request_id, status: In(['pending', 'verified']) },
      });
      if (existing > 0) {
        throw new BadRequestException('You have already logged a donation for this request.');
      }
    }

    // Guard: whole-blood donation is allowed once every 90 days.
    const recent = await this.donationsRepo
      .createQueryBuilder('d')
      .where('d.donor_id = :donorId', { donorId })
      .andWhere("d.status IN ('pending','verified')")
      .andWhere("d.donated_on > (CURRENT_DATE - INTERVAL '90 days')")
      .getCount();
    if (recent > 0) {
      throw new BadRequestException('You can donate whole blood only once every 90 days. A recent donation is already on record.');
    }

    const donation = this.donationsRepo.create({
      donor_id: donorId,
      donated_on: new Date(dto.donated_on),
      units: dto.units || 1,
      blood_request_id: dto.blood_request_id,
      status: 'pending',
    });
    return this.donationsRepo.save(donation);
  }

  // Only the linked request's owner or an admin may verify. Unlinked (general)
  // donations can only be verified by an admin.
  private assertCanVerify(donation: Donation, actor: User) {
    const isAdmin = actor.role === UserRole.ADMIN;
    const isOwner = !!donation.blood_request && donation.blood_request.requester_id === actor.id;
    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Only the request owner or an admin can verify this donation.');
    }
  }

  async confirmDonation(donationId: string, actor: User): Promise<Donation> {
    const donation = await this.donationsRepo.findOne({ where: { id: donationId }, relations: ['blood_request'] });
    if (!donation) throw new NotFoundException('Donation not found');
    if (donation.status !== 'pending') throw new BadRequestException(`Donation is already ${donation.status}.`);
    this.assertCanVerify(donation, actor);

    donation.status = 'verified';
    donation.verified = true;
    donation.verified_by = actor.id;
    donation.verified_at = new Date();
    const saved = await this.donationsRepo.save(donation);

    // Credit is granted ONLY here — this reward row feeds points/badges/leaderboard.
    await this.rewardsRepo.save(this.rewardsRepo.create({
      user_id: donation.donor_id,
      points: 100,
      action: RewardAction.DONATION,
      description: `Verified donation of ${donation.units} unit(s)`,
    }));

    // Fulfil the request now (feeds "Lives Saved").
    if (donation.blood_request_id) {
      await this.requestsRepo.update(donation.blood_request_id, { status: RequestStatus.FULFILLED });
    }
    return saved;
  }

  async rejectDonation(donationId: string, actor: User): Promise<Donation> {
    const donation = await this.donationsRepo.findOne({ where: { id: donationId }, relations: ['blood_request'] });
    if (!donation) throw new NotFoundException('Donation not found');
    if (donation.status !== 'pending') throw new BadRequestException(`Donation is already ${donation.status}.`);
    this.assertCanVerify(donation, actor);

    donation.status = 'rejected';
    donation.verified_by = actor.id;
    donation.verified_at = new Date();
    return this.donationsRepo.save(donation);
  }

  // Pending donations the actor is allowed to act on:
  // admins see all; everyone else sees only those linked to their own requests.
  async getPendingForActor(actor: User): Promise<any[]> {
    const qb = this.donationsRepo
      .createQueryBuilder('d')
      .leftJoin('d.donor', 'donor')
      .leftJoin('d.blood_request', 'req')
      .select([
        'd.id AS id', 'd.units AS units', 'd.donated_on AS donated_on', 'd.created_at AS created_at',
        'd.blood_request_id AS blood_request_id',
        'donor.name AS donor_name', 'donor.blood_group AS donor_blood_group', 'donor.phone AS donor_phone',
        'req.patient_name AS patient_name',
      ])
      .where("d.status = 'pending'");
    if (actor.role !== UserRole.ADMIN) {
      qb.andWhere('req.requester_id = :actorId', { actorId: actor.id });
    }
    return qb.orderBy('d.created_at', 'DESC').getRawMany();
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
