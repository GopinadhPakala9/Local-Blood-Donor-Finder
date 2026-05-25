import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}

  async findById(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { phone } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.usersRepo.create(data);
    return this.usersRepo.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.usersRepo.update(id, data);
    return this.findById(id);
  }

  async updateFcmToken(id: string, fcmToken: string): Promise<void> {
    await this.usersRepo.update(id, { fcm_token: fcmToken });
  }

  async updateAvailability(id: string, isAvailable: boolean): Promise<User> {
    await this.usersRepo.update(id, { is_available: isAvailable });
    return this.findById(id);
  }

  async getUserStats(id: string): Promise<{ totalDonations: number; lastDonation: Date | null }> {
    const result = await this.usersRepo.query(
      `SELECT COUNT(d.id) as total, MAX(d.donated_on) as last
       FROM donations d WHERE d.donor_id = $1`,
      [id],
    );
    return {
      totalDonations: parseInt(result[0]?.total || '0'),
      lastDonation: result[0]?.last || null,
    };
  }
}
