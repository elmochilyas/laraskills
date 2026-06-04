# Knowledge Unit: Database Services

## Metadata
- **Subdomain:** Development Environments
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** development-environments/database-services
- **Maturity:** Mature
- **Related Technologies:** MySQL, PostgreSQL, SQLite, MongoDB, Laravel, Docker, Sail

## Executive Summary

Database services in Laravel development environments provide the data storage backend for application development and testing. Sail supports MySQL, PostgreSQL, MongoDB (via 3rd-party services), and SQLite as database options, each running as a Docker container (except SQLite, which uses the filesystem). The database service is configured in docker-compose.yml and accessed via Laravel's database configuration (config/database.php). Key features include: persistent storage volumes (data survives container restarts), multiple database connections for testing (using SQLite or separate databases), database management tools (Adminer, TablePlus, Sequel Ace), migration execution (php artisan migrate), and seeding. SQLite is the default for testing (in-memory, fast) while MySQL/PostgreSQL are used for development and production.

## Core Concepts

- **MySQL:** The most common Laravel database; default in Sail; supports all Laravel features (migrations, queries, Eloquent); configured via DB_CONNECTION=mysql
- **PostgreSQL:** Alternative database with advanced features (JSONB, array columns, full-text search); configured via DB_CONNECTION=pgsql
- **SQLite:** File-based database used for testing (in-memory) and small applications; configured via DB_CONNECTION=sqlite with database path
- **MongoDB:** NoSQL database for document storage; requires third-party Laravel MongoDB package; configured as a separate connection in config/database.php
- **Containerized Database:** The database runs in a Docker container with persistent storage volume; data survives container restarts but not volume removal
- **Database Port Mapping:** The container's internal port (3306 for MySQL, 5432 for PostgreSQL) is mapped to a host port (same by default) for external tool access
- **Database Management Tools:** GUI tools (Adminer in Sail, TablePlus, Sequel Ace, Navicat) connect to the database via mapped ports

## Mental Models

- **Database as Stateful Service:** Unlike application code (stateless), the database holds persistent state data. Container restarts preserve data (via volumes); container removal destroys it.
- **Database as Separate Container:** The database runs in its own Docker container, just like a separate server in production. This mirrors production architecture locally.
- **SQLite Testing as Fast Isolation:** SQLite in-memory database for testing provides complete isolation (fresh database per test) and fast execution (no network, no disk I/O)

## Internal Mechanics

1. **Database Container Startup:** Sail's docker-compose.yml defines a mysql or pgsql service with specified image version (mysql:8.0, postgres:15), environment variables (MYSQL_ROOT_PASSWORD, MYSQL_DATABASE, MYSQL_USER), persistent volume mount, and health check
2. **Connection Configuration:** Laravel reads DB_CONNECTION, DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD from .env; these map to the Sail service configuration
3. **Migration Execution:** php artisan migrate reads config/database.php, connects to the database container via TCP (not Unix socket), and executes migration SQL
4. **Persistent Volume:** Docker volumes (sail-mysql or sail-pgsql) store database files on the host filesystem; container restarts preserve data; docker compose down -v destroys data
5. **Port Forwarding:** The database port (3306 for MySQL) is exposed on localhost, allowing GUI tools, CLI clients, and IDE database tools to connect directly
6. **Testing Database:** phpunit.xml sets DB_CONNECTION=sqlite and DB_DATABASE=:memory: for in-memory test database; or sets a separate MySQL/PostgreSQL database for integration tests

## Patterns

- **Environment-Specific Database Pattern:** Use MySQL/PostgreSQL for development (persistent data), SQLite for testing (fast, isolated), MySQL/PostgreSQL for production (reliable, scalable)
- **Multiple Database Pattern:** Define multiple connections in config/database.php for different databases within the same application: mysql for main app, mysql_analytics for reporting data
- **Database Per Developer Pattern:** Each developer runs their own database container (part of Sail) with isolated data. No shared development database needed.
- **Migration-First Development Pattern:** Always create database schema through migrations. The development database is rebuilt via migrate:fresh when schema changes are significant.
- **Seed Data Pattern:** Use database seeders to populate development databases with realistic test data. Run php artisan db:seed after migrations to populate the development environment.
- **Snapshot/Reset Pattern:** Use migrate:fresh --seed to reset the database to a known state during development, clearing and repopulating all data.
- **Adminer in Sail Pattern:** Sail includes Adminer service for web-based database management; access at http://localhost:8080 (or configured port) with database server = mysql/pgsql container name

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Database engine | MySQL vs PostgreSQL vs SQLite vs MongoDB | MySQL (default, widest Laravel support); PostgreSQL for advanced features |
| MySQL version | 8.0 vs 5.7 vs 8.4+ | 8.0 (Sail default); 8.4+ for latest features |
| Persistent storage | Named volume vs bind mount vs tmpfs | Named volume (simplest, managed by Docker) |
| Exposed port | Default (3306) vs custom | Default for simplicity; custom for multiple projects |
| Testing database | SQLite in-memory vs dedicated test DB | SQLite in-memory for unit tests; dedicated MySQL/PostgreSQL for integration tests |

