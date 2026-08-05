import {
  Entity, PrimaryGeneratedColumn, Column,
  UpdateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { Hospital } from './hospital.entity';

@Entity('hospital_inventory')
@Unique(['hospital_id', 'blood_group'])
export class HospitalInventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Hospital, (hospital) => hospital.inventory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hospital_id' })
  hospital: Hospital;

  @Column()
  hospital_id: string;

  @Column({ type: 'varchar', length: 5 })
  blood_group: string;

  @Column({ type: 'int', default: 0 })
  available_units: number;

  @UpdateDateColumn()
  updated_at: Date;
}
