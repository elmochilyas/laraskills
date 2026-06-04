# 07-Decision Trees: Sail Customization (Dockerfiles)

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | development-environments |
| **Knowledge Unit** | sail-customization-dockerfiles |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Customization Necessity | Whether to publish and customize Sail's Dockerfile | Do we need PHP extensions or system packages beyond Sail's defaults? |
| D02 | Extension Installation | How to add PHP extensions | What PHP extensions does the application need? |
| D03 | Multi-Runtime Management | Managing multiple PHP versions with custom Dockerfiles | Does the project support multiple PHP versions with different extension needs? |
| D04 | Build Optimization | How to optimize Docker build performance | How do we minimize rebuild time and image size? |

## Architecture-Level Decision Trees

### D01: Customization Necessity

```
START: Do we need to customize Sail's Dockerfile?
│
├── No customization needed
│   ├── Sail's built-in extensions are sufficient:
│   │   ├── bcmath, ctype, curl, exif, fileinfo, json
│   │   ├── mbstring, openssl, pcntl, pdo, pdo_mysql
│   │   ├── pdo_pgsql, redis, tokenizer, xml, zip
│   ├── No additional system packages needed
│   ├── No custom php.ini settings needed
│   └── Best for: standard Laravel projects
│
├── Publish for customization
│   ├── Run: php artisan sail:publish
│   ├── Need when:
    │   │   ├── gd/imagick (image processing)
    │   │   ├── swoole (async, WebSocket server)
    │   │   ├── sodium (encryption, password hashing alternative)
    │   │   ├── xdebug (step debugging — may need custom config)
    │   │   ├── wkhtmltopdf (HTML to PDF)
    │   │   ├── Chrome Headless (browser testing)
    │   │   └── pcntl (process control, Horizon, Reverb)
    │   └── Always: publish before customizing (not vendor/sail)
│
└── Decision flow
    ├── Check: php -m inside Sail container for current extensions
    ├── Check: does the app install any package that needs a system dep?
    ├── If yes: publish, add extensions, rebuild
    ├── If no: keep defaults, no maintenance needed
    └── Re-evaluate: when new package with system dep is added
```

### D02: Extension Installation

```
START: How should we add PHP extensions to Sail?
│
├── Dockerfile RUN commands
│   ├── PHP extensions: docker-php-ext-install extension_name
│   ├── PECL extensions: pecl install extension_name && docker-php-ext-enable
│   ├── System packages: apk add --no-cache package_name
│   ├── Chain with && to minimize layers:
    │   └── RUN apk add --no-cache libpng libjpeg && docker-php-ext-install gd
│   └── Append to existing Dockerfile's RUN section
│
├── Extension sources
│   ├── Alpine packages: apk add (system deps)
│   ├── PHP core extensions: docker-php-ext-install (PHP built-in)
│   ├── PECL: pecl install (community extensions)
│   └── Source compile: git clone && phpize && configure && make (rare)
│
├── php.ini overrides
│   ├── Create docker/php.ini or modify php.ini in container
│   ├── Common changes:
    │   │   ├── memory_limit = 256M
    │   │   ├── upload_max_filesize = 64M
    │   │   ├── post_max_size = 64M
    │   │   └── max_execution_time = 300
    │   └── Add to Dockerfile: COPY php.ini /usr/local/etc/php/conf.d/99-sail.ini
│
└── Verification
    ├── sail build --no-cache (rebuild image)
    ├── sail php -m | grep extension_name (verify installed)
    └── sail php -i | grep setting_name (verify php.ini changes)
```

### D03: Multi-Runtime Management

```
START: Does the project need custom Dockerfiles for multiple PHP versions?
│
├── Single PHP version
│   ├── Edit: docker/<version>/Dockerfile
│   ├── Simple: one Dockerfile to maintain
│   └── Best for: projects locked to one PHP version
│
├── Multiple PHP versions (library, open-source, CI matrix)
│   ├── docker/8.2/Dockerfile, docker/8.3/Dockerfile, etc.
│   ├── Strategy A: copy common install logic to each Dockerfile
│   │   ├── Simple but repetitive
│   │   └── Maintenance overhead: update all Dockerfiles
│   ├── Strategy B: shared install script
│   │   ├── Create docker/install-extensions.sh
│   │   ├── Each Dockerfile: COPY install-extensions.sh && RUN ./install-extensions.sh
│   │   ├── Pro: single source of truth for extensions
│   │   └── Recommended for multi-version projects
│   └── Strategy C: base image with extensions + per-version overrides
│       └── More advanced Docker multi-stage pattern
│
└── SAIL_SHARED_EXTENSIONS pattern
    ├── Not built into Sail — implement manually
    ├── Separate common extensions per version
    └── Document version-specific differences
```

### D04: Build Optimization

```
START: How do we optimize Docker build performance?
│
├── Layer caching optimization
│   ├── Order least-changed instructions first
│   ├── Bundle RUN commands with &&:
    │   │   ├── Bad: 5 separate RUN = 5 extra layers
    │   │   └── Good: 1 RUN with && = 1 layer
│   └── Invalidating cache: change instruction order carefully
│
├── Image size optimization
    ├── Use Alpine images (smaller than Debian)
    ├── Clean up apk cache: rm -rf /var/cache/apk/*
    ├── Don't install dev packages in production
    └── Remove build tools after compilation:
        └── RUN apk add --no-cache ... && docker-php-ext-install ... && apk del build-deps
│
├── Rebuild strategies
    ├── Standard: sail build --no-cache (no cache, full rebuild)
    ├── Quick: sail build (uses cache, if available)
    ├── Partial: docker compose up -d --build (rebuilds changed services)
    └── After extension change: must run --no-cache for the changed step
│
└── Frequency of rebuild
    ├── First build: 5-15 minutes
    ├── Subsequent with cache: 1-3 minutes
    ├── Architecture changes (PHP version): full rebuild
    └── Minor extension add: partial rebuild (cached layers used)
```
