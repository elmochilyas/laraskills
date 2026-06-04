# Knowledge Unit: Laravel Sail

## Metadata
- **Subdomain:** Development Environments
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** development-environments/laravel-sail
- **Maturity:** Mature
- **Related Technologies:** Laravel Sail, Docker, Docker Compose, PHP, MySQL, Redis

## Executive Summary

Laravel Sail is a lightweight command-line interface for interacting with Laravel's default Docker Compose development environment. It provides a pre-configured `docker-compose.yml` with services: PHP 8.x (with PHP-FPM), MySQL/PostgreSQL, Redis, Meilisearch, Mailpit, Selenium, MinIO, and Node.js. Sail wraps Docker Compose commands with a simple `./vendor/bin/sail` script that handles service management (up, down, stop, start), PHP/Composer/Node execution within containers, and service-specific commands (artisan, npm, composer). Sail is designed for teams that want a consistent, containerized development environment without writing Docker configuration from scratch. It supports PHP version switching, service selection during installation, and customization via publishing the Dockerfile.

## Core Concepts

- **sail Command:** ./vendor/bin/sail is a bash script that wraps Docker Compose commands; sail up starts the environment, sail artisan runs Artisan commands inside the container
- **sailrc:** A shell alias (alias sail='[ -f sail ] && bash sail || bash vendor/bin/sail') for convenient sail command usage
- **Service Containers:** Pre-configured Docker services: laravel.test (PHP-FPM with PHP 8.x), mysql (MySQL 8.0), pgsql (PostgreSQL 15), redis (Redis Alpine), meilisearch, mailpit, selenium, minio
- **PHP Version Selection:** Sail supports PHP 8.0 through 8.4; selected via PHP_VERSION variable in docker-compose.yml
- **Environment Configuration:** Sail reads .env variables for configuration: APP_PORT (web port), FORWARD_DB_PORT (database port), SAIL_XDEBUG_MODE (Xdebug settings)
- **Sail Publish:** php artisan sail:publish copies the docker/ directory (Dockerfile, configuration) to the project for customization
- **Devcontainer Generation:** php artisan sail:install --devcontainer creates VS Code Devcontainer configuration

## Mental Models

- **Sail as Docker Compose Wizard:** Sail is like a wizard that generates a production-quality Docker Compose setup for Laravel—no Docker expertise required
- **sail Command as Proxy:** The sail command proxies all operations into the Docker container; sail artisan runs Artisan in the container, sail php runs PHP, sail npm runs npm
- **Sail as Development Appliance:** Think of Sail as a pre-configured development appliance—plug in your project, flip the switch (sail up), and the full stack runs

## Internal Mechanics

1. **Project Initialization:** sail:install adds Sails's docker-compose.yml, Dockerfile, and configuration files to the project
2. **Service Start:** sail up builds/pulls images, creates containers, sets up networks, and starts all configured services in dependency order
3. **Command Execution:** sail artisan runs docker compose exec laravel.test php artisan, the PHP process executes inside the FPM container with the project's PHP version and extensions
4. **File Synchronization:** The project directory is bind-mounted into the container; file changes on the host are immediately reflected in the container (and vice versa)
5. **Service Communication:** Containers communicate via Docker's internal network; Laravel connects to mysql:3306, redis:6379, mailpit:1025 using service hostnames
6. **Port Forwarding:** Container ports are mapped to host ports (APP_PORT for web, FORWARD_DB_PORT for database, etc.) for external access

## Patterns

- **Quick Start Pattern:** sail up -d (background mode) for initial environment start; sail down to stop. This is the standard daily workflow.
- **Command Execution Pattern:** Use sail artisan for Artisan commands, sail composer for Composer, sail npm for Node, sail php for arbitrary PHP commands. All run inside the container with consistent versions.
- **Service Customization Pattern:** Add services (MongoDB, Typesense, Elasticsearch) by adding to docker-compose.yml's services section and configuring Laravel to use them.
- **PHP Version Switching Pattern:** Set PHP_VERSION=8.3 in .env; rebuild containers with sail build --no-cache to switch PHP versions.
- **Sail Publish + Customize Pattern:**
  ```bash
  php artisan sail:publish
  # Edit docker/8.3/Dockerfile (or docker/runtimes/8.3)
  sail build --no-cache
  ```
  This customizes the PHP Docker image with additional extensions or tools.
- **Debugging Pattern:** Set SAIL_XDEBUG_MODE=debug,develop in .env; sail up (or restart) boots PHP with Xdebug enabled; browser extension or CLI triggers debugging sessions.
- **Selective Service Pattern:** Use Sail's service selection during installation: php artisan sail:install --with=mysql,redis,meilisearch to install only needed services.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| PHP version | 8.0 through 8.4 | 8.3 (current stable); match production PHP version |
| Database | MySQL vs PostgreSQL vs both | MySQL (default); PostgreSQL for advanced features |
| Cache/Queue | Redis vs none | Redis (default for cache and queue) |
| Search | Meilisearch vs Typesense vs none | Meilisearch for full-text search needs |
| Web server | Nginx (via laravel.test service) vs Caddy | Nginx (default, Forge-compatible) |

