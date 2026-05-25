import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany, Index,
} from 'typeorm';
import { Donation } from './donation.entity';
import { Reward } from './reward.entity';
import { Notification } from './notification.entity';
import { BloodRequest } from './blood-request.entity';
export { UserRole, BloodGroup, Gender } from './enums';
import { UserRole, BloodGroup, Gender } from './enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Index()
  @Column({ length: 20, unique: true })
  phone: string;

  @Column({ length: 255, unique: true, nullable: true })
  email: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.DONOR })
  role: UserRole;

  @Index()
  @Column({ type: 'enum', enum: BloodGroup, nullable: true })
  blood_group: BloodGroup;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender;

  @Column({ type: 'date', nullable: true })
  dob: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number;

  @Index()
  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 100, nullable: true })
  state: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ default: true })
  is_available: boolean;

  @Column({ default: false })
  is_verified: boolean;

  @Column({ length: 255, nullable: true, select: false })
  password: string;

  @Column({ type: 'text', nullable: true })
  fcm_token: string;

  @OneToMany(() => Donation, (donation) => donation.donor)
  donations: Donation[];

  @OneToMany(() => Reward, (reward) => reward.user)
  rewards: Reward[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => BloodRequest, (request) => request.requester)
  blood_requests: BloodRequest[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
