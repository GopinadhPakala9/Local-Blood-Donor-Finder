import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1700000001000 implements MigrationInterface {
  name = 'CreateUsersTable1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(255) NOT NULL DEFAULT '',
        "phone" VARCHAR(20) NOT NULL UNIQUE,
        "email" VARCHAR(255) UNIQUE,
        "role" VARCHAR(50) NOT NULL DEFAULT 'donor',
        "blood_group" VARCHAR(5),
        "gender" VARCHAR(10),
        "dob" DATE,
        "weight" DECIMAL(5,2),
        "city" VARCHAR(100),
        "state" VARCHAR(100),
        "latitude" DECIMAL(10,8),
        "longitude" DECIMAL(11,8),
        "is_available" BOOLEAN NOT NULL DEFAULT TRUE,
        "is_verified" BOOLEAN NOT NULL DEFAULT FALSE,
        "fcm_token" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_users_blood_group" ON "users"("blood_group")`);
    await queryRunner.query(`CREATE INDEX "idx_users_location" ON "users"("latitude", "longitude")`);
    await queryRunner.query(`CREATE INDEX "idx_users_city" ON "users"(LOWER("city"))`);
    await queryRunner.query(`CREATE INDEX "idx_users_role" ON "users"("role")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_role"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_city"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_location"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_blood_group"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
