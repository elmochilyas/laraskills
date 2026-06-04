# Skill: Configure Supervisor stopwaitsecs for Graceful Shutdown

## Purpose
Tune Supervisor's `stopwaitsecs`, `stopasgroup`, and `killasgroup` parameters so queue workers shut down gracefully without losing jobs.

## When To Use
When setting up or auditing Supervisor worker configurations for production queue deployments.

## When NOT To Use
Local development where job loss is acceptable or when using Horizon (which has its own process management).

## Prerequisites
- Supervisor installed and configured
- Knowledge of longest job runtime across all queued jobs
- Access to Supervisor configuration files

## Inputs
- Worker `--timeout` value from queue:work command
- Longest expected job execution time
- Worker process name

## Workflow
1. Identify longest job: `grep -r 'public \$timeout' app/Jobs/ | awk '{print $3}' | sort -rn | head -1`
2. Calculate `stopwaitsecs`: longest runtime + 10s buffer (minimum 70s for standard workers)
3. Edit Supervisor config: `sudo nano /etc/supervisor/conf.d/laravel-worker.conf`
4. Set `stopwaitsecs` to calculated value
5. Add `stopasgroup=true` and `killasgroup=true`
6. Verify `stopwaitsecs` > `--timeout` on the worker command
7. Reread Supervisor config: `sudo supervisorctl reread && sudo supervisorctl update`
8. Restart workers: `sudo supervisorctl restart laravel-worker:*`

## Validation Checklist
- [ ] `stopwaitsecs` is set above max job runtime + 10s buffer
- [ ] `stopasgroup=true` and `killasgroup=true` are present
- [ ] `stopwaitsecs` > worker `--timeout` value
- [ ] Config deployed to all worker servers
- [ ] `supervisorctl` shows workers running with updated config

## Common Failures
- Setting `stopwaitsecs` equal to `--timeout` — race condition on clock skew
- Forgetting `killasgroup=true` — subprocesses survive as zombies
- Not deploying config changes to all servers in a multi-server setup

## Decision Points
- If jobs have wildly variable runtimes (5s to 300s), set `stopwaitsecs` to 90th percentile + 30s or split jobs onto dedicated supervisors

## Performance Considerations
- Higher `stopwaitsecs` means longer shutdown delay before memory is freed
- No CPU cost — purely a wall-clock timer

## Security Considerations
- `stopasgroup=true` prevents orphaned subprocesses that could accumulate memory
- Run workers as non-root user via `user=forge` directive

## Related Rules
- Rule 1: Always Set stopwaitsecs Above Longest Job Runtime
- Rule 2: Always Configure stopasgroup and killasgroup
- Rule 3: Never Use Default stopwaitsecs in Production

## Related Skills
- Configure Supervisor for Queue Workers
- Configure Worker --timeout and retry_after

## Success Criteria
Supervisor sends SIGTERM, worker finishes its current job, exits cleanly — no SIGKILL, no lost jobs, no zombie subprocesses.
