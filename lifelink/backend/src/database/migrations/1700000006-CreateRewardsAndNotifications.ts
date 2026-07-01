import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRewardsAndNotifications1700000006000 implements MigrationInterface {
  name = 'CreateRewardsAndNotifications1700000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "rewards" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "points" INT NOT NULL DEFAULT 0,
        "action" VARCHAR(50) NOT NULL,
        "description" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_rewards_user" ON "rewards"("user_id")`);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "title" VARCHAR(255) NOT NULL,
        "body" TEXT NOT NULL,
        "data" JSONB,
        "is_read" BOOLEAN NOT NULL DEFAULT FALSE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_notifications_user" ON "notifications"("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_notifications_unread" ON "notifications"("user_id", "is_read") WHERE "is_read" = FALSE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rewards"`);
  }
}
