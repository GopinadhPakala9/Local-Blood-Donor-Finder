import {
  Entity, PrimaryGeneratedColumn, Column,
  UpdateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { BloodBank } from './blood-bank.entity';
import { BloodGroup } from './enums';

@Entity('blood_bank_inventory')
@Unique(['blood_bank_id', 'blood_group'])
export class BloodBankInventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => BloodBank, (bank) => bank.inventory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blood_bank_id' })
  blood_bank: BloodBank;

  @Column()
  blood_bank_id: string;

  @Column({ type: 'enum', enum: BloodGroup })
  blood_group: BloodGroup;

  @Column({ type: 'int', default: 0 })
  available_units: number;

  @UpdateDateColumn()
  updated_at: Date;
}
