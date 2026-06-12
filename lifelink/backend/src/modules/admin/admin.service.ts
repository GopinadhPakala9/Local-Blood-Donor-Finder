import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Hospital } from '../../database/entities/hospital.entity';
import { Donation } from '../../database/entities/donation.entity';
import { BloodRequest } from '../../database/entities/blood-request.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Hospital) private hospitalsRepo: Repository<Hospital>,
    @InjectRepository(Donation) private donationsRepo: Repository<Donation>,
    @InjectRepository(BloodRequest) private requestsRepo: Repository<BloodRequest>,
  ) {}

  async getUsers(page = 1, limit = 20, role?: string) {
    const qb = this.usersRepo.createQueryBuilder('u');
    if (role) qb.andWhere('u.role = :role', { role });
    qb.orderBy('u.created_at', 'DESC').skip((page - 1) * limit).take(limit);
    const [users, total] = await qb.getManyAndCount();
    return { users, total, page, limit };
  }

  async verifyUser(id: string): Promise<User> {
    await this.usersRepo.update(id, { is_verified: true });
    return this.usersRepo.findOne({ where: { id } });
  }

  async banUser(id: string): Promise<User> {
    await this.usersRepo.update(id, { is_available: false });
    return this.usersRepo.findOne({ where: { id } });
  }

  async getPendingHospitals() {
    return this.hospitalsRepo.find({ where: { is_verified: false }, order: { created_at: 'DESC' } });
  }

  async verifyHospital(id: string): Promise<Hospital> {
    await this.hospitalsRepo.update(id, { is_verified: true });
    return this.hospitalsRepo.findOne({ where: { id } });
  }

  async getDashboardStats() {
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1); firstOfMonth.setHours(0, 0, 0, 0);

    const [activeDonors, openRequests, totalHospitals, livesSavedThisMonth] = await Promise.all([
      this.usersRepo.count({ where: { role: 'donor' as any, is_available: true } }),
      this.requestsRepo.count({ where: { status: 'Open' as any } }),
      this.hospitalsRepo.count(),
      this.requestsRepo.count({ where: { status: 'Fulfilled' as any } }),
    ]);

    return { activeDonors, openRequests, totalHospitals, livesSavedThisMonth };
  }
}
