# Skill: Install and Configure Swoole with PHP Extension

## Purpose

Install the Swoole PHP extension, configure it for production, and verify the server is serving requests with coroutine support.

## When To Use

- Setting up Swoole for a new project
- Configuring Swoole for Laravel Octane
- Migrating from PHP-FPM to Swoole for high-I/O workloads

## When NOT To Use

- When RoadRunner or FrankenPHP is a better fit
- Without understanding Swoole's coroutine model
- On systems without C extension compilation capability

## Prerequisites

- PHP 8.0+ with pecl or source compilation capability
- Linux with required build tools (gcc, make, php-dev)
- Understanding of Swoole's architecture

## Inputs

- PHP version
- Swoole version to install
- Application configuration (workers, memory, coroutine settings)
- Laravel Octane version (if applicable)

## Workflow (numbered steps)

1. Install Swoole extension: `pecl install swoole` or compile from source
2. Enable the extension: `extension=swoole` in php.ini
3. Verify installation: `php -m | grep swoole` and `php -i | grep "swoole"`
4. Configure `server.php` or Swoole-specific settings (max_workers, reactor_num, worker_num, max_request)
5. For Laravel Octane: `php artisan octane:install --server=swoole`
6. Configure `config/octane.php` with Swoole-specific settings: `server` => `swoole`, `workers`, `max_requests`
7. Set Swoole-specific php.ini directives: `swoole.use_shortname=Off` (recommended for framework compatibility)
8. Enable coroutine hooks: `swoole.enable_coroutine=On`, `swoole.enable_preemptive_scheduler=On`
9. Start the server: `php artisan octane:start --server=swoole` or run the Swoole HTTP server script
10. Verify: access the application and check Swoole status

## Validation Checklist

- [ ] Swoole extension installed and enabled
- [ ] php -m shows swoole module loaded
- [ ] Swoole configuration applied (workers, max_requests)
- [ ] Coroutine hooks configured
- [ ] Octane: configured with --server=swoole
- [ ] Server starts without errors
- [ ] Application accessible via Swoole
- [ ] Configuration documented

## Common Failures

- **Missing build dependencies**: Swoole compilation requires php-dev, gcc, and other build tools
- **Coroutine hook conflicts**: Some PHP extensions are not coroutine-safe — test all extensions
- **swoole.use_shortname=On**: Short function names (go(), etc.) conflict with global namespace
- **Not enabling preemptive scheduler**: Long-running coroutines can block other coroutines without it
- **Missing opcache configuration**: Swoole requires OpCache for PHP file caching

## Decision Points

- pecl install: easiest for standard environments
- Source compile: needed for custom build options (io_uring, specific features)
- Laravel Octane: use `octane:install --server=swoole` for automatic configuration
- Docker: use the official Swoole Docker image or build with swoole extension
- Production: configure max_request (worker recycling) to prevent memory drift

## Performance Considerations

- Max workers (worker_num): CPU cores × 1-2 for CPU-bound, × 2-4 for I/O-bound
- Max requests (max_request): worker recycling frequency — 500-1000 recommended
- Reactor threads (reactor_num): typically CPU cores × 1-2
- Coroutine stack size: default 2MB — increase for deep call stacks
- io_uring: Swoole 5.0+ supports io_uring for async filesystem operations

## Security Considerations

- Swoole is a C extension — compile from trusted sources
- Swoole server should run as non-root user
- Configure `user` and `group` in Swoole server configuration
- Swoole's event loop exposes a larger attack surface than PHP-FPM
- Keep Swoole extension updated for security patches

## Related Rules (from 05-rules.md)

- Match Runtime Selection to Workload I/O Profile
- Run 24-Hour Soak Tests Before Production
- Never Migrate Without a Documented Rollback Plan

## Related Skills

- Swoole Architecture and Coroutine Model
- Swoole io_uring Integration
- Octane Installation and Configuration
- Worker Configuration by Driver

## Success Criteria

- Swoole extension installed and configured
- Coroutine hooks enabled
- Server starts and serves requests
- Octane: running with --server=swoole
- Configuration documented for team
