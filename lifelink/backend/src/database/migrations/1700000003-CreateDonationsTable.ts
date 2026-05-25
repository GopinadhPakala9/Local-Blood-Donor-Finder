import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDonationsTable1700000003 implements MigrationInterface {
  name = 'CreateDonationsTable1700000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "donations" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "donor_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "blood_request_id" UUID REFERENCES "blood_requests"("id") ON DELETE SET NULL,
        "donated_on" DATE NOT NULL,
        "units" INT NOT NULL DEFAULT 1,
        "verified" BOOLEAN NOT NULL DEFAULT FALSE,
        "certificate_url" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_donations_donor" ON "donations"("donor_id")`);
    await queryRunner.query(`CREATE INDEX "idx_donations_date" ON "donations"("donated_on")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_donations_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_donations_donor"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "donations"`);
  }
}
