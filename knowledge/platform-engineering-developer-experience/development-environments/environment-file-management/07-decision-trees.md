# 07-Decision Trees: Environment File Management

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | development-environments |
| **Knowledge Unit** | environment-file-management |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | env() vs config() | Where to use each helper | Are we in a config file or application code? |
| D02 | Config Caching | Whether to cache config in the current environment | Is this production (cache) or development (don't cache)? |
| D03 | Environment Files | Which .env files to create and when | How many environments does the application support? |
| D04 | Required Variables | How to handle required vs optional env vars | Which variables are critical and need validation? |

## Architecture-Level Decision Trees

### D01: env() vs config()

```
START: Where is this code executing?
│
├── Inside a config file (config/*.php)
│   ├── Use: env('KEY', 'default')
│   ├── This is the ONLY place env() should be called
│   ├── Examples:
│   │   └── config/app.php: 'debug' => env('APP_DEBUG', false)
│   └── env() is resolved once when config is loaded
│
├── Inside application code (controllers, services, models, commands)
│   ├── Use: config('app.debug')
│   ├── Never use env() here — breaks when config is cached
│   ├── Examples:
│   │   └── $debug = config('app.debug');
│   └── config() works regardless of cache state
│
├── Inside Blade templates
│   ├── Use: {{ config('app.name') }}
│   └── Same rule as application code
│
└── Inside database migrations or seeders
    ├── Use: config(), not env()
    ├── Migrations may run after config caching
    └── env() returns null in cached config
```

### D02: Config Caching

```
START: Should we cache config in this environment?
│
├── Production (always cache)
│   ├── Run: php artisan config:cache after every deployment
│   ├── Benefits:
│   │   ├── 10-30ms faster bootstrap
│   │   ├── Fewer file reads per request
│   │   └── env() calls resolved at cache time
│   ├── After caching: env() stops working (expected)
│   ├── Reminder: run config:cache after ANY config change
│   └── Pipeline: deploy → config:cache → route:cache → serve
│
├── Development (never cache)
│   ├── env() changes take effect immediately
│   ├── If config cached accidentally: php artisan config:clear
│   ├── Pain point: env() in app code silently returns null after cache
│   └── Workflow: edit .env → changes apply on next request (no cache)
│
├── Testing
│   ├── phpunit.xml sets environment explicitly
│   ├── Don't cache config during test runs
│   └── Config set via <env> tags in phpunit.xml
│
└── Config cache commands
    ├── php artisan config:cache — cache all config
    ├── php artisan config:clear — clear cached config
    └── php artisan optimize:clear — clear all caches
```

### D03: Environment Files

```
START: Which .env files should exist for this project?
│
├── .env (local development)
│   ├── Location: project root
│   ├── Status: NOT committed (.gitignore)
│   ├── Contains: real values for local environment
│   ├── Generated: from .env.example (copied, then customized)
│   └── Each developer: their own .env with their own values
│
├── .env.example (template)
│   ├── Location: project root
│   ├── Status: COMMITTED
│   ├── Contains: placeholder values, all required keys
│   ├── Purpose: documents required env vars for new devs
│   └── Keep: up-to-date as new env vars are added
│
├── .env.testing (test environment)
│   ├── Location: project root
│   ├── Status: optional, can be committed
│   ├── Used: when running tests with APP_ENV=testing
│   └── Contains: test-specific values (in-memory DB, etc.)
│
├── .env.dusk.local (Dusk environment)
│   ├── Used: by Laravel Dusk browser tests
│   ├── Status: typically not committed
│   └── Contains: Dusk-specific config
│
└── Production environment
    ├── NO .env file — use platform environment variables
    ├── Forge, Vapor, etc. manage env vars in dashboard
    └── Never upload .env to production server
```

### D04: Required Variables

```
START: Which env vars are critical and need validation?
│
├── Required for app to function (fail early)
│   ├── APP_KEY (cryptographic, must be set)
│   ├── APP_ENV (determines behavior)
│   ├── DB_* (database connection)
│   └── Validate at bootstrap in AppServiceProvider or middleware
│
├── Required for specific features (fail gracefully)
│   ├── MAIL_* (email — log driver as fallback)
│   ├── AWS_* (S3 — local disk as fallback)
│   ├── REDIS_* (cache — file cache as fallback)
│   ├── Validate when the feature is used, not at bootstrap
│   └── Provide meaningful error messages
│
├── Optional with defaults (document but don't validate)
│   ├── APP_DEBUG (default: false)
│   ├── APP_URL (default: http://localhost)
│   ├── SESSION_DRIVER (default: file)
│   └── Defined in config files with env() defaults
│
└── Validation implementation
    ├── Bootstrap validation:
    │   // In AppServiceProvider or bootstrap/app.php
    │   throw_unless(env('APP_KEY'), 'APP_KEY is required');
    ├── Per-feature validation:
    │   if (! config('mail.mailers.smtp.host')) { throw new MailNotConfiguredException(); }
    └── Keep .env.example updated as the single source of truth
```
