# Skill: Install and Configure Octane for a Laravel Project

## Purpose
Install Laravel Octane, select the appropriate driver, configure worker count and max_requests, and set up the production environment (reverse proxy, health checks, CI compatibility testing).

## When To Use
- Setting up Laravel Octane for a new or existing project
- Migrating from PHP-FPM to Octane
- Reconfiguring Octane after driver change or infrastructure upgrade
- Setting up a staging environment for Octane benchmarking

## When NOT To Use
- When the application has known Octane-incompatible packages that cannot be resolved
- When the team has not audited service providers and static properties for Octane compatibility
- Without first establishing PHP-FPM baseline performance metrics to validate Octane's benefit
- For simple CRUD applications where PHP-FPM performance is already sufficient

## Prerequisites
- PHP 8.1+ application with Laravel 9.x or newer
- Composer installed
- Server with at least 1GB RAM (4GB+ recommended for production)
- PHP extensions: Ctype, JSON, Mbstring, OpenSSL, PDO, Tokenizer, XML (RoadRunner requires no additional extension; Swoole requires ext-swoole)
- For Swoole: PHP compiled with `--enable-zts` and `ext-swoole` installed
- For FrankenPHP: Go 1.21+ or pre-built binary
- For RoadRunner: `.rr.yaml` configuration (auto-generated)

## Inputs
- Server CPU core count and total RAM
- Desired Octane driver (RoadRunner default, Swoole, or FrankenPHP)
- PHP-FPM baseline metrics (RPS, p95, memory usage per request)
- Database and Redis connection pool limits
- Deployment environment requirements (reverse proxy, HTTPS, health checks)

## Workflow

### 1. Install Octane via Composer
- Run `composer require laravel/octane`
- Verify installation: `php artisan list | grep octane` — should show `octane:install`, `octane:start`, `octane:reload`, `octane:status`, `octane:test`, `octane:watch`

### 2. Run the Octane Installer
- Run `php artisan octane:install`
- Select the driver (RoadRunner, Swoole, or FrankenPHP)
- For RoadRunner: the installer downloads the `rr` binary automatically
- For FrankenPHP: the binary is bundled, no separate download needed
- For Swoole: ensure `ext-swoole` is installed and enabled — `php -m | grep swoole`
- Verify `config/octane.php` was created

### 3. Configure Worker Count
- Set `worker_num` in `config/octane.php` or pass `--workers=N` at start
- Start with 4 workers as a safe default for most servers
- Formula: `min(CPU_cores, total_RAM_GB * 12)` for RoadRunner/FrankenPHP (estimated 30-80MB RSS per worker)
- For Swoole with coroutines: start with `CPU_cores / 2` workers (each worker handles multiple concurrent requests)
- Tune after 48 hours of monitoring based on RSS and listen queue depth

### 4. Configure Max Requests
- Set `max_requests` in `config/octane.php` to 1000 (initial value)
- Monitor RSS growth per worker to tune: lower to 300-500 if RSS grows >10% per 100 requests
- Raise to 5000 if memory is stable and database connections are not exhausted
- Never set to 0 in production (unbounded memory drift)

### 5. Configure Production Reverse Proxy
- Bind Octane to `127.0.0.1` (localhost) only: `--host=127.0.0.1 --port=8000`
- Configure Nginx, Caddy, or cloud load balancer to proxy requests to Octane
- Configure SSL termination at the reverse proxy
- Configure rate limiting at the reverse proxy
- Configure static file serving at the reverse proxy (avoid PHP overhead for assets)

### 6. Set Up Health Check Endpoint
- Verify the built-in `/octane/health` endpoint is accessible
- Configure load balancer health checks to use this endpoint
- Set up monitoring alerts on health check failures
- Document the health check URL for operations team

### 7. Configure OpCache Preloading
- Create a preload script: `php artisan octane:install --preload`
- Configure `opcache.preload` and `opcache.preload_user` in `php.ini`
- Verify preloaded classes with `opcache_get_status()['preload_statistics']`

### 8. Add CI Compatibility Testing
- Add `php artisan octane:test` to the CI/CD pipeline
- Configure the pipeline to fail on any octane:test warning or error
- Run after every `composer update` and before production deployment

### 9. Create Production Start Command
- Document the exact `php artisan octane:start` command for production
- Include `--server`, `--host`, `--port`, `--workers`, `--max-requests`
- Add as a Supervisor or systemd service for automatic restart
- Never include `--watch` flag in production

### 10. Verify Full Installation
- Run `php artisan octane:start` in production mode
- Confirm `php artisan octane:status` shows expected worker count
- Run a smoke test: `curl http://127.0.0.1:8000/octane/health`
- Verify graceful reload: `php artisan octane:reload` — confirm no downtime

