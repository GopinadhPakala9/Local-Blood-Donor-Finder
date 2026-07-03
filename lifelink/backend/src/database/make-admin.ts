import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { User, UserRole } from './entities/user.entity';

// One-time bootstrap: promote an existing account to system administrator.
// The account must already exist (register it in the app first via OTP/Google),
// because there is no admin yet to grant the role through the UI.
//
// Usage:
//   npm run make-admin -- <email-or-phone> [name]
// Examples:
//   npm run make-admin -- admin@lifelink.com Administrator
//   npm run make-admin -- +919876543210
async function run() {
  const identifier = process.argv[2];
  const name = process.argv[3] || 'Administrator';

  if (!identifier) {
    console.error('Usage: npm run make-admin -- <email-or-phone> [name]');
    process.exit(1);
  }

  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(User);

  const user = await repo.findOne({ where: [{ email: identifier }, { phone: identifier }] });
  if (!user) {
    console.error(`✗ No user found with email/phone "${identifier}".`);
    console.error('  Register that account in the app first (OTP or Google), then re-run.');
    await AppDataSource.destroy();
    process.exit(1);
  }

  user.role = UserRole.ADMIN;
  user.name = name;
  user.is_verified = true;
  await repo.save(user);

  console.log(`✓ "${identifier}" is now ADMIN (name: "${user.name}", id: ${user.id}).`);
  console.log('  → Log out and back in on the app so the new role takes effect.');

  await AppDataSource.destroy();
}

run().catch((e) => {
  console.error('make-admin failed:', e);
  process.exit(1);
});
