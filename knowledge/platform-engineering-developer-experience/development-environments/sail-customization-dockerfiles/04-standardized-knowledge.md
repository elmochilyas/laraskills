# 04-Standardized Knowledge: Sail Customization (Dockerfiles)

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | development-environments |
| **Knowledge Unit** | sail-customization-dockerfiles |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-sail, docker-compose-for-laravel, devcontainer-configuration |
| **Framework/Language** | Laravel Sail, Docker, Dockerfile, PHP |

## Overview

Sail Customization via Dockerfiles extends Sail's PHP container to add custom system dependencies, PHP extensions, PHP ini overrides, and additional runtimes. `php artisan sail:publish` copies Docker build config (`docker/` directory) to project root. Edit Dockerfile (`docker/8.3/Dockerfile`), rebuild with `sail build --no-cache`. Essential for PHP extensions not included by default (gd, imagick, swoole, pcntl), custom system packages (wkhtmltopdf, Chrome), or non-standard ini settings.

## Core Concepts

- **sail:publish Command**: copies runtime Dockerfiles from Sail's stubs to `docker/` in project root
- **Runtime Dockerfiles**: per-PHP-version in `docker/<version>/Dockerfile` extending `php:<version>-fpm-alpine`
- **Supervisord Config**: `docker/supervisord.conf` for managing multiple processes (Horizon + PHP-FPM)
- **PHP Extension Installation**: `docker-php-ext-install` and `pecl install` in Dockerfile RUN commands
- **Multi-Runtime Support**: separate Dockerfiles per PHP version (8.0-8.4)

## When to Use

- Projects needing PHP extensions not in Sail's default (gd, imagick, swoole, pcntl, sodium)
- Custom system packages (wkhtmltopdf, Chrome Headless, LibreOffice)
- Non-standard php.ini settings (memory_limit, upload_max_filesize)
- Running additional processes (Horizon, Reverb) via Supervisord

## When NOT to Use

- Standard Sail needs (no customization required)
- Non-PHP service additions (add as separate Docker Compose service instead)
- When a different base image would be simpler

## Best Practices (WHY)

- **Don't modify vendor/sail directly**: changes overwritten on `composer update` — always use `sail:publish`
- **Chain RUN commands**: `RUN apk add --no-cache pkg1 pkg2 && docker-php-ext-install ext1 ext2` minimizes layers
- **Order by change frequency**: least-changed instructions first to maximize Docker layer caching
- **Use shared scripts for multi-version**: extract common install logic into a script for version parity
- **Rebuild after changes**: `sail build --no-cache` — the old image persists without explicit rebuild
- **Commit docker/ directory**: share customizations across the team via version control

## Architecture Guidelines

- Publish via `sail:publish` before any customization
- Add extensions after Sail's existing RUN instructions
- Use Alpine base for smaller images; Debian for packages with Alpine incompatibilities
- Build-time COPY for stable config; run-time volume mount for environment-specific settings

## Performance Considerations

- Build cache: reordering early instructions invalidates downstream caches
- Image size: each RUN adds a layer; chain commands with `&&`
- Alpine images: ~150MB vs Debian ~400MB
- Rebuild time: 1-5 minutes

## Security Considerations

- Development only — production images built separately (Forge/Docker CI)
- Published Dockerfiles don't auto-update with Sail security patches
- Compare with Sail's latest template periodically

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| Editing vendor/sail | Overwritten on update | Lost changes | Always sail:publish first |
| Not rebuilding after changes | Old image used | Changes don't apply | sail build --no-cache |
| Not chaining RUN commands | Each instruction = layer | Image bloat to 1GB+ | Use && to chain |
| Replacing entire Dockerfile | Removing Sail's essential setup | Broken container | Append to existing file |

## Anti-Patterns

- **Overloading the PHP container**: add non-PHP services as separate Docker Compose services
- **Unpublished customization**: modifying Sail's internal templates directly

## Examples

```dockerfile
# docker/8.3/Dockerfile - add extensions
RUN docker-php-ext-install pcntl gd
RUN pecl install swoole && docker-php-ext-enable swoole
RUN apk add --no-cache imagemagick wkhtmltopdf
```

## Related Topics

- laravel-sail — Sail overview
- docker-compose-for-laravel — Docker Compose service configuration
- php-version-management — PHP version selection

## AI Agent Notes

- Only publish when customization is needed; keep default Sail otherwise
- Use shared install script pattern for multi-version projects

## Verification

- [ ] `docker/` directory committed to VCS
- [ ] Dockerfile appends to existing, doesn't replace
- [ ] RUN commands chained with &&
- [ ] Rebuilt successfully (`sail build --no-cache`)
- [ ] New extensions/packages verified working
- [ ] Upstream Sail changes reviewed periodically
