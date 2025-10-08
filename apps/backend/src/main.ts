// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  // Startet die NestJS-App mit dem Root-Modul.
  const app = await NestFactory.create(AppModule);

  // CORS einschalten (für lokale UIs/Frontends bequem):
  // - origin: true   → erlaubt alle Origins (oder spiegelt Origin zurück)
  // - credentials: true → erlaubt Cookies/Authorization-Header
  app.enableCors({ origin: true, credentials: true });

  // ─────────────────────────────────────────────────────────────
  // Swagger / OpenAPI Konfiguration
  // ─────────────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('tpgis API') // Titel im Swagger-UI
    .setDescription('API Dokumentation für das tpgis Backend') // Untertitel
    .setVersion('1.0.0') // Version deiner API
    // .addBearerAuth(
    //   { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
    //   'jwt',
    // ) // Für spätere Auth (UI bekommt dann "Authorize"-Button)
    .build();

  // OpenAPI-Dokument erzeugen und UI unter /api-doku bereitstellen.
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-doku', app, document);
  // Später mit Auth
  // SwaggerModule.setup('api-doku', app, document, {
  //   swaggerOptions: { persistAuthorization: true },
  // });

  // ─────────────────────────────────────────────────────────────
  // Globale Validierungspipes (für DTOs aus Body/Query/Params)
  // ─────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Unbekannte Felder automatisch entfernen
      forbidNonWhitelisted: true, // …und falls vorhanden → 400-Fehler werfen
      transform: true, // Payloads in DTO-Klassen transformieren
      transformOptions: {
        enableImplicitConversion: false, // keine implizite Typkonvertierung
      },
    }),
  );

  // Server starten (PORT aus ENV oder 3000).
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
