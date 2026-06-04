# Metadata
Domain: Real-Time Systems
Subdomain: Scaling & Production Architecture
Knowledge Unit: Supervisor & Production Process Management
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Supervisor is the standard process manager for keeping Reverb running as a daemon in production. It auto-starts Reverb on system boot, restarts it after crashes, and manages graceful shutdowns. Configuration is via INI-style `.conf` files in `/etc/supervisor/conf.d/`. Key directives include `command` (the reverb:start invocation), `autostart` (start on supervisor boot), `autorestart` (restart on crash), `user` (process owner), `numprocs` (number of instances), `stopwaitsecs` (grace period for connection draining), and `stdout_logfile` (log output). Supervisor integration is the default approach for Laravel Forge deployments and is documented in the official Reverb deployment guide.

## Core Concepts
Laravel's `reverb:start` command is a long-running PHP process. Without a process manager, it stops when the SSH session ends (tty SIGHUP) or when it crashes (unhandled exception). Supervisor monitors the process and restarts it automatically. It also manages process lifecycle during system reboots and application deployments. Multiple `numprocs` instances can run concurrently on the same server for multi-process Reverb setups.

## Mental Models
Supervisor is a babysitter for long-running PHP processes. It starts the process when the server boots, watches that it stays running, restarts it if it misbehaves, and cleans up when told to stop.

## Internal Mechanics
Supervisor forks and monitors child processes. The `command` directive specifies the full command to run (`php /path/to/artisan reverb:start ...`). Supervisor monitors the child's PID; if the child exits unexpectedly, `autorestart=true` causes Supervisor to fork a new child. During `supervisorctl stop`, Supervisor sends SIGTERM to the child. The `stopwaitsecs` directive controls how long Supervisor waits for the child to exit gracefully before sending SIGKILL. For Reverb, `stopwaitsecs` should exceed the `activity_timeout` (default 30s) to allow connected clients time to reconnect before the process is forcefully killed.

## Patterns
- **Daemon process management**: Reverb runs as a supervised daemon, not an interactive command
- **Multiple process instances**: `numprocs=2` with `process_name=%(program_name)s_%(process_num)02d` for multi-process on one server
- **Log management**: Supervisor rotates logs via `stdout_logfile_maxbytes` and `stdout_logfile_backups`
- **Graceful shutdown**: `stopwaitsecs` provides client reconnection window before force kill

## Architectural Decisions
- **Supervisor as default**: Documented standard in Laravel ecosystem; Forge uses it natively
- **systemd as alternative**: Available on modern Linux distributions; different configuration syntax
- **Docker entrypoint for containerized**: Docker deployments use entrypoint scripts rather than Supervisor internally

## Tradeoffs
- **PHP process memory growth**: Long-running PHP processes may develop memory leaks over days/weeks; periodic restart via `startretries` counter
- **Single-threaded per process**: Each Supervisor-managed Reverb instance is a single-threaded ReactPHP event loop; multiple instances via `numprocs`
- **Startup delay on restart**: Reverb initialization (app boot, Redis connection) adds latency before accepting connections
- **Log volume**: `reverb:start` output can be verbose; configure log rotation or reduce log level

## Performance Considerations
- One Reverb process per core is a reasonable starting point for multi-process setups
- Each process maintains its own event loop and connection pool; total connection capacity scales with process count
- Shared Redis/database backpressure affects all processes equally
- Monitor per-process memory to detect leaks; restart individual processes rather than all

## Production Considerations
- Set `stopwaitsecs` to at least 2x the Reverb `activity_timeout` (e.g., 60s for default 30s timeout)
- Use `user=www-data` or the appropriate web server user for file permissions
- Configure `stdout_logfile` to write Reverb logs to a dedicated file (not mixed with Laravel logs)
- Set `stdout_logfile_maxbytes=50MB` and `stdout_logfile_backups=10` for log rotation
- Use `environment=ENV_VAR=value` to pass environment variables if not set globally
- For multiple instances, use `numprocs` with `process_name` template to differentiate logs
- Monitor Supervisor process status via `supervisorctl status` in health checks

## Common Mistakes
- Not setting `stopwaitsecs` high enough (force kills Reverb, causing mass disconnections)
- Running Reverb as root (security risk; use `www-data` or dedicated user)
- Forgetting to run `supervisorctl reread && supervisorctl update` after config changes
- Using the default `command` without `--host=127.0.0.1 --port=8080` (binds to all interfaces unnecessarily)
- Not configuring log rotation (logs grow unbounded and fill the disk)
- Setting `numprocs` without corresponding Reverb scaling configuration (multiple processes on one server with database driver need shared state)

## Failure Modes
- **Supervisor crash**: Supervisor itself crashes; all child processes become orphaned
- **Fatal error loop**: Reverb crashes immediately on start; `autorestart=true` creates infinite restart loop; `startretries` limits this
- **Memory exhaustion**: PHP memory limit hit after days of uptime; process killed by OOM killer
- **Log disk full**: Unbounded log growth fills disk; Reverb stops because it cannot write logs
- **Configuration syntax error**: INI syntax error prevents Supervisor from loading config; Reverb never starts

## Ecosystem Usage
- Standard process manager for Laravel Forge deployments
- Required for self-hosted Reverb on Ubuntu/Debian servers
- Alternative: systemd on RHEL/Fedora/CentOS; Docker health checks for containerized
- Used in conjunction with Nginx reverse proxy for complete Reverb production stack
- Laravel Cloud manages Reverb processes transparently (no Supervisor needed)

## Related Knowledge Units
- K03: Reverb Installation & Configuration
- K32: Nginx WebSocket Proxy Configuration
- K05: Reverb Connection Lifecycle & State Management
- K33: Dedicated Reverb Fleet Architecture

## Research Notes
Supervisor is the officially documented process manager for Reverb in the Laravel documentation. Forge generates Supervisor config automatically when Reverb is enabled on a server. The `stopwaitsecs` recommendation of 3600s in some Laravel Reverb deployment guides is overly conservative—60s is sufficient for most applications. For containerized deployments (Docker/K8s), Supervisor is typically not used; instead, Reverb runs as the container entrypoint and orchestration handles lifecycle management. Laravel Cloud abstracts all process management, making Supervisor configuration unnecessary.
