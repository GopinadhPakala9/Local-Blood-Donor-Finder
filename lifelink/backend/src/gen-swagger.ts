import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';

// Generates the OpenAPI (Swagger) spec WITHOUT booting the full app.
// preview: true loads modules + routes for the spec but never instantiates
// providers, so TypeORM never tries to connect to the database.
async function generate() {
  const app = await NestFactory.create(AppModule, {
    preview: true,
    logger: false,
  });

  const config = new DocumentBuilder()
    .setTitle('LifeLink API')
    .setDescription('LifeLink – Blood Donor Finder API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('donors', 'Donor management')
    .addTag('blood-requests', 'Blood request management')
    .addTag('hospitals', 'Hospital management')
    .addTag('blood-banks', 'Blood bank management')
    .addTag('donations', 'Donation tracking')
    .addTag('rewards', 'Rewards and gamification')
    .addTag('notifications', 'Push notifications')
    .addTag('admin', 'Admin panel')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const outPath = join(process.cwd(), 'swagger.json');
  writeFileSync(outPath, JSON.stringify(document, null, 2), 'utf8');

  const pathCount = Object.keys(document.paths || {}).length;
  console.log(`Wrote ${outPath}`);
  console.log(`Paths: ${pathCount}`);

  await app.close();
}

generate().catch((e) => {
  console.error('Swagger generation failed:', e);
  process.exit(1);
});
