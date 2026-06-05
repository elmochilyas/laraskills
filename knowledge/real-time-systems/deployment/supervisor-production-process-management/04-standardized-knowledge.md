# Standardized Knowledge: Supervisor & Production Process Management

## Metadata
| Field | Value |
|-------|-------|
| Domain | Real-Time Systems |
| Subdomain | Scaling & Production Architecture |
| Knowledge Unit ID | K27 |
| Title | Supervisor & Production Process Management |
| Difficulty | Intermediate |
| Dependencies | K03, K05, K33 |
| Related KUs | Nginx WebSocket proxy configuration |

## Overview
Supervisor is the standard process manager for keeping Reverb running as a daemon in production. It auto-starts Reverb on system boot, restarts it after crashes, and manages graceful shutdowns. Configuration uses INI-style `.conf` files in `/etc/supervisor/conf.d/`. Key directives include `command`, `autostart`, `autorestart`, `user`, `numprocs`, `stopwaitsecs`, and `stdout_logfile`. Supervisor integration is the default approach for Laravel Forge deployments.

## Core Concepts
- Laravel's `reverb:start` command is a long-running PHP process that stops when the SSH session ends or when it crashes
- Supervisor monitors the process and restarts it automatically; it also manages lifecycle during system reboots and deployments
- Multiple `numprocs` instances can run concurrently on the same server for multi-process Reverb setups
- `stopwaitsecs` controls the graceful shutdown window for connection draining

## When To Use
- Self-hosted Reverb on Ubuntu/Debian servers
- Laravel Forge deployments with Reverb enabled
- Any production Reverb deployment not using Laravel Cloud or container orchestration

## When NOT To Use
- Laravel Cloud (process management is handled transparently)
- Docker/Kubernetes deployments (orchestration handles lifecycle; Reverb runs as container entrypoint)
- Development environments (run `reverb:start` manually)

## Best Practices (Why)
- **Set `stopwaitsecs` to at least 2x the Reverb `activity_timeout`**: Provides clients time to reconnect before the process is forcefully killed (e.g., 60s for default 30s timeout)
- **Use `user=www-data` or dedicated user**: Running as root is a security risk; use the web server user or a dedicated service user
- **Configure log rotation**: `stdout_logfile_maxbytes=50MB` and `stdout_logfile_backups=10` prevent unbounded log growth filling the disk
- **Use `process_name` template for multi-instance**: `%(program_name)s_%(process_num)02d` differentiates logs per instance

## Architecture Guidelines
- One Reverb process per core as starting point for multi-process setups
- Each process maintains its own event loop and connection pool
- Shared Redis/database backpressure affects all processes equally
- Monitor per-process memory to detect leaks; restart individual processes rather than all

## Performance Considerations
- Single Reverb process: single-threaded ReactPHP event loop; multiple instances via `numprocs` for parallel processing
- Startup delay on restart: Reverb initialization (app boot, Redis connection) adds latency before accepting connections
- Log volume: `reverb:start` output can be verbose; configure log rotation or reduce log level

## Security Considerations
- Never run Reverb as root—use `www-data` or a dedicated user
- Supervisor config files may contain environment variables with secrets; keep file permissions restricted
- The Reverb process user should only have access to necessary files and directories

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| stopwaitsecs too low | Reverb force-killed without drain | Default config not tuned for WebSocket | Mass disconnections | Set to at least 2x activity_timeout |
| Running as root | Security risk if Reverb is compromised | Convenience over security | Full server compromise | Use www-data or dedicated user |
| Forgetting reread/update | Config changes not applied | Not running supervisorctl commands | Reverb continues with old config | Always run both commands after changes |
| No log rotation | Logs grow unbounded | Default config has no rotation | Disk fills, Reverb stops writing logs | Set maxbytes and backups |
| numprocs without scaling config | Multiple processes with database driver need shared state | Adding processes without architecture planning | State conflicts between processes | Configure scaling driver and sticky sessions |

## Anti-Patterns
- **Monolithic Reverb process with all features**: Each Supervisor-managed instance is single-threaded; use `numprocs` for multi-core utilization
- **Unlimited restart attempts**: `startretries` should have a cap to prevent infinite restart loops on persistent crashes
- **Mixing Reverb logs with Laravel logs**: Use dedicated `stdout_logfile` paths for separation

## Examples

### Supervisor Reverb configuration
```ini
[program:reverb]
command=php /home/forge/example.com/artisan reverb:start --host=127.0.0.1 --port=8080
user=forge
autostart=true
autorestart=true
numprocs=2
process_name=%(program_name)s_%(process_num)02d
stopwaitsecs=60
stdout_logfile=/home/forge/example.com/storage/logs/reverb.log
stdout_logfile_maxbytes=50MB
stdout_logfile_backups=10
redirect_stderr=true
environment=APP_ENV=production
```

### Supervisor commands
```bash
# Apply configuration changes
sudo supervisorctl reread
sudo supervisorctl update

# Check Reverb status
sudo supervisorctl status reverb:*

# Restart a single Reverb instance
sudo supervisorctl restart reverb:reverb_01

# Stop all Reverb instances gracefully
sudo supervisorctl stop reverb:*
```

## Related Topics
- K03: Reverb Installation & Configuration
- K32: Nginx WebSocket Proxy Configuration
- K05: Reverb Connection Lifecycle & State Management
- K33: Dedicated Reverb Fleet Architecture

## AI Agent Notes
- This KU is atomic—no further decomposition needed
- `stopwaitsecs` of 3600s in some Laravel guides is overly conservative; 60s is sufficient for most applications
- For containerized deployments (Docker/K8s), Reverb runs as the container entrypoint with orchestration handling lifecycle
- Laravel Cloud abstracts all process management, making Supervisor unnecessary

## Verification
- [ ] Supervisor config file created in `/etc/supervisor/conf.d/`
- [ ] `stopwaitsecs` set to at least 2x `activity_timeout`
- [ ] Reverb runs as non-root user
- [ ] Log rotation configured (maxbytes, backups)
- [ ] `supervisorctl reread && supervisorctl update` run after config changes
- [ ] `numprocs` configured if multi-process needed
- [ ] Reverb status monitored via health checks
