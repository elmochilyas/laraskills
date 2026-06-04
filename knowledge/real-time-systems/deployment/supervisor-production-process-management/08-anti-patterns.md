# ECC Anti-Patterns — Supervisor & Production Process Management

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Scaling & Production Architecture |
| **Knowledge Unit** | Supervisor & Production Process Management |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. stopwaitsecs Too Low (Force-Kill Without Drain)
2. Running Reverb as Root
3. No Log Rotation (Unbounded Log Growth)
4. Forgetting `supervisorctl update` After Config Changes
5. Unlimited startretries (Infinite Restart Loop)

---

## Repository-Wide Anti-Patterns

- God Services
- Hidden Database Queries

---

## Anti-Pattern 1: stopwaitsecs Too Low (Force-Kill Without Drain)

### Category
Reliability

### Description
Setting `stopwaitsecs` lower than Reverb's `activity_timeout` in Supervisor configuration, causing Supervisor to force-kill Reverb before clients can gracefully reconnect.

### Warning Signs
- `stopwaitsecs` set to default or < 30 seconds
- Mass disconnections on every Supervisor restart
- Reconnection storms after deployments
- Clients receive "connection closed" errors during restarts

### Why It Is Harmful
`stopwaitsecs` controls the time Supervisor waits for a process to stop before sending SIGKILL. If it's shorter than the time clients need to detect the disconnect and reconnect (typically related to `activity_timeout`), active connections are aborted. Clients are force-disconnected simultaneously, triggering a reconnection storm. The graceful drain window is too short for all clients to re-establish connections.

### Real-World Consequences
A Supervisor restart command `supervisorctl restart reverb:*` is run with `stopwaitsecs=10`. Reverb's `activity_timeout` is 30 seconds. Supervisor sends SIGTERM, waits 10 seconds, then sends SIGKILL. In 10 seconds, only 20% of 5000 clients can reconnect. The remaining 4000 are force-killed and all reconnect simultaneously, overwhelming the auth endpoint.

### Preferred Alternative
Set `stopwaitsecs` to at least 2x the Reverb `activity_timeout` value (e.g., 60 seconds for 30s timeout).

### Refactoring Strategy
1. Calculate: `stopwaitsecs = REVERB_ACTIVITY_TIMEOUT * 2`
2. Update Supervisor config with the calculated value
3. Run `supervisorctl reread && supervisorctl update`
4. Test by restarting Reverb and verifying graceful client disconnect

### Detection Checklist
- [ ] `stopwaitsecs` < `activity_timeout * 2`
- [ ] Mass disconnections on restart
- [ ] Reconnection storms after deployments

