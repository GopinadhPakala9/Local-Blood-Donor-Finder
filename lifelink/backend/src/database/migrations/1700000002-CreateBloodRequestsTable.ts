import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBloodRequestsTable1700000002 implements MigrationInterface {
  name = 'CreateBloodRequestsTable1700000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "blood_requests" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "patient_name" VARCHAR(255) NOT NULL,
        "blood_group" VARCHAR(5) NOT NULL,
        "units_required" INT NOT NULL DEFAULT 1,
        "hospital_name" VARCHAR(255) NOT NULL,
        "contact_number" VARCHAR(20) NOT NULL,
        "required_date" DATE,
        "urgency" VARCHAR(20) NOT NULL DEFAULT 'Normal',
        "status" VARCHAR(20) NOT NULL DEFAULT 'Open',
        "latitude" DECIMAL(10,8),
        "longitude" DECIMAL(11,8),
        "city" VARCHAR(100),
        "requester_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_requests_blood_group" ON "blood_requests"("blood_group")`);
    await queryRunner.query(`CREATE INDEX "idx_requests_status" ON "blood_requests"("status")`);
    await queryRunner.query(`CREATE INDEX "idx_requests_urgency" ON "blood_requests"("urgency")`);
    await queryRunner.query(`CREATE INDEX "idx_requests_location" ON "blood_requests"("latitude", "longitude")`);
    await queryRunner.query(`CREATE INDEX "idx_requests_city" ON "blood_requests"(LOWER("city"))`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_requests_city"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_requests_location"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_requests_urgency"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_requests_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_requests_blood_group"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blood_requests"`);
  }
}
