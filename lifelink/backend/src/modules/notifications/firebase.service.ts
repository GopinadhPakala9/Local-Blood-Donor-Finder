import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    if (!admin.apps.length) {
      const projectId = this.configService.get('firebase.projectId');
      const clientEmail = this.configService.get('firebase.clientEmail');
      const privateKey = this.configService.get('firebase.privateKey');

      if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        });
        this.logger.log('Firebase Admin initialized');
      } else {
        this.logger.warn('Firebase credentials not configured — push notifications disabled');
      }
    }
  }

  async sendToDevice(fcmToken: string, title: string, body: string, data?: Record<string, string>): Promise<void> {
    if (!admin.apps.length) return;
    try {
      await admin.messaging().send({
        token: fcmToken,
        notification: { title, body },
        data: data || {},
        android: { priority: 'high', notification: { sound: 'default', channelId: 'lifelink_alerts' } },
        apns: { payload: { aps: { sound: 'default', badge: 1 } } },
      });
    } catch (e) {
      this.logger.error(`FCM send failed for token ${fcmToken.substring(0, 20)}...`, e.message);
    }
  }

  async sendToMultiple(fcmTokens: string[], title: string, body: string, data?: Record<string, string>): Promise<void> {
    if (!admin.apps.length || !fcmTokens.length) return;
    const chunks: string[][] = [];
    for (let i = 0; i < fcmTokens.length; i += 500) {
      chunks.push(fcmTokens.slice(i, i + 500));
    }
    for (const chunk of chunks) {
      try {
        await admin.messaging().sendEachForMulticast({
          tokens: chunk,
          notification: { title, body },
          data: data || {},
          android: { priority: 'high' },
        });
      } catch (e) {
        this.logger.error('FCM multicast failed', e.message);
      }
    }
  }
}
