import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDonationStatus1700000007000 implements MigrationInterface {
  name = 'AddDonationStatus1700000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "status" varchar(20) NOT NULL DEFAULT 'pending'`);
    await queryRunner.query(`ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "verified_by" uuid`);
    await queryRunner.query(`ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "verified_at" TIMESTAMPTZ`);
    // Grandfather donations created under the old auto-credit flow as verified.
    await queryRunner.query(`UPDATE "donations" SET "status" = 'verified' WHERE "verified" = true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "donations" DROP COLUMN IF EXISTS "verified_at"`);
    await queryRunner.query(`ALTER TABLE "donations" DROP COLUMN IF EXISTS "verified_by"`);
    await queryRunner.query(`ALTER TABLE "donations" DROP COLUMN IF EXISTS "status"`);
  }
}
