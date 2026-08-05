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

  // Verification workflow: a self-reported donation starts 'pending' and only
  // earns credit (points, fulfilled request, Lives Saved) once the request
  // owner or an admin confirms it. 'rejected' = disputed / did not happen.
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'verified' | 'rejected';

  @Column({ type: 'uuid', nullable: true })
  verified_by: string;

  @Column({ type: 'timestamptz', nullable: true })
  verified_at: Date;

  @Column({ type: 'text', nullable: true })
  certificate_url: string;

  @CreateDateColumn()
  created_at: Date;
}
