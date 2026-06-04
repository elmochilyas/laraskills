# systemd Service for Queue Workers — Checklist

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Worker Management
- **Knowledge Unit:** K060 — systemd Service for Queue Workers
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Linux server with systemd init system
- [ ] Familiar with systemd service unit files
- [ ] Know the difference between Supervisor and systemd for process management

## Implementation Checklist
- [ ] Service unit file created at `/etc/systemd/system/queue-worker@.service`
- [ ] `Restart=always` set (equivalent to Supervisor `autorestart=true`)
- [ ] `RestartSec=3s` set (prevents tight restart loops)
- [ ] `KillMode=mixed` set (clean subprocess handling)
- [ ] `User=forge` (or appropriate non-root user) set
- [ ] Template unit (`@`) used for multi-worker instances
- [ ] `After=network.target redis-server.service` set for dependency ordering

## Verification Checklist
- [ ] Worker starts correctly: `systemctl start queue-worker@1`
- [ ] Worker restarts after `--max-jobs`/`--max-time` exit
- [ ] Worker restarts on crash
- [ ] Journald logs captured: `journalctl -u queue-worker@1`
- [ ] Multiple instances run independently (`queue-worker@1`, `queue-worker@2`)
- [ ] Process group cleaned up on stop (no orphaned children)

## Security Checklist
- [ ] Workers run as non-root user (`User=forge`)
- [ ] `KillMode=mixed` prevents orphan processes
- [ ] Service file permissions restricted (root-owned, 644)

## Performance Checklist
- [ ] systemd overhead is negligible
- [ ] Each service = separate process, same memory as Supervisor-managed workers
- [ ] Journald `MaxUse` configured to prevent disk fill

## Production Readiness Checklist
- [ ] Service files version-controlled
- [ ] systemd daemon-reload run after unit file changes
- [ ] Enable on boot: `systemctl enable queue-worker@{1..N}`
- [ ] Monitoring on service status and restart count
- [ ] Log rotation configured for journald

## Common Mistakes to Avoid
- [ ] No `Restart=always` (worker exits on max-jobs — queue stops)
- [ ] `KillMode=process` (default) — child processes become orphans
- [ ] No `User=` set (worker runs as root — security risk)
- [ ] No `RestartSec` (default 0s — tight crash-restart loop on errors)
