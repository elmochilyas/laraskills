# Skill: Configure Database Services in Laravel Dev

## Purpose
Set up MySQL, PostgreSQL, or SQLite database services in Docker-based Laravel development environments matching production engine and version.

## When To Use
- Setting up a Laravel development environment
- Configuring database engine selection and version
- Setting up testing database configuration

## When NOT To Use
- Local-only development with SQLite for everything
- When production DB is different from dev (causes SQL compatibility issues)

## Prerequisites
- Laravel Sail or Docker Compose with database service
- Database config (`config/database.php`)

## Inputs
- `docker-compose.yml` — database service definition
- `.env` — DB connection settings
- `config/database.php` — connection and driver configuration

## Workflow

1. **Select Database Engine:** Choose MySQL (default, most Laravel hosting) or PostgreSQL (advanced features). Add the corresponding service in `docker-compose.yml`.

2. **Match Production Version:** Use the same database engine and major version in development that runs in production. This prevents SQL compatibility issues from version differences.

3. **Configure Persistent Volume:** Use named volumes (`sail-mysql`) to preserve data across container restarts. This prevents data loss when rebuilding containers.

4. **Configure .env:** Set `DB_CONNECTION=mysql`, `DB_HOST=mysql` (service name), `DB_PORT=3306`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`.

5. **Run Migrations:** Execute `php artisan migrate` to create all tables. Always create schema through migrations, never manual SQL.

6. **Seed Data:** Run `php artisan db:seed` to populate the database with realistic development data for testing and development.

7. **Configure Test Database:** Use SQLite in-memory for unit tests (2-5x faster). Run integration tests against the production-matching database engine.

## Validation Checklist

- [ ] Database container running and accessible
- [ ] Migrations run without errors
- [ ] Seed data populates correctly
- [ ] DB credentials match between .env and docker-compose.yml
- [ ] Persistent volume preserves data across restarts
- [ ] SQLite configured for unit tests
- [ ] Integration tests run against production-matching engine

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Dev/prod DB mismatch | SQL compatibility issues in production |
| No persistent volume | Data lost on container restart |
| Migrations not run | Schema doesn't exist; artisan migrate first |
| Port conflicts | Container port 3306 already in use on host |

## Decision Points

- **Use SQLite in-memory for testing** — Faster than containerized DB for unit tests
- **Use MySQL/PostgreSQL in Docker for dev** — Matches production engine
- **Integration tests should run against production-matching DB** — Not just SQLite

## Performance/Security Considerations

- **SQLite for tests:** 2-5x faster than MySQL/PostgreSQL for unit tests
- **Named volumes:** Essential for data persistence; map to host directory for inspection
- **Port mapping:** Map container port to host for external tool access (TablePlus, Sequel Ace)

## Related Rules

- DB-RULE-001: Match production engine
- DB-RULE-002: Use persistent volumes
- DB-RULE-003: Migration-first development
- DB-RULE-004: Use seed data
- DB-RULE-005: SQLite for unit tests

## Related Skills

- Configure Cache and Queue Services
- Set Up Docker Compose for Laravel
- Configure Laravel Sail

## Success Criteria

- Database matches production engine and version
- Persistent data survives restarts
- Migrations and seeds work correctly
- Tests use appropriate database (SQLite for unit, production-matching for integration)
