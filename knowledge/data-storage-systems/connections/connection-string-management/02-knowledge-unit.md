# Metadata

Domain: Data & Storage Systems
Subdomain: Connection Management & Pooling
Knowledge Unit: 10.11 Connection string management (environment variables, dynamic password rotation)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Database connection strings (host, port, username, password, database) must be managed securely: environment variables (non-committed), secret manager (AWS Secrets Manager, Vault), and dynamic rotation. Laravel reads config from `env()` at boot. For runtime changes (password rotation), use `config()->set()` + purge.

---

# Core Concepts

- **Environment variables**: `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` in `.env`. Not committed to version control.
- **Secret manager integration**: `config/database.php` reads from AWS Secrets Manager at boot. `DB_PASSWORD = json_decode(file_get_contents('http://localhost:2773/secrets/...'))->password`.
- **Runtime rotation**: Secrets manager updates password. Application detects (via health check → reconnect failure), reads new secret, `config()->set(...)`, `DB::purge('mysql')`, reconnect.

---

# Patterns

**AWS Secrets Manager sidecar**: Sidecar process in ECS/EKS fetches secrets every N minutes. Writes to shared temp file. Laravel reads from file.

**Database URL**: `DATABASE_URL="mysql://user:pass@host:3306/db"` — parse in `config/database.php`. Simpler than individual env vars. Laravel bootstrappers support this.

---

# Common Mistakes

**Hardcoded database config**: `'password' => 'password123'` in committed `config/database.php`. Use environment variables exclusively.

---

# Related Knowledge Units

10.5 Dynamic connection config | 10.6 Connection purging
## Ecosystem Usage

pgBouncer is the standard PostgreSQL connection pooler. ProxySQL provides MySQL connection pooling. Laravel Octane requires connection pooling to prevent exhaustion.

## Failure Modes

Transaction pooling breaks SET session state. Connection starvation when all pool connections used. Pooler restart drops all connections.

## Performance Considerations

Pooling reduces connection overhead from 1-2ms to microseconds. Optimal pool size is 2x core_count plus spindle_count.

## Production Considerations

Monitor pool utilization. Use session pooling for Laravel compatibility. Configure max_client_conn for burst tolerance.

## Research Notes

pgBouncer transaction pooling is incompatible with Laravel session-state operations. ProxySQL query rules enable proxy-level read/write splitting.

## Internal Mechanics

pgBouncer maintains pre-established connections. Session pooling assigns connections for session duration. Transaction pooling returns connections after each transaction.

## Architectural Decisions

pgBouncer for PostgreSQL only. ProxySQL for MySQL/MariaDB with read/write split. Pgpool-II for PostgreSQL with read/write split.

## Tradeoffs

Benefit: Reduced connection overhead. Cost: Additional infrastructure. Benefit: Burst absorption. Cost: Pool sizing complexity.

## Mental Models

Connection pooling is valet parking. The valet keeps connections ready. Without a valet, each request fetches its own car from the garage.

