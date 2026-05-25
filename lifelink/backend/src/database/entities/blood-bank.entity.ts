import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, OneToMany,
} from 'typeorm';
import { BloodBankInventory } from './blood-bank-inventory.entity';

@Entity('blood_banks')
export class BloodBank {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 100, nullable: true })
  state: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ default: false })
  is_verified: boolean;

  @OneToMany(() => BloodBankInventory, (inv) => inv.blood_bank, { cascade: true, eager: true })
  inventory: BloodBankInventory[];

  @CreateDateColumn()
  created_at: Date;
}
