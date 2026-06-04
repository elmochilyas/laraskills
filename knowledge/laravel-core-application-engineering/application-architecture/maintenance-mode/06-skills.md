# Skill: Execute Maintenance Mode Deployment

## Purpose
Execute a complete maintenance-mode deployment workflow: pause queue workers, enable maintenance mode with bypass secret, deploy code and migrations, rebuild caches, and bring the application back online.

## When To Use
- Deploying code changes that require database migrations
- Deploying changes that could break running requests (schema changes, configuration updates)
- Performing emergency maintenance or security patches
- Any deployment where partial availability is worse than complete downtime

## When NOT To Use
- Static asset updates (use versioned assets and cache busting)
- Configuration-only changes (use `config:cache` without full downtime)
- Single-instance bug fixes that don't affect running requests

## Prerequisites
- Server access (SSH, deployment tool, CI/CD pipeline)
- Understanding of the maintenance mode file-based mechanism
- Queue worker configuration (if applicable)
- Monitoring service IP addresses (for allowlist)

## Inputs
- Deployment script template
- Monitoring service IPs for bypass `--allow`
- Secret generation mechanism (e.g., `$(date +%s)`)

## Workflow
1. Pause queue workers: `php artisan horizon:pause` (or equivalent queue pause command)
2. Enable maintenance mode:

```bash
php artisan down \
    --retry=60 \
    --secret="deploy-$(date +%s)" \
    --allow=127.0.0.1 \
    --allow=<monitoring-ip-1> \
    --allow=<monitoring-ip-2>
```

3. Deploy code: `git pull origin main` and `composer install --no-dev --optimize-autoloader`
4. Run database migrations: `php artisan migrate --force`
5. Rebuild caches:
   - `php artisan config:cache`
   - `php artisan route:cache`
   - `php artisan view:cache`
   - `php artisan event:cache`
6. Bring application back online: `php artisan up`
7. Resume queue workers: `php artisan horizon:continue`

## Validation Checklist
- [ ] Queue workers are paused before enabling maintenance mode
- [ ] `php artisan down` includes `--secret` with a unique value
- [ ] Monitoring IPs are included in `--allow` to prevent false alerts
- [ ] `composer install` runs with `--no-dev --optimize-autoloader`
- [ ] `php artisan migrate --force` succeeds
- [ ] All caches are rebuilt after deployment
- [ ] `php artisan up` is the last step (with fallback in failure path)
- [ ] Queue workers are resumed after bringing the app online
- [ ] Bypass URL is shared with the team for deployment verification
- [ ] Deployment script includes error handling (always calls `php artisan up` on failure)

## Common Failures
- Forgetting `php artisan up` — application stays down until manual intervention (automate with error handling)
- Not using `--secret` — team cannot verify deployment without bringing the app online
- Deploying with active queue workers — running jobs fail due to code changes
- Not adding monitoring IPs to `--allow` — monitoring services trigger false alerts
- Skipping cache rebuild — application uses stale configuration and routes
- Manual per-server maintenance in multi-server setup — inconsistent user experience

## Decision Points
- File-based vs database-based maintenance? Laravel's file-based approach is preferred (avoids circular dependency on database)
- Secret URL vs IP allowlist for team access? Use secret URL for dynamic access; IP allowlist for monitoring and CI/CD
- Coordinate with load balancer? In multi-server setups, orchestrate the `down`/`up` across all servers simultaneously

## Performance Considerations
- Maintenance mode checking adds a <0.01ms filesystem stat call per request — negligible
- When maintenance mode is active, the application returns 503 immediately — actually faster than normal operation
- Multi-server orchestration adds deployment-time coordination but no per-request overhead

## Security Considerations
- The bypass secret URL is unauthenticated — treat it like a password; generate unique secrets per deployment
- The `laravel_maintenance` cookie is encrypted and session-scoped — cannot be forged or reused
- `--allow` with CIDR notation is evaluated per request — avoid overly broad allowlists
- Security middleware (auth, rate limiting) still runs for bypassed requests
- `storage/framework/down` file must not be web-accessible

## Related Rules
- Always Use --secret for Deployment Bypass (05-rules.md)
- Automate php artisan up in Deployment Scripts (05-rules.md)
- Add Monitoring IPs to --allow (05-rules.md)
- Coordinate Maintenance Mode with Queue Drain (05-rules.md)
- Customize the Maintenance View (05-rules.md)
- Never Use Maintenance Mode for Partial or Static Updates (05-rules.md)
- Use Orchestration for Multi-Server Deployments (05-rules.md)

## Related Skills
- Skill: Configure Deployment Pipeline
- Skill: Configure Middleware Pipeline via Kernel

## Success Criteria
- Maintenance mode is enabled with bypass secret and monitoring allowlist
- Queue workers are paused before and resumed after the deployment
- All deployment steps (code, migrations, caches) execute successfully
- `php artisan up` is called after deployment (or on failure)
- Deployment verification is possible via the bypass URL
- Monitoring services do not trigger false alerts during maintenance
