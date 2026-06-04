# Metadata

**Domain:** real-time-systems
**Subdomain:** deployment
**Knowledge Unit:** supervisor-production-process-management
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `numprocs` configured if multi-process needed
- [ ] `stopwaitsecs` set to at least 2x `activity_timeout`
- [ ] `supervisorctl reread && supervisorctl update` run after config changes
- [ ] Always Configure Log Rotation
- [ ] Always Configure stopwaitsecs at 2x Reverb's Activity Timeout
- [ ] Always Run Reverb as a Non-Root User
- [ ] Always Run supervisorctl reread and supervisorctl update After Config Changes
- [ ] Always Set startretries with a Cap
- [ ] `numprocs` configured if multi-process needed
- [ ] `process_name` template set for multi-instance
- [ ] `startretries` capped (e.g., 3)
- [ ] Configure `numprocs` and `process_name` template for multi-instance
- [ ] Create Supervisor config file: `/etc/supervisor/conf.d/reverb.conf`
- [ ] Monitor per-process memory for leak detection
- [ ] Graceful shutdown allows clients to reconnect before force-kill
- [ ] Individual Reverb instances can be restarted independently
- [ ] Logs rotate without filling disk

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Configure `numprocs` and `process_name` template for multi-instance
- [ ] Create Supervisor config file: `/etc/supervisor/conf.d/reverb.conf`
- [ ] Monitor per-process memory for leak detection
- [ ] Run `sudo supervisorctl reread && sudo supervisorctl update`
- [ ] Set `autostart=true` and `autorestart=true`
- [ ] Set `command` to `php /path/to/artisan reverb:start --host=127.0.0.1 --port=8080`
- [ ] Set `startretries` with cap (e.g., 3)
- [ ] Set `stopwaitsecs` to at least 2x Reverb's `activity_timeout`
- [ ] Set `user` to non-root user (e.g., `forge`, `www-data`)
- [ ] Set log rotation: `stdout_logfile_maxbytes=50MB`, `stdout_logfile_backups=10`
- [ ] Verify with `sudo supervisorctl status reverb:*`
- [ ] Always Configure Log Rotation

---

# Performance Checklist

- [ ] Log volume: `reverb:start` output can be verbose; configure log rotation or reduce log level
- [ ] Single Reverb process: single-threaded ReactPHP event loop; multiple instances via `numprocs` for parallel processing
- [ ] Startup delay on restart: Reverb initialization (app boot, Redis connection) adds latency before accepting connections

---

# Security Checklist

- [ ] Never run Reverb as rootâ€”use `www-data` or a dedicated user
- [ ] Supervisor config files may contain environment variables with secrets; keep file permissions restricted
- [ ] The Reverb process user should only have access to necessary files and directories
- [ ] Supervisor config files may contain environment variables with secrets; restrict file permissions to root

---

# Reliability Checklist

- [ ] Cannot restart individual Reverb
- [ ] Config changes not applied
- [ ] Disk fills from logs
- [ ] Infinite restart loop
- [ ] Mass disconnections on restart
- [ ] Reverb runs as root
- [ ] Always Configure Log Rotation
- [ ] Always Configure stopwaitsecs at 2x Reverb's Activity Timeout
- [ ] Always Run Reverb as a Non-Root User
- [ ] Always Run supervisorctl reread and supervisorctl update After Config Changes

---

# Testing Checklist

- [ ] `numprocs` configured if multi-process needed
- [ ] `process_name` template set for multi-instance
- [ ] `startretries` capped (e.g., 3)
- [ ] `stopwaitsecs` set to at least 2x `activity_timeout`
- [ ] `supervisorctl reread && supervisorctl update` run after config changes
- [ ] Graceful shutdown allows clients to reconnect before force-kill
- [ ] Individual Reverb instances can be restarted independently
- [ ] Log rotation configured (maxbytes, backups)
- [ ] Logs rotate without filling disk
- [ ] Reverb restarts automatically after crashes

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [stopwaitsecs Too Low (Force-Kill Without Drain)]
- [ ] [Running Reverb as Root]
- [ ] [No Log Rotation (Unbounded Log Growth)]
- [ ] [Forgetting supervisorctl update After Config Changes]
- [ ] [Unlimited startretries (Infinite Restart Loop)]
- [ ] Mixing Reverb logs with Laravel logs
- [ ] Monolithic Reverb process with all features
- [ ] Unlimited restart attempts

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Log volume from `reverb:start` can be verbose; configure rotation or reduce log level

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


