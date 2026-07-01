import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHospitalsTable1700000004000 implements MigrationInterface {
  name = 'CreateHospitalsTable1700000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "hospitals" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(255) NOT NULL,
        "phone" VARCHAR(20),
        "email" VARCHAR(255),
        "city" VARCHAR(100),
        "state" VARCHAR(100),
        "latitude" DECIMAL(10,8),
        "longitude" DECIMAL(11,8),
        "license_number" VARCHAR(100),
        "is_verified" BOOLEAN NOT NULL DEFAULT FALSE,
        "admin_notes" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_hospitals_city" ON "hospitals"(LOWER("city"))`);
    await queryRunner.query(`CREATE INDEX "idx_hospitals_verified" ON "hospitals"("is_verified")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_hospitals_verified"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_hospitals_city"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hospitals"`);
  }
}
