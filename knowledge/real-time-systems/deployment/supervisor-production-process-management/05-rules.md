## Always Configure `stopwaitsecs` at 2x Reverb's Activity Timeout
---
## Reliability
---
Always set `stopwaitsecs` in Supervisor configuration to at least 2x the Reverb `activity_timeout` value.
---
`stopwaitsecs` controls the graceful shutdown window. If it's shorter than the activity timeout, Supervisor force-kills Reverb before clients have time to reconnect, causing mass disconnections.
---
```ini
stopwaitsecs=10  // Too short — force kills active connections
```
---
```ini
stopwaitsecs=60  // 2x default activity_timeout (30s) — graceful drain
```
---
Containerized deployments where orchestration handles lifecycle. No common exceptions for Supervisor-managed Reverb.
---
Mass disconnections; reconnection storms on every restart.

## Always Run Reverb as a Non-Root User
---
## Security
---
Always set `user=www-data` or a dedicated service user in Supervisor config for Reverb.
---
Running Reverb as root means any vulnerability in the WebSocket server grants full system access. A dedicated user limits the blast radius.
---
```ini
user=root  // Security risk — full system access on compromise
```
---
```ini
user=forge  // Dedicated user with limited permissions
```
---
Containerized deployments where the container runtime handles user isolation. No common exceptions for VM deployments.
---
Full system compromise if Reverb is exploited.

## Always Configure Log Rotation
---
## Maintainability
---
Always set `stdout_logfile_maxbytes` and `stdout_logfile_backups` to prevent unbounded log growth.
---
Without rotation, Reverb logs grow until they fill the disk, causing Reverb to crash and the server to become unstable.
---
```ini
stdout_logfile=/path/to/reverb.log  // No rotation — unbounded growth
```
---
```ini
stdout_logfile=/path/to/reverb.log
stdout_logfile_maxbytes=50MB
stdout_logfile_backups=10
```
---
Development environments. No common exceptions for production.
---
Disk full; Reverb crashes; server instability.

## Always Run `supervisorctl reread` and `supervisorctl update` After Config Changes
---
## Framework Usage
---
Always run both `supervisorctl reread` and `supervisorctl update` after modifying Supervisor configuration files.
---
Without `update`, new or modified configurations are not applied. Reverb continues running with the old configuration, and developers assume the change took effect.
---
```bash
# Only reread — update never applied
sudo supervisorctl reread
```
---
```bash
sudo supervisorctl reread
sudo supervisorctl update  // Config changes take effect
```
---
No common exceptions; both commands are required for configuration changes.
---
Configuration drift; unchanged behavior despite config changes.

## Always Use `process_name` Template for Multi-Instance Setups
---
## Maintainability
---
Always set `process_name=%(program_name)s_%(process_num)02d` when using `numprocs > 1`.
---
Without named processes, multiple Reverb instances are indistinguishable in monitoring, logs, and control commands, making per-instance management impossible.
---
```ini
numprocs=4  // Unnamed — cannot control individually
```
---
```ini
numprocs=4
process_name=%(program_name)s_%(process_num)02d
// Manage individually: supervisorctl restart reverb:reverb_02
```
---
Single-instance configurations. No common exceptions for multi-instance.
```
---
Inability to restart individual instances; confusing logs.

## Always Set `startretries` with a Cap
---
## Reliability
---
Always configure a maximum retry limit to prevent infinite restart loops on persistent crashes.
---
Without a retry cap, Supervisor restarts Reverb indefinitely after a crash, even if the underlying issue (OOM, config error, port conflict) requires manual intervention. This fills logs and delays detection.
---
```ini
startretries=0  // Unlimited — infinite restart loop
```
---
```ini
startretries=3  // Cap — alerts trigger after 3 failures
```
---
No common exceptions; capped retries prevent infinite loops.
---
Silent infinite restart loops; delayed failure detection; log flooding.
