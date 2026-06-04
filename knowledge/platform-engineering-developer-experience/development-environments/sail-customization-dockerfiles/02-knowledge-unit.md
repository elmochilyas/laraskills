# Knowledge Unit: Sail Customization (Dockerfiles)

## Metadata
- **Subdomain:** Development Environments
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** development-environments/sail-customization-dockerfiles
- **Maturity:** Mature
- **Related Technologies:** Laravel Sail, Docker, Dockerfile, PHP Extensions, php.ini

## Executive Summary

Sail Customization via Dockerfiles refers to the process of extending Laravel Sail's default PHP container image to add custom system dependencies, PHP extensions, PHP configuration overrides, and additional runtimes. Sail provides an official customization mechanism through the `php artisan sail:publish` command, which copies the internal Docker build configuration (`docker/` directory) to the project root for modification. Once published, developers edit the Dockerfile (e.g., `docker/8.3/Dockerfile`), rebuild the container with `sail build --no-cache`, and the custom image is used for all subsequent `sail up` sessions. This pattern is essential when projects require PHP extensions not included by default (gd, imagick, swoole, pcntl), custom system packages (soffice, wkhtmltopdf, Chrome Headless), or non-standard PHP ini settings.

## Core Concepts

- **sail:publish Command:** `php artisan sail:publish` copies the runtime Dockerfile(s) and configuration from Sail's internal store to `docker/` in the project root; after publishing, the local files take precedence over Sail's built-in ones
- **Runtime Dockerfiles:** Sail stores per-PHP-version Dockerfiles in `docker/<version>/Dockerfile` (e.g., `docker/8.3/Dockerfile`); each extends the official `php:<version>-fpm-alpine` base image
- **Supervisord Configuration:** `docker/pki/` and `docker/supervisord.conf` can be customized to manage multiple processes inside the container (e.g., Horizon worker alongside PHP-FPM)
- **PHP Extension Installation:** Using `docker-php-ext-install` and `pecl install` in the Dockerfile RUN command to add extensions; Sail's base image includes `docker-php-ext-configure` and `install-php-extensions` helper scripts
- **Multi-Runtime Support:** Laravel 11+ publishes separate Dockerfiles for each PHP version (8.0, 8.1, 8.2, 8.3, 8.4); changes must be applied per runtime file or consolidated via a shared base pattern

## Mental Models

- **Published Dockerfile as Override:** Think of the published Dockerfile as a local override—Sail checks for `docker/<version>/Dockerfile` first, and only falls back to its internal template if absent
- **Dockerfile as Dev Environment Recipe:** The Dockerfile is a repeatable recipe for the development container; every team member who runs `sail build` gets the exact same set of tools and extensions
- **Multi-Runtime Matrix:** If the project supports multiple PHP versions, each Dockerfile is a cell in a version matrix; changes must be replicated or abstracted into a shared install script

## Internal Mechanics

1. **Publish Step:** `php artisan sail:publish` copies files from Sail's internal template directory (in vendor/laravel/sail/stubs/) to `<project>/docker/`
2. **Build Context:** Sail runs `docker compose build` using the project's `docker-compose.yml` which references the local `docker/<version>/Dockerfile` via the build context
3. **Layer Caching:** Docker caches each RUN instruction layer; reordering or modifying early layers invalidates subsequent caches, impacting rebuild time
4. **Extension Installation Flow:** `docker-php-ext-install` compiles and enables extensions; `pecl install` fetches from PECL; both require the PHP development headers present in the base image
5. **Configuration Injection:** Custom php.ini files placed in `docker/php.ini` are copied into the container at build time or mounted via docker-compose volume
6. **Supervisord Management:** If custom processes are needed, `docker/supervisord.conf` defines process groups managed by supervisord inside the container

## Patterns

- **Basic Extension Addition Pattern:**
  ```dockerfile
  RUN docker-php-ext-install pcntl gd
  ```
  Add after the existing RUN instructions in the published Dockerfile to install additional extensions.
- **PECL Extension Pattern:**
  ```dockerfile
  RUN pecl install swoole && docker-php-ext-enable swoole
  ```
  Use for extensions not available via docker-php-ext-install (Redis, Swoole, Xdebug is pre-installed by Sail but can be version-pinned similarly).
- **System Package Pattern:**
  ```dockerfile
  RUN apk add --no-cache imagemagick wkhtmltopdf
  ```
  Alpine-based images use apk package manager; `--no-cache` prevents package index bloat in the layer.
- **Shared Script Pattern for Multi-Version:**
  ```dockerfile
  # In each docker/<version>/Dockerfile
  COPY install-extras.sh /tmp/
  RUN chmod +x /tmp/install-extras.sh && /tmp/install-extras.sh
  ```
  Extract common install logic into a shared script to maintain parity across PHP version Dockerfiles.
- **Custom php.ini via COPY:**
  ```dockerfile
  COPY php.ini /usr/local/etc/php/php.ini
  ```
  Override the default production php.ini with custom settings (memory_limit, upload_max_filesize, opcache settings for development).
- **Node Version Pinning:**
  ```dockerfile
  ARG NODE_VERSION=20
  RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - && apt-get install -y nodejs
  ```
  Sail installs a default Node version; pin explicitly for projects requiring a specific LTS version.
- **Supervisord Process Addition:**
  ```ini
  [program:horizon]
  command=php /var/www/html/artisan horizon
  autostart=true
  autorestart=true
  ```
  Add to supervisord.conf to run Horizon queue worker automatically in the container.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| PHP version support | Single version vs multi-version matrix | Single version for most projects; multi-version only when supporting client testing across versions |
