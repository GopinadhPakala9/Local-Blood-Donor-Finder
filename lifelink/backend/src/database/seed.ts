import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { Hospital } from './entities/hospital.entity';
import { BloodBank } from './entities/blood-bank.entity';

// Blood groups in the order used by the `units` arrays below.
const GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const HOSPITALS = [
  { name: 'Apollo Hospitals',      phone: '+914023607777', email: 'info@apollohyd.com',    city: 'Hyderabad', state: 'Telangana',   latitude: 17.4239, longitude: 78.4738, license_number: 'TS-HOSP-1021', is_verified: true },
  { name: 'KIMS Hospitals',        phone: '+914044885000', email: 'care@kimshospitals.com', city: 'Hyderabad', state: 'Telangana',   latitude: 17.4401, longitude: 78.4983, license_number: 'TS-HOSP-1088', is_verified: true },
  { name: 'Manipal Hospital',      phone: '+918025023456', email: 'contact@manipal.com',    city: 'Bengaluru', state: 'Karnataka',   latitude: 12.9583, longitude: 77.6408, license_number: 'KA-HOSP-2044', is_verified: true },
  { name: 'Fortis Malar Hospital', phone: '+914442892222', email: 'info@fortismalar.com',   city: 'Chennai',   state: 'Tamil Nadu',  latitude: 13.0067, longitude: 80.2571, license_number: 'TN-HOSP-3012', is_verified: false },
  { name: 'Lilavati Hospital',     phone: '+912226751000', email: 'info@lilavati.com',      city: 'Mumbai',    state: 'Maharashtra', latitude: 19.0509, longitude: 72.8296, license_number: 'MH-HOSP-4090', is_verified: true },
];

const BANKS = [
  { name: 'Indian Red Cross Blood Bank', phone: '+914023456789', city: 'Hyderabad', state: 'Telangana',   latitude: 17.3850, longitude: 78.4867, is_verified: true,  units: [15, 4, 12, 3, 22, 6, 5, 2] },
  { name: 'Chiranjeevi Blood Bank',      phone: '+914023390999', city: 'Hyderabad', state: 'Telangana',   latitude: 17.4126, longitude: 78.4482, is_verified: true,  units: [8, 2, 10, 1, 14, 0, 3, 1] },
  { name: 'Rotary TTK Blood Bank',       phone: '+918025580000', city: 'Bengaluru', state: 'Karnataka',   latitude: 12.9716, longitude: 77.5946, is_verified: true,  units: [20, 5, 18, 4, 25, 7, 6, 2] },
  { name: 'Tata Memorial Blood Bank',    phone: '+912224177000', city: 'Mumbai',    state: 'Maharashtra', latitude: 19.0760, longitude: 72.8777, is_verified: false, units: [5, 0, 7, 2, 9, 1, 0, 0] },
];

async function run() {
  await AppDataSource.initialize();
  const hospRepo = AppDataSource.getRepository(Hospital);
  const bankRepo = AppDataSource.getRepository(BloodBank);

  const hCount = await hospRepo.count();
  if (hCount === 0) {
    await hospRepo.save(hospRepo.create(HOSPITALS));
    console.log(`✓ Seeded ${HOSPITALS.length} hospitals`);
  } else {
    console.log(`• Hospitals already present (${hCount}) — skipped`);
  }

  const bCount = await bankRepo.count();
  if (bCount === 0) {
    for (const { units, ...bank } of BANKS) {
      const entity = bankRepo.create({
        ...bank,
        inventory: GROUPS.map((g, i) => ({ blood_group: g, available_units: units[i] })),
      } as any);
      await bankRepo.save(entity); // cascade also inserts the 8 inventory rows
    }
    console.log(`✓ Seeded ${BANKS.length} blood banks (with inventory)`);
  } else {
    console.log(`• Blood banks already present (${bCount}) — skipped`);
  }

  await AppDataSource.destroy();
  console.log('Done.');
}

run().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