## Tradeoffs

- **MySQL vs PostgreSQL:** MySQL has broader Laravel ecosystem support (packages, tutorials, hosting). PostgreSQL offers advanced features (JSONB, full-text search, array types, GIS). Choose based on hosting provider support and feature requirements.
- **SQLite Testing vs Dedicated Test Database:** SQLite is faster for testing (no network, no persistence) but doesn't catch MySQL/PostgreSQL-specific issues (column type differences, SQL syntax, transaction behavior). Use SQLite for unit tests; run integration tests against the production-matching database.
- **Single Database vs Multiple Databases:** A single database is simpler to manage but couples data concerns. Multiple databases provide isolation (analytics, reporting, logs) but add connection management complexity.

## Performance Considerations

- **Local Database Performance:** A database running in Docker on a local machine (same host as the application) adds <1ms network latency. Performance is comparable to a native installation.
- **SQLite Speed:** In-memory SQLite is extremely fast (no disk I/O, no network). Test suite execution with SQLite is typically 2-5x faster than with MySQL/PostgreSQL.
- **Docker Volume Performance:** Named volumes (managed by Docker) have better performance than bind mounts for database files. On macOS, Docker database performance is 20-30% slower than native due to filesystem translation.
- **Memory Allocation:** Allocate sufficient Docker memory (4GB+ recommended) for development. Database containers use memory for query cache, connections, and buffers.

## Production Considerations

- **Development vs Production Parity:** Use the same database engine and version in development as production. Differences in behavior (SQL syntax, data types, collation) can cause production issues that aren't caught locally.
- **Connection Credentials:** Development database passwords are typically simple and shared. Never use development credentials in production. Use environment-specific .env files.
- **Data Privacy:** Development databases often contain anonymized or synthetic data. Never use production data with real PII in local development environments without proper anonymization.
- **Database Backups:** Development databases don't need backups (data is recreate-able via migrations and seeders). Production databases require automated backup strategies.

## Common Mistakes

- **Using SQLite for testing but MySQL in production:** SQLite doesn't enforce column types strictly, doesn't support some MySQL features (full-text indexes, spatial data, JSON column operations), and behaves differently with transactions. Tests pass locally but fail in production.
- **Version mismatch between development and production:** MySQL 8.0 locally, MySQL 5.7 in production; different default character sets, collation handling, and SQL syntax cause unexpected issues.
- **Not using persistent volumes:** The database container uses ephemeral storage; restarting the container loses all development data. Always configure named volumes for database persistence.
- **Overwriting the .env database config:** Committing .env with development database credentials that aren't overwritable in production; production tries to connect to localhost database
- **Running migrations on the production database from local:** php artisan migrate run locally with DB_HOST pointing to production; always verify environment before running destructive commands

## Failure Modes

- **Database Container Crash on Startup:** The database container fails to start (port conflict, volume permission, corrupted data files). Mitigate: check Docker logs; reset the container with docker compose down -v.
- **Volume Permission Issue:** On Linux, the database container's user (UID 999 for MySQL) can't write to the bind-mounted volume. Mitigate: use named volumes instead of bind mounts; set correct ownership.
- **Connection Refused:** Application can't reach the database (wrong host, wrong port, container not running). Mitigate: check docker-compose.yml service status; verify .env configuration.
- **Migration Conflict:** Two developers create migrations with the same filename (same timestamp). Mitigate: set different migration timestamps; resolve in code review.
- **OOM Killer Stops Database:** Docker memory limit is too low; the database process is OOM-killed. Mitigate: allocate 4GB+ Docker memory; configure MySQL/PostgreSQL memory limits.

## Ecosystem Usage

- **Laravel Sail:** MySQL is the default database service; PostgreSQL is available as an alternative service configuration
- **Laravel Forge:** Forge provisions MySQL or PostgreSQL on the server; Sail's database setup mirrors Forge's configuration for environment parity
- **Laravel Vapor:** Vapor uses RDS (MySQL) or Aurora for production; local development with Sail's MySQL simulates the production query patterns
- **Laravel Nova:** Nova's resource tools work with MySQL or PostgreSQL; development environment should match production database for consistent Nova behavior
- **Laravel Telescope/Debugbar:** These tools show database queries; use the same database engine in development to get accurate query analysis

## Related Knowledge Units

- laravel-sail
- docker-compose-for-laravel
- cache-queue-services
- environment-file-management

## Research Notes

- Sail supports both MySQL 8.0 and latest (8.4+); the default is configurable in docker-compose.yml
- PostgreSQL 16 is the default PostgreSQL version in recent Sail versions
- SQLite is not available as a Sail service (it's filesystem-based); Laravel uses the php-sqlite3 extension for SQLite support
- MongoDB requires a third-party package (jenssegers/mongodb or mongodb/laravel-mongodb) for Laravel integration; it's not part of default Laravel
