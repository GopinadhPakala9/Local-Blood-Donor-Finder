import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHospitalInventory1700000008000 implements MigrationInterface {
  name = 'AddHospitalInventory1700000008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "hospital_inventory" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "hospital_id" UUID NOT NULL REFERENCES "hospitals"("id") ON DELETE CASCADE,
        "blood_group" VARCHAR(5) NOT NULL,
        "available_units" INT NOT NULL DEFAULT 0,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE ("hospital_id", "blood_group")
      )
    `);
    // Seed a zero-stock row for every blood group of every existing hospital.
    await queryRunner.query(`
      INSERT INTO "hospital_inventory" ("hospital_id", "blood_group", "available_units")
      SELECT h.id, g.bg, 0
      FROM "hospitals" h
      CROSS JOIN (VALUES ('A+'),('A-'),('B+'),('B-'),('O+'),('O-'),('AB+'),('AB-')) AS g(bg)
      ON CONFLICT ("hospital_id", "blood_group") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "hospital_inventory"`);
  }
}
