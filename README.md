# TP-GIS – README

## TechStack

- **Frontend:** React + TypeScript + Vite
- **Backend:** NestJS + TypeORM (OpenAPI/Swagger)
- **Datenbank:** PostgreSQL 14+ mit **PostGIS**, **pg_trgm**, **unaccent**
- **Dev/Runtime:** Docker & Docker Compose
- **Doku:** Statische Code-Dokumentation (HTML), Swagger-UI

---

## Mein Hinweis

> **GANZ WICHTIG:**  
> Ich habe versucht, **PostgreSQL mit PostGIS lokal (ohne Docker)** zu installieren, um einen reibungslosen Handover zu ermöglichen.  
> **Das ist mir wiederholt NICHT gelungen.**  
> **Alle Environment-Variablen sind in `docker-compose.yml` hinterlegt.**

---

## Mein Start

1. **Services starten**

```bash
# in der Projektwurzel (tpgis)
tpgis$ docker compose up db backend
tpgis$ docker compose up frontend
```

2. **Backend Abhängigkeiten und Migration**

```bash
tpgis/apps/backend$ npm i
tpgis/apps/backend$ npm run typeorm:run
```

3. **NRW Gebaeudereferenz importieren (gebaeude.sql)**

```bash
# Datei in den DB-Container kopieren (Name des Containers: db)
tpgis$ docker cp path/to/gebaeude.sql db:/tmp/gebaeude.sql

# in den Container und importieren
tpgis$ docker exec -it db bash
root@db# psql -U app -d tpgis_healthcare < /tmp/gebaeude.sql

# Materialized View aktualisieren
root@db# psql -U app -d tpgis_healthcare -c "REFRESH MATERIALIZED VIEW tp_gis.gebref_norm;"
```

## Applikationen laufen auf

Frontend: http://localhost:5173
Backend: http://localhost:3000
DB: localhost:5432

## Doku

# Backend-Doku

```bash
tpgis/$ open doku/backend/index.html
```

# Frontend-Doku

```bash
tpgis/$ open doku/frontend/index.html
```

# Swagger Open API

http://localhost:3000/api-doku
