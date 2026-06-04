# Skill: Manage Queue Worker Memory Growth with Limits and Recycling

## Purpose
Configure `--memory`, `--max-jobs`, and `--max-time` to prevent worker OOM crashes and manage RSS growth in PHP daemon workers.

## When To Use
When setting up production workers, troubleshooting OOM kills, or auditing worker stability.

## When NOT To Use
Development environments with trivial jobs or CI pipelines with short-lived workers.

## Prerequisites
- Access to Supervisor or systemd configuration
- Monitoring access for worker RSS metrics
- Understanding of typical job memory footprint

## Inputs
- Worker RSS baseline (MB)
- RSS growth rate per job (MB)
- Available system memory
- Number of worker processes per server

## Workflow
1. Establish baseline: deploy worker with `--memory=0` (no limit), monitor RSS for 1 hour
2. Calculate per-job growth: watch `ps -o rss= -p <worker_pid>` after 10, 50, 100 jobs
3. Set `--memory` to 2x observed baseline + growth (e.g., baseline 40MB + 80MB growth = 240MB target)
4. Set `--max-jobs=500` and `--max-time=3600` as starting values
5. Tune down if memory budget is tight: calculate max jobs = (memory limit - baseline) / per-job-growth
6. Add `--memory` to Supervisor command: `php artisan queue:work redis --memory=256`
7. Configure separate Supervisor group for memory-intensive jobs with higher `--memory`

## Validation Checklist
- [ ] `--memory` limit set on all worker commands
- [ ] `--max-jobs` and `--max-time` both configured
- [ ] RSS monitored over full worker lifetime
- [ ] Memory-intensive jobs on dedicated supervisor with higher `--memory`
- [ ] `supervisorctl status` shows workers recycling at expected intervals

## Common Failures
- `memory_get_usage(false)` instead of `memory_get_usage(true)` — underestimates RSS
- Relying on GC alone — zend_mm doesn't return memory to OS
- Too-low `--memory` (default 128MB) causes OOM on moderately leaky jobs

## Decision Points
- If per-job growth > 5MB, investigate leak sources before tuning limits
- If worker restarts more often than every 15 minutes due to `--max-jobs`, increase the limit

## Performance Considerations
- Each restart costs ~50-200ms (PHP boot + Laravel boot)
- At 500 jobs/restart: ~0.02% overhead — negligible
- Restart resets RSS to baseline (~20MB)

## Security Considerations
- OOM-killed workers may leave locks held or state inconsistent
- Monitor for abnormal memory patterns indicating compromised code

## Related Rules
- Rule 1: Always Set --memory Limit on Workers
- Rule 2: Rely on Worker Recycling (--max-jobs/--max-time), Not GC
- Rule 3: Use memory_get_usage(true) When Monitoring Manually
- Rule 4: Dedicate Separate Supervisors for Memory-Intensive Jobs

## Related Skills
- Configure --max-jobs and --max-time for Worker Recycling
- Configure Worker Daemon Architecture

## Success Criteria
Workers run for their configured lifetime, RSS stays below `--memory` limit, workers recycle gracefully before OOM, and no job is interrupted by memory exhaustion.
