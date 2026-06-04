# 07-Decision Trees: Laravel Sail

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | development-environments |
| **Knowledge Unit** | laravel-sail |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Sail vs Native | Whether to use Sail or native PHP for development | Does the project benefit from containerized environment consistency? |
| D02 | Service Selection | Which Sail services to include | What infrastructure does the application need? |
| D03 | PHP Version | Which PHP version to run in Sail | What PHP version does the project and production require? |
| D04 | Customization | Whether to publish and customize Sail | Do we need PHP extensions or system packages beyond Sail's defaults? |

## Architecture-Level Decision Trees

### D01: Sail vs Native

```
START: Should we use Laravel Sail or native PHP development?
│
├── Sail (recommended for most projects)
│   ├── Team environment consistency (same PHP, DB, Redis versions)
│   ├── Cross-platform: identical experience on Windows/WSL2, macOS, Linux
│   ├── Production-like: Nginx + PHP-FPM + MySQL (matches Forge)
│   ├── Easy onboarding: composer require laravel/sail, sail up -d
│   ├── Zero config: pre-built docker-compose.yml for standard stack
│   └── Best for: teams, projects with multiple services, cross-platform
│
├── Native PHP (simpler, lighter)
│   ├── Solo projects, simple apps (SQLite only)
│   ├── PHP built-in server: php artisan serve
│   ├── Pro: no Docker overhead, instant startup
│   ├── Pro: less RAM consumption (no VM)
│   ├── Con: PHP version must match manually
│   ├── Con: no service isolation
│   └── Best for: solo devs, simple apps, limited RAM
│
└── Decision factors
    ├── Team size > 1? → Sail
    ├── Multiple services (DB, Redis, search)? → Sail
    ├── Limited RAM (<8GB)? → Native or minimal Sail
    ├── Windows? → Sail (via WSL2) for Docker support
    └── Production uses Forge? → Sail (same architecture)
```

### D02: Service Selection

```
START: Which Sail services does the project need?
│
├── Minimal stack (default)
│   ├── laravel.test (PHP-FPM + Nginx)
│   ├── mysql (database)
│   ├── redis (cache/queue/sessions)
│   ├── RAM: ~2-3GB
│   └── Covers: most Laravel apps
│
├── With email testing
    ├── Add: --with=mailpit
    ├── RAM: ~2.5-3.5GB
    └── Best for: apps sending notifications/mail
│
├── With search
    ├── Add: --with=meilisearch
    ├── RAM: ~3-4GB
    └── Best for: apps using Scout/Meilisearch
│
├── With file storage
    ├── Add: --with=minio
    ├── RAM: ~3-4GB
    └── Best for: apps using S3-compatible storage
│
├── With browser testing
    ├── Add: --with=selenium
    ├── RAM: ~4-5GB
    └── Best for: apps with Dusk browser tests
│
└── Service addition after project creation
    ├── Edit docker-compose.yml to add service manually
    ├── Or re-run sail:install with new --with flags
    └── Don't add unused services (waste RAM)
```

### D03: PHP Version

```
START: Which PHP version should Sail use?
│
├── Set PHP_VERSION in .env
│   ├── PHP_VERSION=8.3 (current stable, recommended for new projects)
│   ├── PHP_VERSION=8.4 (latest, if production supports it)
│   ├── PHP_VERSION=8.2 (Laravel 11 minimum)
│   └── PHP_VERSION=8.1 (legacy, EOL Dec 2025)
│
├── Selection rules
│   ├── Match production PHP version exactly
│   ├── New projects → PHP 8.3 (current stable, widely supported)
│   ├── Upgrade projects → same as production
│   └── CI matrix → multiple PHP versions
│
├── After changing PHP_VERSION
│   ├── Stop Sail: sail down
│   ├── Rebuild: sail build --no-cache
│   ├── Start: sail up -d
│   └── Verify: sail php --version
│
└── PHP version considerations
    ├── Laravel 11 requires PHP 8.2+
    ├── Laravel 12 will require PHP 8.2+
    ├── PHP 8.1 security support ends Dec 2025
    └── Each major PHP version: 10-30% performance improvement
```

### D04: Customization

```
START: Should we publish and customize Sail?
│
├── No customization needed
│   ├── Sail's defaults cover all requirements
│   ├── Standard PHP extensions (pdo, mbstring, xml, curl, etc.)
│   ├── No custom system packages needed
│   └── Best for: standard Laravel projects
│
├── Publish for customization
│   ├── Run: php artisan sail:publish
│   ├── Creates: docker/ directory with Dockerfiles
│   ├── Customize when:
    │   │   ├── Need PHP extensions: gd, imagick, swoole, pcntl, sodium
    │   │   ├── Need system packages: wkhtmltopdf, Chrome Headless
    │   │   └── Need custom php.ini: memory_limit, upload_max_filesize
    │   └── After edit: sail build --no-cache
│
└── Customization best practices
    ├── Don't modify vendor/sail (overwritten on update)
    ├── Chain RUN commands with && to minimize layers
    ├── Order least-changed instructions first for Docker caching
    ├── For multi-version support: shared install scripts
    └── Commit docker/ directory to VCS for team sharing
```