### Related Rules
- (Rule: Always configure stopwaitsecs at 2x Reverb's activity timeout)

---

## Anti-Pattern 2: Running Reverb as Root

### Category
Security

### Description
Setting `user=root` in Supervisor config for Reverb, giving the WebSocket server full system access and creating a severe security risk if the process is compromised.

### Warning Signs
- `user=root` in Reverb Supervisor config
- Reverb process owned by root
- WebSocket server has full filesystem access
- No dedicated user for Reverb process

### Why It Is Harmful
Running Reverb as root means any vulnerability in the WebSocket server (memory corruption, deserialization exploit, path traversal) grants the attacker full system access. They can read any file, install malware, modify system configuration, and pivot to other infrastructure. Even without a specific exploit, misconfiguration (wrong log path, incorrect file permissions) can affect the entire system.

### Real-World Consequences
CVE-2026-23524 (Reverb Redis deserialization) allows an attacker to execute arbitrary code on the Reverb process. Because Reverb runs as root, the attacker gains root access to the server. They exfiltrate the `.env` file with all database credentials, API keys, and secrets — compromising the entire application and its dependencies.

### Preferred Alternative
Run Reverb as a non-root user (`www-data`, `forge`, or a dedicated service user).

### Refactoring Strategy
1. Create a dedicated user: `sudo useradd -r -s /bin/false reverb`
2. Set `user=reverb` in Supervisor config
3. Ensure the user has read access to the Laravel application directory
4. Ensure the user has write access to log files
5. Restart Reverb as the new user

### Detection Checklist
- [ ] `user=root` in Supervisor config
- [ ] Reverb process owned by root
- [ ] No dedicated service user for WebSocket process

### Related Rules
- (Rule: Always run Reverb as a non-root user)

---

## Anti-Pattern 3: No Log Rotation (Unbounded Log Growth)

### Category
Maintainability

### Description
Configuring Reverb's Supervisor stdout log without `stdout_logfile_maxbytes` and `stdout_logfile_backups`, allowing the log file to grow unbounded until it fills the disk.

### Warning Signs
- Reverb log file grows to gigabytes
- No `stdout_logfile_maxbytes` in Supervisor config
- No `stdout_logfile_backups` configured
- Disk usage grows over time from log files
- Supervisor stops writing logs when disk is full

### Why It Is Harmful
Reverb's output (especially in debug mode) can produce significant log volume. Without rotation, the log file grows until it consumes all available disk space. When the disk is full, Reverb cannot write to its log, the operating system may fail to create temporary files, and the Reverb process may crash. Disk-full scenarios also affect the Laravel application sharing the same filesystem.

### Real-World Consequences
A team deploys Reverb with debug logging enabled during a troubleshooting session and forgets to disable it. Over 2 weeks, the log file grows to 30GB. The server's 40GB root partition reaches 95% capacity. The Laravel application can no longer write log files or cache files. The entire application goes down — not because of a code error, but because of full disk from unrotated logs.

### Preferred Alternative
Set `stdout_logfile_maxbytes=50MB` and `stdout_logfile_backups=10` to enable automatic rotation.

### Refactoring Strategy
1. Add `stdout_logfile_maxbytes=50MB` to Supervisor config
2. Add `stdout_logfile_backups=10` to keep 10 rotated copies
3. Optionally reduce log level: `environment=APP_LOG_LEVEL=warning`
4. Run `supervisorctl reread && supervisorctl update`
5. Verify log rotation by checking that old log files exist as `reverb.log.1`, `reverb.log.2`, etc.

### Detection Checklist
- [ ] No log rotation configured
- [ ] Log file grows without bounds
- [ ] Disk usage increases from Reverb logs

### Related Rules
- (Rule: Always configure log rotation)

---

## Anti-Pattern 4: Forgetting `supervisorctl update` After Config Changes

### Category
Framework Usage

### Description
Running only `supervisorctl reread` after modifying Supervisor configuration without running `supervisorctl update`, causing the new configuration to never take effect.

### Warning Signs
- Configuration changes made but behavior unchanged
- Only `supervisorctl reread` documented in runbook
- `supervisorctl update` not included in deploy scripts
- Supervisor status shows old configuration

### Why It Is Harmful
`supervisorctl reread` tells Supervisor to scan the configuration directory for changes but does NOT apply them. The new configuration is marked as "available" but not "active." Only `supervisorctl update` applies the changes, restarting affected processes. Without `update`, teams believe they have fixed a configuration issue (like `stopwaitsecs` or `numprocs`) but the old values remain in effect.

### Real-World Consequences
A team increases `stopwaitsecs` from 10 to 60 in the Supervisor config file and runs `supervisorctl reread`. They see "reverb: updated" in the output and assume the change took effect. The next deployment causes mass disconnections because `stopwaitsecs` is still 10 — the config change was only read, never applied.

### Preferred Alternative
Always run both `sudo supervisorctl reread` and `sudo supervisorctl update` after configuration changes.

### Refactoring Strategy
1. Add both commands to deployment scripts: `sudo supervisorctl reread && sudo supervisorctl update`
2. Verify with `sudo supervisorctl status reverb:*` that the change is reflected
3. Document the requirement for both commands in runbooks

### Detection Checklist
- [ ] Only `reread` run without `update`
- [ ] Configuration changes not taking effect
- [ ] Old values still reflected in Supervisor status

### Related Rules
- (Rule: Always run both `supervisorctl reread` and `update`)

---

## Anti-Pattern 5: Unlimited startretries (Infinite Restart Loop)

### Category
Reliability

### Description
Setting `startretries=0` (unlimited) in Supervisor config, causing Supervisor to restart Reverb indefinitely after crashes and preventing detection of persistent failures.

### Warning Signs
- `startretries=0` in Supervisor config
- Reverb enters a crash-restart loop after a persistent error
- Logs fill with repeated crash entries
- Alerts don't trigger because process is "running" (restarting)
- Underlying issue (OOM, config error) goes undetected

### Why It Is Harmful
Unlimited retries mask persistent failures. If Reverb crashes because of a port conflict, OOM kill, or configuration error, Supervisor restarts it every `startretries` interval. The process appears "running" in monitoring (it starts, crashes, restarts). The underlying issue goes undetected because the process never stays in a stopped state long enough to trigger alerts. System resources are wasted on repeated failed start attempts.

### Real-World Consequences
A port conflict occurs after a system update — port 8080 is now used by another service. Reverb starts, crashes because the port is taken, and Supervisor restarts it every 5 seconds. This continues for 3 days. The `reverb.log` file grows to 5GB with crash logs. The team is unaware because monitoring shows "reverb is running" (it starts briefly between crashes). Only when a user reports WebSocket features not working does the team investigate.

### Preferred Alternative
Set a reasonable retry cap (e.g., `startretries=3`) and configure alerts for processes in FATAL state.

### Refactoring Strategy
1. Set `startretries=3` in Supervisor config
2. Configure monitoring to alert on processes entering FATAL state
3. Set up log monitoring for crash patterns
4. Run `supervisorctl reread && supervisorctl update`

### Detection Checklist
- [ ] `startretries=0` configured
- [ ] Reverb crashes and restarts silently
- [ ] Persistent failures go undetected

### Related Rules
- (Rule: Always set startretries with a cap)
