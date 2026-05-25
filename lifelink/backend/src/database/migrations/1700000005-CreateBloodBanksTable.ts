import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBloodBanksTable1700000005 implements MigrationInterface {
  name = 'CreateBloodBanksTable1700000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "blood_banks" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(255) NOT NULL,
        "phone" VARCHAR(20),
        "city" VARCHAR(100),
        "state" VARCHAR(100),
        "latitude" DECIMAL(10,8),
        "longitude" DECIMAL(11,8),
        "is_verified" BOOLEAN NOT NULL DEFAULT FALSE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "blood_bank_inventory" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "blood_bank_id" UUID NOT NULL REFERENCES "blood_banks"("id") ON DELETE CASCADE,
        "blood_group" VARCHAR(5) NOT NULL,
        "available_units" INT NOT NULL DEFAULT 0,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE("blood_bank_id", "blood_group")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_blood_banks_city" ON "blood_banks"(LOWER("city"))`);
    await queryRunner.query(`CREATE INDEX "idx_blood_banks_location" ON "blood_banks"("latitude", "longitude")`);
    await queryRunner.query(`CREATE INDEX "idx_inventory_bank" ON "blood_bank_inventory"("blood_bank_id")`);
    await queryRunner.query(`CREATE INDEX "idx_inventory_blood_group" ON "blood_bank_inventory"("blood_group")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "blood_bank_inventory"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blood_banks"`);
  }
}
