import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from './data-source';
import { User, UserRole } from './entities/user.entity';

// Bootstrap a system administrator.
// - If the account (email/phone) exists, it is promoted to admin.
// - If it doesn't exist and an email is given, a new admin account is created.
// - If a password is provided, it is set (bcrypt) so you can log in via the
//   "Password" tab with email + password — no OTP required.
//
// Usage:
//   npm run make-admin -- <email-or-phone> [name] [password]
// Examples:
//   npm run make-admin -- admin@lifelink.com Administrator "SomeSecret123"
//   npm run make-admin -- +919876543210 Administrator
async function run() {
  const identifier = process.argv[2];
  const name = process.argv[3] || 'Administrator';
  const password = process.argv[4]; // optional — enables password login

  if (!identifier) {
    console.error('Usage: npm run make-admin -- <email-or-phone> [name] [password]');
    process.exit(1);
  }

  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(User);

  let user = await repo.findOne({ where: [{ email: identifier }, { phone: identifier }] });
  if (!user) {
    const isEmail = identifier.includes('@');
    user = repo.create({
      name,
      role: UserRole.ADMIN,
      is_verified: true,
      email: isEmail ? identifier : undefined,
      phone: isEmail ? `admin_${Date.now()}` : identifier,
    });
    console.log(`Creating new admin account for "${identifier}"…`);
  } else {
    user.role = UserRole.ADMIN;
    user.name = name;
    user.is_verified = true;
    console.log(`Promoting existing account "${identifier}" to admin…`);
  }

  if (password) user.password = await bcrypt.hash(password, 10);

  const saved = await repo.save(user);
  console.log(`✓ Admin ready — id: ${saved.id}, name: "${saved.name}", email: ${saved.email || '-'}, phone: ${saved.phone}`);
  console.log(password
    ? '  → Log in via the "Password" tab with your email + password.'
    : '  → No password set; use OTP/Google, or re-run with a password argument.');

  await AppDataSource.destroy();
}

run().catch((e) => {
  console.error('make-admin failed:', e);
  process.exit(1);
});
