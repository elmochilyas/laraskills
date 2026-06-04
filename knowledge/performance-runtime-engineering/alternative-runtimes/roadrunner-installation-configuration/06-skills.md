# Skill: Install and Configure RoadRunner with .rr.yaml

## Purpose

Deploy RoadRunner by downloading the binary, creating the .rr.yaml configuration, and verifying the server is serving PHP requests.

## When To Use

- Setting up RoadRunner for a new project
- Configuring RoadRunner for Laravel Octane
- Migrating from PHP-FPM to RoadRunner

## When NOT To Use

- Without understanding alternative runtimes landscape
- When PHP-FPM is sufficient for the workload
- When the team lacks operational expertise for RoadRunner

## Prerequisites

- PHP 8.1+ installed
- Go binary or RoadRunner pre-built binary
- Application code deployed

## Inputs

- PHP version
- Application server configuration (workers, memory limits)
- Environment variables
- Service endpoints (database, Redis)

## Workflow (numbered steps)

1. Install RoadRunner: download from releases page or `composer require spiral/roadrunner:^2024` for Laravel
2. Create `.rr.yaml` configuration file in the project root
3. Configure `server` section: command to run PHP workers (e.g., `php public/index.php`)
4. Configure `http` section: address, port, middleware, and static file serving
5. Configure `rpc` section for management commands (optional)
6. For Laravel Octane: use `php artisan octane:start --server=roadrunner` instead of manual .rr.yaml
7. Configure worker pool: `pool.num_workers`, `pool.max_jobs`, `pool.supervisor`
8. Set environment variables: `env.APP_ENV=production`, `env.DATABASE_URL=...`
9. Start RoadRunner: `./rr serve` or `php artisan octane:start --server=roadrunner`
10. Verify: access the application via the configured address (default localhost:8080)

## Validation Checklist

- [ ] RoadRunner binary installed
- [ ] .rr.yaml configured (or Octane handles configuration)
- [ ] Worker pool settings configured
- [ ] Environment variables set
- [ ] RoadRunner starts without errors
- [ ] Application accessible via RoadRunner
- [ ] Logs checked for warnings
- [ ] Configuration documented

## Common Failures

- **Missing .rr.yaml**: RoadRunner requires a configuration file — not optional
- **Incorrect worker command**: The `server.command` must point to the correct PHP entry point
- **Not setting max_jobs**: Workers are never recycled — memory accumulates until OOM
- **Firewall blocking RPC port**: The RPC port (default 6001) must be accessible for management commands

## Decision Points

- Laravel Octane: use `octane:start --server=roadrunner` (simplest, handles .rr.yaml generation)
- Non-Laravel app: manual .rr.yaml configuration
- Development: enable `logs.mode = development` for verbose logging
- Production: configure supervisor/process manager for automatic restart
- Containerized: embed RoadRunner binary in the Docker image

## Performance Considerations

- Worker pool: `num_workers` determines concurrent PHP workers — set based on CPU cores and memory
- `max_jobs`: worker recycling after N jobs — prevents memory drift (similar to FPM pm.max_requests)
- Supervisor: automatically restarts workers that fail or exceed limits
- RPC: lightweight (JSON over TCP) — negligible overhead
- Static file serving: RoadRunner can serve static files (offload from workers)

## Security Considerations

- Run RoadRunner as non-root user
- .rr.yaml may contain environment variables — protect file permissions
- RPC port should not be publicly accessible
- Keep RoadRunner binary updated for security patches
- Use environment variables for sensitive configuration

## Related Rules (from 05-rules.md)

- Start with RoadRunner for Laravel Octane
- Run 24-Hour Soak Tests Before Production
- Never Migrate Without a Documented Rollback Plan

## Related Skills

- RoadRunner Architecture and Goridge
- RoadRunner Benchmark Performance
- Octane Installation and Configuration
- Worker Configuration by Driver

## Success Criteria

- RoadRunner installed and configured
- Application serving requests without errors
- Worker pool configured with appropriate limits
- Octane: running with `--server=roadrunner`
- Configuration documented for team