| Extension source | docker-php-ext vs PECL vs source compile | Prefer docker-php-ext (smaller, maintained); fall back to PECL for Xdebug, Redis; source compile only as last resort |
| Alpine vs Debian base | Alpine (default) vs Debian (sail:install --with=debian) | Alpine for smaller images (~150MB); Debian for packages with Alpine incompatibilities (some PECL extensions) |
| Configuration injection | Build-time COPY vs run-time volume mount | Build-time for stable config (extensions); run-time volume mount for environment-specific settings (php.ini overrides) |

## Tradeoffs

- **Published vs Unpublished:** Unpublished Sail (no docker/ directory) gets automatic updates when Sail is upgraded but cannot be customized. Published Dockerfiles enable customization but require manual merging when Sail's base template changes (e.g., new PHP version support).
- **Custom Dockerfile vs Separate Docker Compose Service:** For radically different requirements (e.g., a Python microservice alongside Laravel), a separate docker-compose service is cleaner than overloading the laravel.test Dockerfile. Use Dockerfile customization only for PHP-level changes.
- **Alpine vs Debian:** Alpine images are smaller and faster to pull (~150MB vs ~400MB), but some PHP extensions (pcntl, imagick) have Alpine-specific build quirks. Debian is more compatible but adds build time and image size.
- **Single Dockerfile vs Multi-Version:** Maintaining multiple Dockerfiles (one per PHP version) duplicates logic unless a shared script abstraction is used. For most teams, pinning a single PHP version avoids this complexity.

## Performance Considerations

- **Build Cache Invalidation:** Each RUN instruction in the Dockerfile creates a cached layer; modifying early instructions (e.g., adding a new apk package before extension install) invalidates all downstream caches. Order Dockerfile steps from least-to-most frequently changed.
- **Image Size Growth:** Each RUN instruction adds a layer; chain commands with `&&` to minimize layers: `RUN apk add --no-cache pkg1 pkg2 && docker-php-ext-install ext1 ext2`
- **Multi-Stage Build Not Needed:** For development containers, multi-stage builds add complexity without significant benefit since the image is not deployed to production
- **Rebuild Frequency:** Full rebuild after Dockerfile changes: 1-5 minutes depending on network speed and package downloads. Use `--no-cache` only when necessary; incremental builds use cached layers for unchanged steps.

## Production Considerations

- **Development Only:** Customized Sail images are for development only. Production Docker images should be built separately (often via Forge or a dedicated CI pipeline) and should not include development tools (Xdebug, Composer development dependencies).
- **Forge Mirroring:** Mirror Sail Dockerfile customizations in the Forge provisioning script or production Dockerfile to ensure extension parity between development and production.
- **Security Patches:** Published Dockerfiles do not automatically receive Sail security updates. Periodically compare the published Dockerfile with Sail's latest template and merge upstream changes.
- **Team Distribution:** Commit the docker/ directory to version control so all team members get the same customizations. Document the rebuild command (`sail build --no-cache`) as a step in the project README.

## Common Mistakes

- **Modifying vendor/sail directly:** Changes to vendor/laravel/sail/... are overwritten on composer update. Always use `sail:publish` for customization.
- **Forgetting to rebuild after changes:** Editing the Dockerfile but not running `sail build --no-cache`; the old image remains in use.
- **Not chaining RUN commands:** Each RUN instruction adds a layer; using separate RUN commands for each apk install bloats the image to 1GB+.
- **Removing Sail's default instructions:** Replacing the entire Dockerfile instead of appending to it; this removes essential setup (Composer install, Node, entrypoint script).
- **Ignoring upstream changes:** When upgrading Sail (composer update), the published Dockerfile lags behind; the build uses the old file with potentially outdated base image references.

## Failure Modes

- **Build Timeout:** Large package downloads (wkhtmltopdf, Chrome) or slow network cause build timeout. Mitigate: extend `COMPOSE_HTTP_TIMEOUT`; use multi-stage caching with a base image registry.
- **Extension Compilation Failure:** PECL extension fails to compile due to missing system headers. Mitigate: install the corresponding `-dev` packages (e.g., `imagemagick-dev` for imagick) before pecl install.
- **Alpine-Glibc Incompatibility:** Some binaries (wkhtmltopdf) require glibc, but Alpine uses musl. Mitigate: use Debian base (`php:<version>-fpm`) instead of alpine; install gcompat as workaround.
- **Dockerfile Merge Conflicts:** When pulling updated Dockerfile from upstream Sail, git merge conflicts occur. Mitigate: review upstream changes in Sail's release notes before merging.

## Ecosystem Usage

- **Laravel Sail:** The primary tool; customization via sail:publish is the official pattern
- **Laravel Forge:** Production provisioning scripts should mirror Dockerfile customizations for dev/prod parity
- **Laravel Vapor:** Custom Dockerfile extensions help simulate Vapor's Lambda runtime environment locally
- **Spatie Package Development:** Package developers use Sail Dockerfile customization to test against multiple PHP extensions and configurations

## Related Knowledge Units

- laravel-sail
- docker-compose-for-laravel
- devcontainer-configuration
- php-version-management
- xdebug-configuration-docker

## Research Notes

- Sail publishes Dockerfiles only for actively supported PHP versions; EOL versions (7.4 and earlier) are not included
- The sail:publish command in Laravel 11+ uses a new runtime-based structure (docker/runtimes/ instead of flat docker/ directory)
- Alpine compatibility issues with PECL extensions (e.g., xdebug, pcntl) are the most common driver for switching to Debian base
- Community practice varies between full Dockerfile customization vs. using a shared install.sh pattern for multi-project consistency
