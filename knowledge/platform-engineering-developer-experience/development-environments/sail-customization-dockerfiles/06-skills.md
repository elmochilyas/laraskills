# Skill: Customize Sail with Dockerfiles

## Purpose
Publish and customize Sail's Dockerfiles to add PHP extensions, system dependencies, and runtime configuration beyond Sail's defaults.

## When To Use
- Projects needing PHP extensions not in Sail's default (gd, imagick, swoole, pcntl)
- Adding system packages (wkhtmltopdf, Chrome, Chromium)
- Custom PHP ini settings
- Multi-runtime setups (Supervisord for Horizon + PHP-FPM)

## When NOT To Use
- When default Sail configuration suffices
- Adding non-PHP services (use separate Docker Compose services instead)
- One-off experiments that don't need team-wide consistency

## Prerequisites
- Laravel Sail installed and running
- Basic Dockerfile knowledge
- Docker build experience

## Inputs
- Published files in `docker/` directory
- `docker/<php-version>/Dockerfile` — PHP container definition
- `docker/supervisord.conf` (optional) — process manager config

## Workflow

1. **Publish Sail Configuration:** Run `php artisan sail:publish` to copy runtime Dockerfiles to `docker/` directory. This creates `docker/8.3/Dockerfile`, `docker/supervisord.conf`, and related files.

2. **Edit Dockerfile:** Modify `docker/<php-version>/Dockerfile` to add:
   - System packages via `apk add` (Alpine-based images)
   - PHP extensions via `docker-php-ext-install` or `pecl install`
   - PHP ini overrides via `docker-php-ext-configure`

3. **Chain RUN Commands:** Use single `RUN` statements with `&&` to chain commands. This minimizes Docker image layers and reduces final image size.

4. **Order by Change Frequency:** Place least-changed instructions first (base dependencies) and most-changed instructions last (application-specific) to maximize Docker layer caching.

5. **Configure Supervisord (Optional):** Edit `docker/supervisord.conf` to run both PHP-FPM and Horizon (or other long-running processes) in the same container.

6. **Rebuild Image:** Run `sail build --no-cache` to rebuild the PHP image with customizations. Old image persists without rebuild.

7. **Commit docker/ Directory:** Commit the `docker/` directory to version control. This shares customizations across the team.

8. **Use Shared Scripts for Multi-Version:** If customizing multiple PHP versions (8.2, 8.3), extract common install logic into shared scripts for version parity.

## Validation Checklist

- [ ] `docker/` directory committed to version control
- [ ] Custom PHP extensions installed (`php -m | grep <extension>`)
- [ ] Custom system packages available
- [ ] PHP ini settings applied correctly
- [ ] Image builds without errors
- [ ] Application runs correctly with customizations
- [ ] Supervisord (if used) manages PHP-FPM + Horizon

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Modifying `vendor/sail` directly | Changes overwritten on `composer update`; always publish first |
| Not rebuilding after changes | Old image persists; changes not applied |
| Alpine package not found | Check Alpine repository for package name |
| Layer cache causing stale builds | Use `--no-cache` for fresh build |

## Decision Points

- **Use when projects need PHP extensions not in Sail's default** (gd, imagick, swoole, pcntl)
- **Add non-PHP services as separate Docker Compose services** — Don't overload the PHP container
- **Only publish when customization is needed** — Keep default Sail otherwise

## Performance/Security Considerations

- **Layer caching:** Order Dockerfile commands by change frequency to optimize build times
- **Image size:** Minimize layers and clean up temporary files in the same RUN statement
- **Multi-version support:** Maintain separate Dockerfiles per PHP version for isolation

## Related Rules

- SAILCUST-RULE-001: Don't modify vendor/sail directly
- SAILCUST-RULE-002: Chain RUN commands
- SAILCUST-RULE-003: Order by change frequency
- SAILCUST-RULE-004: Use shared scripts for multi-version
- SAILCUST-RULE-005: Rebuild after changes

## Related Skills

- Configure Laravel Sail
- Set Up Docker Compose for Laravel
- Configure Devcontainer for Laravel

## Success Criteria

- Custom PHP extensions and system packages available in Sail container
- Dockerfile changes shared across the team via version control
- Build process is automated and reproducible
- Customizations survive Sail package updates
