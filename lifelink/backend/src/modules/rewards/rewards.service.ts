import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from '../../database/entities/reward.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(Reward) private rewardsRepo: Repository<Reward>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  getBadge(totalPoints: number): string {
    if (totalPoints >= 2000) return 'Hero';
    if (totalPoints >= 1000) return 'Gold';
    if (totalPoints >= 500) return 'Silver';
    if (totalPoints >= 100) return 'Bronze';
    return 'New';
  }

  async getMyRewards(userId: string): Promise<{
    totalPoints: number; badge: string; history: Reward[]; donations: number;
  }> {
    const history = await this.rewardsRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
    const totalPoints = history.reduce((sum, r) => sum + r.points, 0);
    const donations = history.filter((r) => r.action === 'donation').length;
    return { totalPoints, badge: this.getBadge(totalPoints), history, donations };
  }

  async getLeaderboard(): Promise<any[]> {
    return this.rewardsRepo.query(
      `SELECT u.id, u.name, u.blood_group, u.city,
         SUM(r.points) as total_points,
         COUNT(CASE WHEN r.action = 'donation' THEN 1 END) as total_donations
       FROM rewards r
       JOIN users u ON u.id = r.user_id
       GROUP BY u.id, u.name, u.blood_group, u.city
       ORDER BY total_points DESC
       LIMIT 50`,
    );
  }

  async addPoints(userId: string, points: number, action: string, description?: string): Promise<Reward> {
    const reward = this.rewardsRepo.create({
      user_id: userId, points, action: action as any, description,
    });
    return this.rewardsRepo.save(reward);
  }
}
