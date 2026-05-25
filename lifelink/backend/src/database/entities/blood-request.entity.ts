import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';
export { Urgency, RequestStatus } from './enums';
import { BloodGroup, Urgency, RequestStatus } from './enums';

@Entity('blood_requests')
export class BloodRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  patient_name: string;

  @Index()
  @Column({ type: 'enum', enum: BloodGroup })
  blood_group: BloodGroup;

  @Column({ type: 'int', default: 1 })
  units_required: number;

  @Column({ length: 255 })
  hospital_name: string;

  @Column({ length: 20 })
  contact_number: string;

  @Column({ type: 'date', nullable: true })
  required_date: Date;

  @Index()
  @Column({ type: 'enum', enum: Urgency, default: Urgency.NORMAL })
  urgency: Urgency;

  @Index()
  @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.OPEN })
  status: RequestStatus;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Index()
  @Column({ length: 100, nullable: true })
  city: string;

  @ManyToOne(() => User, (user) => user.blood_requests, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  @Column({ nullable: true })
  requester_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
