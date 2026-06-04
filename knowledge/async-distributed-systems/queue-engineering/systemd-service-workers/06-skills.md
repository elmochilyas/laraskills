# Skill: Configure systemd Service Units for Queue Workers

## Purpose
Set up systemd service units to manage queue worker lifecycle as an alternative to Supervisor, including template units for multi-worker setups.

## When To Use
When ops team prefers systemd over Supervisor, on smaller deployments (1-2 servers), or to avoid adding Supervisor as a package dependency.

## When NOT To Use
When Horizon is used (Horizon manages its own processes); when you need Supervisor's `numprocs` process groups; when fine-grained process group management is needed.

## Prerequisites
- sudo/root access on worker servers
- systemd available (modern Linux distributions)
- PHP and Laravel installed

## Inputs
- Number of worker processes
- Queue worker command arguments (--queue, --sleep, --tries, --max-jobs, --max-time)
- Run-as user (e.g., forge)
- Worker name prefix

## Workflow
1. Create template unit: `sudo nano /etc/systemd/system/queue-worker@.service`
2. Add `[Unit]` section with `After=network.target redis-server.service`
3. Add `[Service]` with `Restart=always`, `RestartSec=3s`, `KillMode=mixed`, `User=`
4. Set `ExecStart` to `php artisan queue:work redis --sleep=3 --tries=3 --max-jobs=500 --max-time=3600`
5. Enable instances: `sudo systemctl enable queue-worker@1 queue-worker@2 queue-worker@3`
6. Start workers: `sudo systemctl start queue-worker@1 queue-worker@2 queue-worker@3`
7. Verify: `sudo systemctl status queue-worker@1`

## Validation Checklist
- [ ] `Restart=always` set in service unit
- [ ] `KillMode=mixed` configured
- [ ] `RestartSec=3s` set to prevent crash loops
- [ ] `User=` set to non-root user
- [ ] Template unit `@` syntax used for multi-worker
- [ ] Workers start and process jobs
- [ ] Journald logs available via `journalctl -u queue-worker@1`

## Common Failures
- No `Restart=always` — worker exits on max-jobs and never restarts
- `KillMode=process` (default) — child processes become orphans
- Running as root — security risk
- No `RestartSec` — tight restart loop on persistent PHP error

## Decision Points
- Use template units for multi-worker (systemd lacks `numprocs`)
- For > 4 workers, use separate unit files for clarity

## Performance Considerations
- Overhead: negligible vs Supervisor
- Each service = separate process with same memory profile
- Journald logs: configure `MaxUse` to prevent disk fill

## Security Considerations
- Always set `User=` to non-root (e.g., forge, www-data)
- `KillMode=mixed` prevents orphaned subprocesses

## Related Rules
- Rule 1: Always Set Restart=always on Worker Service Units
- Rule 2: Set KillMode=mixed for Clean Subprocess Handling
- Rule 3: Use Template Units for Multi-Worker Setups
- Rule 4: Set RestartSec=3s to Prevent Crash Loops

## Related Skills
- Configure Supervisor for Queue Workers
- Configure --max-jobs and --max-time for Worker Recycling

## Success Criteria
Workers start on boot, restart after max-jobs/max-time exits, restart on crash with delay, all subprocesses are cleaned up on stop, and logs are accessible via journalctl.
