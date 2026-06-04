# Skill: Perform Zero-Downtime Queue Worker Restart on Deploy

## Purpose
Restart queue workers after deployment without losing jobs, using rolling restarts across servers for continuous processing.

## When To Use
Every deployment that changes application code processed by queue workers.

## When NOT To Use
Scheduled maintenance windows where complete processing halt is acceptable; development environments.

## Prerequisites
- Shared cache driver (Redis/Memcached) for `queue:restart` on multi-server
- Process supervisor (Supervisor/systemd) with `autorestart=true` configured
- Deployment script automation

## Inputs
- Number of worker servers
- Worker graceful shutdown duration (max job runtime)
- Deployment script framework

## Workflow
1. Add `php artisan queue:restart` as final step in deployment script
2. For multi-server: iterate servers with rolling delay
3. Wait for server's workers to finish current jobs before deploying next server
4. For Horizon: use `php artisan horizon:terminate` instead
5. Verify shared cache driver is Redis/Memcached (not file) for multi-server
6. Monitor queue depth during restart window to confirm capacity maintained

## Validation Checklist
- [ ] `queue:restart` or `horizon:terminate` in deployment script
- [ ] Workers restart and pick up new code
- [ ] No jobs lost during restart window
- [ ] Multi-server: rolling restart maintains N-1 capacity
- [ ] Cache driver is shared (Redis/Memcached) for multi-server
- [ ] Supervisor `autorestart=true` or systemd `Restart=always` configured

## Common Failures
- `queue:restart` with file cache on multi-server — only one server restarts
- `horizon:terminate` without Supervisor autorestart — Horizon stops permanently
- Deploying immediately without waiting for graceful shutdown — workers killed mid-job

## Decision Points
- For single-server: quick restart is fine; for multi-server: use rolling restart with sleep between servers equal to max job runtime

## Performance Considerations
- Workers may take up to max(`--timeout`, longest job) seconds to finish current job
- During rolling restart, capacity drops by 1/N per server
- `queue:restart` propagates within `--sleep` seconds (default 3)

## Security Considerations
- Workers running old code after deploy can process against new schema — data corruption risk
- Always run `queue:restart` after `migrate --force`

## Related Rules
- Rule 1: Always Restart Workers After Every Deploy
- Rule 2: Use Shared Cache for Multi-Server queue:restart
- Rule 3: Use Rolling Restart for Zero-Downtime Multi-Server Deploy

## Related Skills
- Configure Worker Daemon Architecture
- Configure Process Signals for Graceful Shutdown

## Success Criteria
Deploy completes, all workers restart with new code, zero jobs lost, queue depth normalizes within expected timeframe, and processing continues without interruption.
