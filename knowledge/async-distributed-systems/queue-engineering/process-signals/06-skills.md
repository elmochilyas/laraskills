# Skill: Manage Queue Workers with Process Signals

## Purpose
Use POSIX signals (SIGTERM, SIGUSR2, SIGCONT) and `pcntl` extension to gracefully start, stop, pause, and resume queue workers without losing jobs.

## When To Use
When manually managing workers, debugging shutdown behavior, configuring deployment scripts, or setting up Horizon worker management.

## When NOT To Use
On Windows (pcntl unavailable); use `queue:restart` for multi-server scenarios instead of per-server signals.

## Prerequisites
- PHP `pcntl` extension installed on worker servers
- Supervisor/systemd configured for worker management
- Understanding of worker daemon loop

## Inputs
- Worker PID(s) to signal
- Desired action (stop, pause, resume, restart)

## Workflow
1. Verify pcntl installed: `php -m | grep pcntl`
2. For graceful stop: `kill -15 <pid>` (SIGTERM) — worker finishes current job, exits
3. For immediate stop (unresponsive): `kill -3 <pid>` (SIGQUIT)
4. For pause: `kill -12 <pid>` (SIGUSR2) — stops popping new jobs, finishes current
5. For resume: `kill -18 <pid>` (SIGCONT)
6. For multi-server restart: `php artisan queue:restart` (cache-based)
7. Never use `kill -9` (SIGKILL) — forces immediate death, job lost

## Validation Checklist
- [ ] `pcntl` extension installed on all worker servers
- [ ] SIGTERM (not SIGKILL) used for routine shutdowns
- [ ] `queue:restart` is preferred over manual signals for multi-server
- [ ] Worker stops gracefully (finishes current job) on SIGTERM
- [ ] Worker SIGUSR2 pauses correctly
- [ ] Worker SIGCONT resumes correctly
- [ ] Supervisor `stopwaitsecs` set above max job runtime (safety net)

## Common Failures
- `pcntl` not installed — signals silently ignored, SIGTERM has no effect
- Using SIGKILL as default — job lost mid-processing
- `stopwaitsecs` too short — Supervisor sends SIGKILL before worker finishes job

## Decision Points
- SIGTERM for routine shutdown (deploy, maintenance)
- SIGUSR2 for temporary pause (backup, snapshot)
- `queue:restart` for coordinated multi-server restart

## Performance Considerations
- Signal dispatch called once per loop iteration — negligible overhead
- `--timeout` worker kill is not a signal — uses SIGALRM or proc_terminate

## Security Considerations
- SIGKILL leaves no cleanup opportunity — locks may remain held
- Without pcntl, workers ignore shutdown signals, forcing hard kills

## Related Rules
- Rule 1: Never Use SIGKILL (kill -9) on Workers
- Rule 2: Ensure pcntl Extension Is Installed on Worker Servers
- Rule 3: Use queue:restart for Multi-Server Restart

## Related Skills
- Configure Supervisor stopwaitsecs for Graceful Shutdown
- Perform Zero-Downtime Queue Worker Restart on Deploy

## Success Criteria
Workers respond correctly to SIGTERM (graceful stop), SIGUSR2/SIGCONT (pause/resume), and SIGQUIT (immediate stop) — no jobs lost, no zombie processes, and multi-server restarts are coordinated via `queue:restart`.
