import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';
import { User } from '../../database/entities/user.entity';
import { FirebaseService } from './firebase.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    private firebaseService: FirebaseService,
  ) {}

  async sendPushNotification(
    userId: string, title: string, body: string, data?: Record<string, string>,
  ): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id: userId }, select: ['id', 'fcm_token'] });
    if (user?.fcm_token) {
      await this.firebaseService.sendToDevice(user.fcm_token, title, body, data);
    }
    await this.saveNotification(userId, title, body, data);
  }

  async sendToNearbyDonors(
    bloodGroup: string, lat: number, lng: number, radiusKm: number,
    requestData: { requestId: string; hospitalName: string; urgency: string },
  ): Promise<void> {
    const donors = await this.usersRepo.query(
      `SELECT id, fcm_token FROM users
       WHERE role = 'donor' AND is_available = true AND fcm_token IS NOT NULL
         AND blood_group = $1
         AND (6371 * acos(
           cos(radians($2)) * cos(radians(latitude)) *
           cos(radians(longitude) - radians($3)) +
           sin(radians($2)) * sin(radians(latitude))
         )) <= $4
       LIMIT 200`,
      [bloodGroup, lat, lng, radiusKm],
    );

    if (!donors.length) return;

    const title = `${requestData.urgency}: ${bloodGroup} Blood Required`;
    const body = `${requestData.hospitalName} needs ${bloodGroup} blood urgently`;
    const tokens = donors.map((d: any) => d.fcm_token).filter(Boolean);

    await this.firebaseService.sendToMultiple(tokens, title, body, {
      type: 'blood_request',
      requestId: requestData.requestId,
      urgency: requestData.urgency,
    });

    await Promise.all(
      donors.map((d: any) => this.saveNotification(d.id, title, body, { requestId: requestData.requestId })),
    );
  }

  async saveNotification(
    userId: string, title: string, body: string, data?: Record<string, any>,
  ): Promise<Notification> {
    return this.notifRepo.save(this.notifRepo.create({ user_id: userId, title, body, data }));
  }

  async getByUser(userId: string, page = 1, limit = 20): Promise<{ notifications: Notification[]; total: number; unread: number }> {
    const [notifications, total] = await this.notifRepo.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const unread = await this.notifRepo.count({ where: { user_id: userId, is_read: false } });
    return { notifications, total, unread };
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.notifRepo.update({ id, user_id: userId }, { is_read: true });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notifRepo.update({ user_id: userId, is_read: false }, { is_read: true });
  }
}