## Tradeoffs

- **Sail vs Native Setup:** Sail provides environment consistency (everyone runs the same PHP/MySQL/Redis versions) but adds Docker overhead (2-4GB RAM, 15-45s startup). Native setup is faster and lighter but prone to version inconsistencies across the team.
- **Sail vs Homestead:** Sail is Docker-based (modern, lightweight, fast startup) while Homestead is Vagrant-based (full VM, heavier, slower). Sail is recommended for all new projects; Homestead is legacy.
- **Sail vs Laragon:** Laragon is Windows-native (no Docker required) and faster for simple projects. Sail is cross-platform (Windows, macOS, Linux) and more production-like (containerized services mirror production).

## Performance Considerations

- **Startup Time:** Initial sail up takes 1-5 minutes (image pull, build). Subsequent starts: 15-45 seconds. docker compose down + up: 15-45 seconds.
- **Filesystem Performance:** On macOS, bind-mounted volumes have slower I/O (via osxfs). Sail uses :cached mount option by default to mitigate this. On Docker for Windows, similar overhead exists.
- **Memory Usage:** Full Sail stack (PHP, MySQL, Redis, Mailpit, Meilisearch) uses 3-5GB RAM. Reduce services for lower memory usage.
- **PHP-FPM Performance:** PHP-FPM inside the container has comparable performance to native PHP-FPM (~5% overhead from Docker networking). For most development tasks, this is negligible.

## Production Considerations

- **Development Only:** Sail is for development environments only. Never run Sail in production—it exposes development ports, runs with debug tools, and has no security hardening.
- **Forge Compatibility:** Sail's configuration mirrors Laravel Forge's production setup (Nginx + PHP-FPM + MySQL + Redis). Code that works on Sail typically works on Forge with minimal changes.
- **Vapor Compatibility:** For Vapor (serverless) projects, Sail provides local development but the production architecture is completely different (Lambada, RDS, SQS). Test production-specific behaviors separately.
- **CI Integration:** Sail can be used in CI (GitHub Actions) for consistent test environments, but this adds Docker overhead to CI jobs. Dedicated CI service containers (MySQL, Redis) are more common.
- **Port Management:** Sail uses port 80 (or configured APP_PORT) for the web server. If 80 is in use (Apache, nginx, another Sail project), set APP_PORT=8080 in .env.

## Common Mistakes

- **Modifying docker-compose.yml directly:** Updating Sail replaces the file; customize via .env variables or use sail:publish and modify the Dockerfile
- **Running sail without alias:** Typing vendor/bin/sail instead of setting up the sail alias; inconvenient but functional
- **Not rebuilding after PHP extension changes:** Adding a PHP extension requirement but not running sail build --no-cache; the extension isn't available
- **Forgetting to run migrations:** Starting Sail with sail up but not running sail artisan migrate; database is empty
- **Inconsistent PHP version:** Using PHP 8.2 in Sail but deploying to PHP 8.1 in production; syntax or feature incompatibility issues

## Failure Modes

- **Docker Not Running:** sail up fails because Docker Desktop/Engine isn't installed or running. Mitigate: document Docker prerequisite; provide installation links.
- **Port Conflicts:** Default port (80, 3306, 6379) is in use. Mitigate: change ports via APP_PORT, FORWARD_DB_PORT, etc. in .env.
- **Volume Permission Issues:** Container user can't write to project files. Mitigate: Sail uses user mapping in container to match host user; ensure UID/GID mapping is correct.
- **Image Build Failure:** Docker build fails due to missing dependencies or network issues. Mitigate: use cached images; check network connectivity; ensure sufficient disk space.
- **Container OOM:** Memory limit exceeded for a service container. Mitigate: increase Docker Desktop memory allocation; limit per-service memory in docker-compose.yml.

## Ecosystem Usage

- **Laravel Documentation:** Sail is the recommended development environment in the official Laravel documentation
- **Laravel Forge:** Sail's service configuration mirrors Forge's production setup for environment parity
- **Laravel Vapor:** Sail provides local development for Vapor projects, simulating the serverless environment as closely as Docker allows
- **Laravel Bootcamp:** The Bootcamp tutorials assume Sail as the development environment for consistency across platforms
- **Laracasts:** Laracasts courses use Sail for containerized development demonstrations

## Related Knowledge Units

- docker-compose-for-laravel
- sail-customization-dockerfiles
- devcontainer-configuration
- wsl2-configuration-laravel
- database-services

## Research Notes

- Laravel Sail was introduced in Laravel 8.x as a Docker-based alternative to Homestead (Vagrant-based)
- Sail v1.61+ supports PHP 8.4, Valkey (Redis fork), and improved Windows compatibility
- Sail uses environment variable substitution in docker-compose.yml for customization without file editing
- The sail:publish command was improved in Laravel 11 to support multiple PHP runtime versions in docker/ directory
