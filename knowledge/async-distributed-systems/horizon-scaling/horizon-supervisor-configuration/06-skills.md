# Skill: Configure Horizon Supervisors for Queue Workers

## Purpose
Define environment-specific Horizon supervisors in `config/horizon.php` with per-queue worker counts, balancing strategies, retry/timeout limits, and memory constraints.

## When To Use
Managing queue workers at scale across multiple environments; teams wanting version-controlled worker topology; apps with distinct job types needing different worker configurations.

## When NOT To Use
Simple single-server apps (`queue:work` with Supervisor is simpler); non-Laravel apps; environments without Redis.

## Prerequisites
- Horizon installed (`laravel/horizon`)
- Redis configured for queue and Horizon coordination

## Inputs
- Queue names and their resource requirements
- Expected job volume per queue
- Server CPU/RAM constraints

## Workflow
1. Define supervisors in `config/horizon.php` under each environment
2. Use one supervisor per queue type with tuned config (timeout, tries, nice)
3. Set `minProcesses >= 1` and `maxProcesses` based on available RAM (~40MB/worker)
4. Set `maxJobs` (e.g., 500) and `maxTime` (e.g., 3600) on all supervisors
5. Add `horizon:terminate` to deployment script for graceful restart
6. Use `nice` for CPU priority isolation (0 for interactive, 19 for batch)
7. Configure environment mapping for production, staging, local

## Validation Checklist
- [ ] One supervisor per queue type (not one giant supervisor)
- [ ] `maxJobs` and `maxTime` set on all supervisors
- [ ] `minProcesses >= 1` for each supervisor
- [ ] `maxProcesses` based on available RAM
- [ ] Environment mapping covers all deployment environments
- [ ] `horizon:terminate` in deployment script
- [ ] `nice` configured for priority isolation
- [ ] Total workers within server capacity

## Common Failures
- Missing environment config — Horizon refuses to start
- Too many supervisors × minProcesses — oversubscription
- `balance: false` without `processes` — configuration error
- No `horizon:terminate` in deploy — workers run old code indefinitely

## Decision Points
- Bursty webhooks: `balance: auto`, `minProcesses: 2`, `maxProcesses: 10`
- Steady emails: `balance: simple`, `minProcesses: 1`, `maxProcesses: 5`
- SLA-critical: `balance: false` with dedicated `processes`

## Related Rules
- Rule 1: set-max-jobs-and-max-time
- Rule 2: isolate-queue-types-in-supervisors
- Rule 3: add-horizon-terminate-to-deploy
- Rule 4: use-nice-for-cpu-priority

## Related Skills
- Tune Auto Balancing with `time` Strategy
- Configure Simple and No Balancing Modes
- Deploy Multi-Server Horizon

## Success Criteria
Each queue type has a dedicated supervisor with tuned config, `maxJobs`/`maxTime` prevent memory leaks, `horizon:terminate` is in deployment scripts, and `nice` provides CPU priority isolation.
