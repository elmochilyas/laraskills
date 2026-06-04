# 07-Decision Trees: Docker Compose for Laravel

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | development-environments |
| **Knowledge Unit** | docker-compose-for-laravel |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Service Selection | Which services to include in the stack | What infrastructure services does the application need? |
| D02 | Customization Strategy | How to customize Docker Compose beyond defaults | Do we need to add services or modify existing ones? |
| D03 | Port Mapping | Which ports to expose and how | Do we need direct access to services from host tools? |
| D04 | Volume Strategy | Which volumes and mount types to use | What data persistence and file sync strategy is needed? |

## Architecture-Level Decision Trees

### D01: Service Selection

```
START: Which Docker Compose services does the project need?
│
├── Essential (always needed)
│   ├── laravel.test (PHP-FPM + Nginx)
│   ├── mysql or pgsql (database)
│   └── Redis (cache, queue, session)
│
├── Optional (based on app requirements)
│   ├── mailpit (email capture) — every app benefits from email testing
│   ├── meilisearch (search) — if using Laravel Scout with Meilisearch
│   ├── selenium (browser testing) — if using Laravel Dusk
│   ├── minio (S3 storage) — if using S3 file storage
│   └── Additional DB engines — if connecting to multiple databases
│
├── Selection via Sail
│   ├── Install with: --with=mysql,redis,mailpit,meilisearch,selenium,minio
│   ├── After install: edit docker-compose.yml to add/remove services
│   └── Each service adds: 50-500MB image size, 50-200MB RAM usage
│
└── Service selection guide
    ├── Need email testing? → Add mailpit
    ├── Need full-text search? → Add meilisearch
    ├── Need S3-compatible storage? → Add minio
    ├── Need browser tests? → Add selenium
    └── Don't add services you don't need (waste of resources)
```

### D02: Customization Strategy

```
START: How should we customize Docker Compose beyond Sail defaults?
│
├── Environment variables (safe, persists through updates)
│   ├── APP_PORT=8080 (change web port)
│   ├── FORWARD_DB_PORT=3307 (change DB port)
│   ├── PHP_VERSION=8.3 (change PHP version)
│   ├── SAIL_XDEBUG_MODE=debug (enable Xdebug)
│   └── Changes take effect on: sail stop && sail up -d
│
├── sail:publish (for Dockerfile changes)
    ├── Run: php artisan sail:publish
    ├── Creates docker/ directory with Dockerfiles
    ├── Edit Dockerfile for: PHP extensions, system packages
    ├── Requires: sail build --no-cache
    └── Changes persist through Sail updates
│
├── Direct docker-compose.yml edit (last resort)
    ├── Risk: overwritten on Sail update
    ├── Only safe for: adding NEW services (not modifying existing)
    ├── If editing: document changes in comments
    └── Alternative: use docker-compose.override.yml
│
└── docker-compose.override.yml (recommended for custom additions)
    ├── Extends base docker-compose.yml
    ├── Add new services, volumes, networks
    ├── Not overwritten by Sail updates
    └── Team: commit to VCS for sharing
```

### D03: Port Mapping

```
START: Which ports should be exposed to the host?
│
├── Essential ports (always expose)
│   ├── ${APP_PORT:-80}:80 — web server
│   ├── ${FORWARD_DB_PORT:-3306}:3306 — database (GUI tools)
│   └── Ports configurable via .env variables
│
├── Optional ports (on-demand)
│   ├── 8025:8025 — Mailpit web UI
│   ├── 7700:7700 — Meilisearch
│   ├── 9001:9001 — MinIO console
│   ├── 6379:6379 — Redis (if using desktop Redis manager)
│   └── Don't expose unused ports (security, port conflicts)
│
├── Service-to-service communication
│   ├── Internal ports don't need host mapping
│   ├── Services use hostnames: mysql, redis, mailpit
│   └── Docker network handles internal resolution
│
└── Port conflict resolution
    ├── If 3306 is in use → FORWARD_DB_PORT=3307
    ├── If 80 is in use → APP_PORT=8080
    └── Set in .env, referenced in docker-compose.yml
```

### D04: Volume Strategy

```
START: Which volumes and mount types should we use?
│
├── Application code (bind mount)
│   ├── Type: bind mount (.:/var/www/html)
│   ├── Pro: code changes reflect instantly
│   ├── OS considerations:
│   │   ├── macOS: use :cached flag for performance
│   │   └── Windows/WSL2: store project in WSL2 filesystem
│   └── Essential for: live code reload during development
│
├── Database data (named volume)
│   ├── Type: named volume (sail-mysql:/var/lib/mysql)
│   ├── Pro: data survives container restarts
│   ├── Pro: Docker manages volume lifecycle
│   └── Don't: bind mount database files (performance, corruption risk)
│
├── Redis data (no persistence needed)
│   ├── Development: no volume needed (volatile data acceptable)
│   ├── Production: would use AOF/RDB persistence
│   └── Keep it simple in dev — no volume = faster restarts
│
└── Volume management
    ├── List: docker volume ls
    ├── Prune: docker volume prune (removes all unused)
    ├── Backup: rarely needed for dev data
    └── Reset DB: docker compose down -v (removes volumes)
```
