# 04-Standardized Knowledge: Database Services

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | development-environments |
| **Knowledge Unit** | database-services |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-sail, docker-compose-for-laravel, cache-queue-services |
| **Framework/Language** | MySQL, PostgreSQL, SQLite, MariaDB, Docker, Sail |

## Overview

Database services in Laravel dev environments provide data storage via Docker containers. Sail supports MySQL, PostgreSQL, MongoDB (third-party), and SQLite. Configured in `docker-compose.yml`, accessed via `config/database.php`. Key features: persistent storage volumes, multiple connections for testing, migration execution, seeding. SQLite (in-memory) default for testing; MySQL/PostgreSQL for development and production.

## Core Concepts

- **MySQL**: default in Sail; supports all Laravel features; configured via `DB_CONNECTION=mysql`
- **PostgreSQL**: alternative with JSONB, array columns, full-text search; `DB_CONNECTION=pgsql`
- **SQLite**: file-based; used for testing (in-memory); `DB_CONNECTION=sqlite`
- **Containerized Database**: Docker container with persistent volume; data survives restarts
- **Port Mapping**: internal port (3306/5432) mapped to host for external tool access
- **GUI Tools**: Adminer (in Sail), TablePlus, Sequel Ace connect via mapped ports

## When to Use

- All Laravel projects requiring persistent data storage
- Testing with database interactions
- Development parity with production database engine

## When NOT to Use

- Serverless projects (Vapor uses RDS/Aurora — still need local DB for dev)
- Simple testing that doesn't need a database (use SQLite in-memory)

## Best Practices (WHY)

- **Match production engine**: same DB engine and version in dev and prod prevents SQL compatibility issues
- **Use persistent volumes**: named volumes (`sail-mysql`) preserve data across container restarts
- **Migration-first development**: always create schema through migrations, not manual SQL
- **Use seed data**: `php artisan db:seed` for realistic dev data
- **SQLite for unit tests**: in-memory SQLite is 2-5x faster than MySQL/PostgreSQL tests
- **Dev/prod DB credentials**: use `.env` per environment; never commit production creds

## Architecture Guidelines

- Add `database-services` to docker-compose.yml services section
- Configure `config/database.php` with multiple connections for app + analytics/reporting
- Use `migrate:fresh --seed` to reset DB to known state during development
- Each developer their own database container (isolated data)

## Performance Considerations

- Docker DB: <1ms network latency (same host)
- SQLite in-memory: 2-5x faster tests than MySQL/PostgreSQL
- Named volumes: better performance than bind mounts for DB files
- macOS: Docker DB is 20-30% slower than native
- Memory: allocate 4GB+ Docker memory for DB containers

## Security Considerations

- Dev DB passwords are typically simple — never reuse in production
- Dev data should be anonymized/synthetic, not production PII
- No backups needed for dev DB (recreatable via migrations + seeders)

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| SQLite tests, MySQL production | Type/feature differences | Passing tests, prod failures | Integration tests against production-matching DB |
| Version mismatch dev/prod | Different SQL behavior | Unexpected prod issues | Match DB versions |
| No persistent volume | Data lost on restart | Losing dev data | Configure named volumes |
| Committing dev DB creds | Production tries localhost DB | Connection errors | Environment-specific .env |

## Anti-Patterns

- **Running migrations on production from local**: always verify environment before destructive commands
- **Sharing one dev database across the team**: each developer should have their own DB container

## Examples

```env
# .env for MySQL in Sail
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=sail
DB_PASSWORD=password
```

## Related Topics

- laravel-sail — Sail's database service integration
- docker-compose-for-laravel — Docker Compose database service
- environment-file-management — .env configuration

## AI Agent Notes

- Default Laravel uses MySQL; scaffold with PostgreSQL if production uses it
- Include SQLite in phpunit.xml for test speed

## Verification

- [ ] Database container running with persistent volume
- [ ] DB engine/version matches production
- [ ] Migrations run successfully
- [ ] Seeders populate dev data
- [ ] Testing uses appropriate DB (SQLite for unit, matching DB for integration)
- [ ] GUI tool can connect via mapped port
