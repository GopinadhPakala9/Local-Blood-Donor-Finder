import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { BloodRequest } from './blood-request.entity';

@Entity('donations')
export class Donation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.donations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'donor_id' })
  donor: User;

  @Column()
  donor_id: string;

  @ManyToOne(() => BloodRequest, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'blood_request_id' })
  blood_request: BloodRequest;

  @Column({ nullable: true })
  blood_request_id: string;

  @Column({ type: 'date' })
  donated_on: Date;

  @Column({ type: 'int', default: 1 })
  units: number;

  @Column({ default: false })
  verified: boolean;

  @Column({ type: 'text', nullable: true })
  certificate_url: string;

  @CreateDateColumn()
  created_at: Date;
}
