# Skill: Install and Configure FrankenPHP with Caddyfile

## Purpose

Deploy FrankenPHP by building or downloading the binary, creating the Caddyfile configuration, and verifying the server is serving PHP requests.

## When To Use

- Setting up FrankenPHP for a new project
- Migrating from PHP-FPM to FrankenPHP
- Configuring FrankenPHP for Laravel Octane
- Evaluating FrankenPHP as a deployment option

## When NOT To Use

- Without understanding alternative runtimes landscape
- When FrankenPHP is not the right fit for the workload
- On systems without ZTS PHP support

## Prerequisites

- Linux/macOS with Docker or Go toolchain
- Understanding of Caddy web server configuration
- PHP application to serve

## Inputs

- PHP version requirement
- Caddyfile configuration (domain, routes, PHP settings)
- Application root directory path
- Environment variables (APP_ENV, DATABASE_URL, etc.)

## Workflow (numbered steps)

1. Choose installation method: Docker image (`docker pull dunglas/frankenphp`), static binary, or build from source with Go
2. For Docker: use the official image with your PHP extensions baked in via a custom Dockerfile
3. For static binary: download the latest release from the FrankenPHP GitHub releases page
4. Create a Caddyfile in the project root:
   ```
   localhost {
       root * /app/public
       php_fastcgi unix//var/run/php/php8.3-fpm.sock
       file_server
   }
   ```
5. For Laravel: configure `php_fastcgi` with `trusted_proxies` and `env` directives
6. Configure PHP settings in the Caddyfile: `php_admin_value memory_limit 256M`, `php_admin_value upload_max_filesize 64M`
7. Start FrankenPHP: `docker compose up -d` or `./frankenphp run`
8. Verify: create a `phpinfo.php` and access it through the FrankenPHP URL
9. Check the FrankenPHP logs for any errors (stderr output)
10. Document the installation and Caddyfile configuration

## Validation Checklist

- [ ] FrankenPHP installed (Docker, binary, or source build)
- [ ] Caddyfile created with correct site configuration
- [ ] PHP settings configured (memory_limit, upload_max_filesize, etc.)
- [ ] FrankenPHP starts without errors
- [ ] PHP requests served correctly
- [ ] Logs checked for errors
- [ ] Configuration documented

## Common Failures

- **Missing ZTS PHP build**: FrankenPHP requires ZTS — standard PHP builds are NTS
- **Incorrect Caddyfile syntax**: Caddyfile uses a specific format — validate with `caddy validate`
- **Not setting environment variables**: FrankenPHP needs APP_ENV, DATABASE_URL, etc. passed via the Caddyfile
- **Permission issues**: The FrankenPHP binary and application files need correct ownership

## Decision Points

- Docker environment: use the official Docker image (easiest, most consistent)
- Bare metal: use the static binary (no dependencies)
- Need custom PHP extensions: build from source or use a custom Dockerfile
- Development: use Docker with hot-reload configuration
- Production: pin a specific version, use Docker with health checks

## Performance Considerations

- FrankenPHP with Docker: minimal overhead (~1-2%) vs bare metal
- Caddyfile configuration: `php_fastcgi` directives affect PHP worker behavior
- Automatic HTTPS (Caddy): transparent SSL/TLS management — no separate certbot process
- 103 Early Hints (Caddy): improves perceived performance for CSS/JS loading
- HTTP/3 (QUIC): enabled by default in Caddy — requires UDP port 443

## Security Considerations

- Run FrankenPHP as non-root user — Caddy drops privileges by default
- Caddy automatically manages TLS certificates (Let's Encrypt) — ensure DNS records point to the server
- PHP settings in Caddyfile should follow production security best practices
- Keep FrankenPHP binary updated for security patches
- Use environment variables for sensitive configuration (database passwords, API keys)

## Related Rules (from 05-rules.md)

- Use ZTS PHP Build for FrankenPHP
- Configure PHP Settings in Caddyfile, Not php.ini
- Validate Caddyfile Before Starting FrankenPHP

## Related Skills

- FrankenPHP Architecture Caddy/CGO/SAPI
- FrankenPHP Worker Thread Management
- FrankenPHP vs RoadRunner Comparison

## Success Criteria

- FrankenPHP installed and running
- Caddyfile configured correctly
- PHP requests served without errors
- Automatic HTTPS working (if domain configured)
- Installation documented for team
