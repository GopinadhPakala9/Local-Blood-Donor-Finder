import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DonorsModule } from './modules/donors/donors.module';
import { BloodRequestsModule } from './modules/blood-requests/blood-requests.module';
import { HospitalsModule } from './modules/hospitals/hospitals.module';
import { BloodBanksModule } from './modules/blood-banks/blood-banks.module';
import { DonationsModule } from './modules/donations/donations.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { User } from './database/entities/user.entity';
import { BloodRequest } from './database/entities/blood-request.entity';
import { Donation } from './database/entities/donation.entity';
import { Hospital } from './database/entities/hospital.entity';
import { BloodBank } from './database/entities/blood-bank.entity';
import { BloodBankInventory } from './database/entities/blood-bank-inventory.entity';
import { Reward } from './database/entities/reward.entity';
import { Notification } from './database/entities/notification.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get<number>('database.port'),
        database: configService.get('database.name'),
        username: configService.get('database.user'),
        password: configService.get('database.password'),
        entities: [User, BloodRequest, Donation, Hospital, BloodBank, BloodBankInventory, Reward, Notification],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: configService.get('env') === 'development',
        logging: configService.get('env') === 'development',
        ssl: configService.get('database.ssl') ? { rejectUnauthorized: false } : false,
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    AuthModule,
    UsersModule,
    DonorsModule,
    BloodRequestsModule,
    HospitalsModule,
    BloodBanksModule,
    DonationsModule,
    RewardsModule,
    NotificationsModule,
    AdminModule,
    HealthModule,
  ],
})
export class AppModule {}