## Validation Checklist
- [ ] `composer require laravel/octane` installed and all commands available
- [ ] `config/octane.php` created with correct driver, worker count, and max_requests
- [ ] Worker count set to 4 initially (tuned after 48-hour monitoring)
- [ ] `max_requests` set to 1000 (never 0 in production)
- [ ] Octane bound to `127.0.0.1` behind reverse proxy (not exposed publicly)
- [ ] SSL termination configured at reverse proxy level
- [ ] `/octane/health` endpoint responding and monitored
- [ ] OpCache preloading configured and verified
- [ ] `php artisan octane:test` passing in CI pipeline
- [ ] Production start command documented in deployment runbook
- [ ] Supervisor/systemd service configured for auto-restart
- [ ] `--watch` flag NOT present in production configuration

## Common Failures

| Failure | Symptom | Root Cause | Mitigation |
|---------|---------|------------|------------|
| Connection refused | Unable to reach Octane | Port already in use or worker crashed | Check port availability, verify supervisor auto-restart |
| Workers crash on start | Process exits immediately | Incompatible PHP extension or syntax error | Run `php artisan octane:test`, check PHP error log |
| Memory exhausted immediately | RSS jumps to server limit | Too many workers for available RAM | Reduce worker count, calculate per-worker RSS budget |
| Health check failing intermittently | Load balancer marks server down | Worker exceeding max_requests or memory limit | Check max_requests, verify supervisor restart policy |
| `octane:test` fails in CI | Pipeline failure | New package introduces static property or singleton misuse | Audit the new package, fix incompatibility |

## Decision Points

| Decision | How To Decide |
|----------|---------------|
| RoadRunner vs Swoole vs FrankenPHP | Default to RoadRunner; choose Swoole for high-latency I/O (50ms+); choose FrankenPHP for single-binary ops simplicity |
| Worker count | Start at 4; increase if listen queue > 0 and RSS < 70% of budget; decrease if RSS > 80% of budget |
| max_requests value | Start at 1000; lower if RSS grows >10% per 100 requests; raise if stable for 48+ hours |
| With or without reverse proxy | Always with reverse proxy in production; bind to localhost only |
| --watch in production? | Never — development only |

## Performance Considerations
- 4 workers × 50MB RSS = 200MB baseline memory — ensure total server RAM > 4× this for overhead
- Each worker holds persistent DB connection — 4 workers × 1 connection = 4 concurrent DB connections minimum
- OpCache preloading reduces cold-start latency by 2-5ms per worker
- Setting `max_requests` too low (under 250) pays the 10-40ms bootstrap cost too frequently
- FrankenPHP single binary uses approximately 15-20MB additional memory for the embedded Caddy and Go runtime
- RoadRunner's `rr` binary adds approximately 10-15MB memory overhead

## Security Considerations
- Never bind Octane to `0.0.0.0` in production — always bind to `127.0.0.1` or a private network interface
- Always place Octane behind a reverse proxy for SSL termination, rate limiting, and HTTP attack protection
- Health check endpoints should not expose sensitive information about worker internals
- Swoole's coroutine model shares process memory — a code vulnerability in one coroutine can compromise all coroutines in the same worker
- RoadRunner provides process-level isolation — a crash or memory corruption in one worker does not affect others

## Related Rules

| Rule | File | Application |
|------|------|-------------|
| Run `php artisan octane:test` in CI/CD pipeline before every deployment | `05-rules.md:1` | Step 8: CI testing |
| Start with 4 workers and 1000 max_requests as default | `05-rules.md:26` | Steps 3, 4: worker and max_requests configuration |
| Always run Octane behind a reverse proxy in production | `05-rules.md:52` | Step 5: reverse proxy |
| Use --watch for development, never for production | `05-rules.md:76` | Step 9: production start command |

## Related Skills

| Skill | Relation |
|-------|----------|
| Audit and Adapt Laravel Application for Octane's Persistent Execution Model | Prerequisite — run before or alongside installation |
| Select the Optimal Octane Driver | Step 2: driver selection during install |
| Configure Octane Workers by Driver | Step 3: detailed worker configuration per driver |
| Perform FPM-to-Octane Migration | This skill is the first phase of the full migration |
| Benchmark Octane Performance Gain Estimation | Run after installation to measure improvement |
| Monitor and Debug Octane State Leaks | Used when health checks or soak tests detect issues |

## Success Criteria
- Octane server starts and runs with no fatal errors
- `php artisan octane:status` reports correct worker count
- Application responds to requests through reverse proxy with no errors
- `/octane/health` endpoint returns 200
- `php artisan octane:test` passes with zero warnings
- `php artisan octane:reload` completes without dropping in-flight requests
- OpCache preloading verified and reducing cold-start latency
- CI pipeline includes and passes `octane:test` on every build
