# Process Signals (SIGTERM, SIGQUIT, SIGUSR2, SIGCONT) — Checklist

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Worker Management
- **Knowledge Unit:** K057 — Process Signals
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand POSIX signal basics (SIGTERM, SIGQUIT, SIGUSR2, SIGCONT)
- [ ] `pcntl` PHP extension installed on production servers
- [ ] Familiar with Supervisor/systemd signal handling configuration

## Implementation Checklist
- [ ] SIGTERM used for graceful deployment shutdown (default Supervisor stop signal)
- [ ] SIGUSR2 used for temporary worker pause (Horizon backup/snapshot)
- [ ] `queue:restart` used for multi-server restart (cache-based broadcast)
- [ ] `stopwaitsecs` configured to exceed longest expected job runtime
- [ ] `pcntl` extension verified installed on all worker servers
- [ ] SIGKILL (kill -9) never used — always use SIGTERM first

## Verification Checklist
- [ ] Worker finishes current job on SIGTERM before exiting
- [ ] Worker pauses on SIGUSR2 (stops popping new jobs, completes current)
- [ ] Worker resumes on SIGCONT
- [ ] `queue:restart` signal received by workers across all servers
- [ ] Signal handling works correctly without `pcntl` (signals ignored gracefully)

## Security Checklist
- [ ] Signal sending restricted to authorized processes/scripts
- [ ] Supervisor configured to send signals as correct user
- [ ] No ability for unauthorized users to send signals to workers

## Performance Checklist
- [ ] Signal dispatch called once per loop iteration — negligible overhead
- [ ] Pause check adds a cache read per iteration
- [ ] `--timeout` kills process — no graceful cleanup for current job

## Production Readiness Checklist
- [ ] `stopwaitsecs` set to max job runtime + buffer
- [ ] `pcntl` extension installed on all production servers
- [ ] Windows environments accounted for (signals don't work)
- [ ] Monitoring on worker shutdown/restart events

## Common Mistakes to Avoid
- [ ] Assuming SIGTERM is immediate (shutdown takes as long as longest job)
- [ ] No `pcntl` extension (signals ignored — worker never stops gracefully)
- [ ] Using SIGKILL (kill -9) — job lost mid-processing, double-processing risk
