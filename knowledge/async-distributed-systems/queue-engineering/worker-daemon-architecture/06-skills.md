# Skill: Configure and Run Laravel Queue Workers in Daemon Mode

## Purpose
Set up `queue:work` daemon workers for production, ensuring correct process management, recycling, and deployment integration.

## When To Use
When deploying any production Laravel queue worker. Always use daemon mode over `queue:listen`.

## When NOT To Use
Local development where per-job debugging is helpful (`queue:listen` may be acceptable); environments where `queue:listen` is explicitly needed.

## Prerequisites
- PHP process supervisor (Supervisor or systemd) configured
- Queue backend (Redis, SQS, database) set up
- `pcntl` extension installed for signal handling

## Inputs
- Queue connection name
- Queue names for priority ordering
- Worker configuration values (--sleep, --tries, --timeout, --max-jobs, --max-time, --memory)

## Workflow
1. Choose `queue:work` (not `queue:listen`) for all production workers
2. Construct command: `php artisan queue:work redis --queue=critical,default --sleep=3 --tries=3 --timeout=60 --max-jobs=500 --max-time=3600 --memory=256`
3. Add command to Supervisor or systemd configuration
4. Ensure process supervisor has `autorestart=true` or `Restart=always`
5. Add `php artisan queue:restart` to deployment script
6. Verify workers run and process jobs: `supervisorctl status`

## Validation Checklist
- [ ] Using `queue:work` not `queue:listen` in production
- [ ] Supervisor/systemd configured with autorestart
- [ ] `--max-jobs` and `--max-time` both set
- [ ] `--memory` limit configured
- [ ] `queue:restart` in deployment script
- [ ] Workers recycle at expected intervals
- [ ] Worker RSS stays within limits

## Common Failures
- Using `queue:listen` in production — 5-10x slower per job
- No process supervisor — worker exits on max-jobs, queue stops
- No recycling limits — memory grows unbounded, eventual OOM
- Workers run old code after deploy (no restart step)

## Decision Points
- For multi-queue priority: use `--queue=critical,default,low`
- For Horizon: use Horizon supervisor config instead of manual worker config

## Performance Considerations
- Daemon boots framework once vs listen boots per job — ~10x faster
- Memory accumulates over time — recycling mitigates this
- Boot overhead: ~50-200ms one-time vs per-job

## Security Considerations
- Workers run under a user account (never root)
- Old code vulnerability window minimized by automatic restart after deploy

## Related Rules
- Rule 1: Always Use queue:work Over queue:listen in Production
- Rule 2: Always Run Workers Under a Process Supervisor
- Rule 3: Set Both --max-jobs and --max-time for Defense in Depth
- Rule 4: Always Run queue:restart After Every Deploy

## Related Skills
- Configure Supervisor for Production Queue Workers
- Configure --max-jobs and --max-time for Worker Recycling
- Perform Zero-Downtime Queue Worker Restart on Deploy

## Success Criteria
Workers run in daemon mode under a process supervisor, recycle before memory becomes problematic, restart after deploy with new code, and maintain consistent throughput.
