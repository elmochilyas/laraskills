# Skill: Manage Reverb with Supervisor for Production Process Management

## Purpose
Configure Supervisor to run Reverb as a production daemon with auto-start, crash recovery, graceful shutdown, log rotation, and multi-process support.

## When To Use
- Self-hosted Reverb on Ubuntu/Debian servers
- Laravel Forge deployments with Reverb enabled
- Any production Reverb deployment not using Laravel Cloud or container orchestration

## When NOT To Use
- Laravel Cloud (process management handled transparently)
- Docker/Kubernetes deployments (orchestration handles lifecycle)
- Development environments (run `reverb:start` manually)

## Prerequisites
- Supervisor installed on the server
- Reverb configured and testable via direct `artisan reverb:start`
- Non-root user for Reverb process (e.g., `forge`, `www-data`)

## Inputs
- Supervisor configuration file (`.conf`) in `/etc/supervisor/conf.d/`
- Reverb Artisan command with host/port arguments
- `activity_timeout` value from Reverb config for `stopwaitsecs` calculation
- Log file paths with rotation settings

## Workflow
1. Create Supervisor config file: `/etc/supervisor/conf.d/reverb.conf`
2. Set `command` to `php /path/to/artisan reverb:start --host=127.0.0.1 --port=8080`
3. Set `user` to non-root user (e.g., `forge`, `www-data`)
4. Set `autostart=true` and `autorestart=true`
5. Set `stopwaitsecs` to at least 2x Reverb's `activity_timeout`
6. Configure `numprocs` and `process_name` template for multi-instance
7. Set log rotation: `stdout_logfile_maxbytes=50MB`, `stdout_logfile_backups=10`
8. Set `startretries` with cap (e.g., 3)
9. Run `sudo supervisorctl reread && sudo supervisorctl update`
10. Verify with `sudo supervisorctl status reverb:*`
11. Monitor per-process memory for leak detection

## Validation Checklist
- [ ] Supervisor config file created in `/etc/supervisor/conf.d/`
- [ ] `stopwaitsecs` set to at least 2x `activity_timeout`
- [ ] Reverb runs as non-root user
- [ ] Log rotation configured (maxbytes, backups)
- [ ] `supervisorctl reread && supervisorctl update` run after config changes
- [ ] `numprocs` configured if multi-process needed
- [ ] `startretries` capped (e.g., 3)
- [ ] `process_name` template set for multi-instance

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Mass disconnections on restart | `stopwaitsecs` too short | Set to at least 2x `activity_timeout` |
| Reverb runs as root | `user` directive not set | Set `user=forge` or `www-data` |
| Disk fills from logs | No log rotation configured | Set `maxbytes` and `backups` |
| Config changes not applied | `supervisorctl update` not run | Run reread + update after changes |
| Cannot restart individual Reverb | No `process_name` template | Set `process_name=%(program_name)s_%(process_num)02d` |
| Infinite restart loop | `startretries` not capped | Set `startretries=3` |

## Decision Points
- **numprocs**: Start with 1 per CPU core; benchmark to determine optimal count
- **stopwaitsecs**: 60s for default 30s activity_timeout; increase proportionally for longer timeouts
- **Log file location**: Store in `storage/logs/` for Laravel-consistent log management

## Performance/Security Considerations
- Single Reverb process is single-threaded; use `numprocs` for multi-core utilization
- Never run Reverb as root — use `www-data` or a dedicated service user
- Supervisor config files may contain environment variables with secrets; restrict file permissions to root
- Log volume from `reverb:start` can be verbose; configure rotation or reduce log level

## Related Rules (from 05-rules.md)
- Always Configure `stopwaitsecs` at 2x Reverb's Activity Timeout
- Always Run Reverb as a Non-Root User
- Always Configure Log Rotation
- Always Run `supervisorctl reread` and `supervisorctl update` After Config Changes
- Always Use `process_name` Template for Multi-Instance Setups
- Always Set `startretries` with a Cap

## Related Skills
- Configure Nginx as a WebSocket Proxy for Reverb
- Deploy and Operate a Dedicated Reverb Fleet

## Success Criteria
- Reverb starts automatically on system boot
- Reverb restarts automatically after crashes
- Graceful shutdown allows clients to reconnect before force-kill
- Logs rotate without filling disk
- Individual Reverb instances can be restarted independently
- Supervisor does not enter infinite restart loops
