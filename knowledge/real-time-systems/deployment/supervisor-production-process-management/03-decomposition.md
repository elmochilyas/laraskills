# Decomposition: Supervisor Production Process Management

## Topic Overview
Supervisor is the standard process manager for keeping Reverb running as a daemon in production. It auto-starts Reverb on system boot, restarts it after crashes, and manages graceful shutdowns. Configuration is via INI-style `.conf` files in `/etc/supervisor/conf.d/`. Key directives include `command` (the reverb:start invocation), `autostart` (start on supervisor boot), `autorestart` (restart on crash), `user` (process owner), `numprocs` (number of instances), `stopwaitsecs` (grace period for...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
scaling-production-architecture/K27-supervisor-production-process-management/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Supervisor Production Process Management
- **Purpose:** Supervisor is the standard process manager for keeping Reverb running as a daemon in production. It auto-starts Reverb on system boot, restarts it after crashes, and manages graceful shutdowns. Configuration is via INI-style `.conf` files in `/etc/supervisor/conf.d/`. Key directives include `command` (the reverb:start invocation), `autostart` (start on supervisor boot), `autorestart` (restart on crash), `user` (process owner), `numprocs` (number of instances), `stopwaitsecs` (grace period for...
- **Difficulty:** Intermediate
- **Dependencies:
  - K03: Reverb Installation & Configuration
  - K32: Nginx WebSocket Proxy Configuration
  - K05: Reverb Connection Lifecycle & State Management
  - K33: Dedicated Reverb Fleet Architecture

## Dependency Graph
**Depends on:**
  - K03: Reverb Installation & Configuration
  - K32: Nginx WebSocket Proxy Configuration
  - K05: Reverb Connection Lifecycle & State Management
  - K33: Dedicated Reverb Fleet Architecture

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Daemon process management**: Reverb runs as a supervised daemon, not an interactive command**Multiple process instances**: `numprocs=2` with `process_name=%(program_name)s_%(process_num)02d` for multi-process on one server**Log management**: Supervisor rotates logs via `stdout_logfile_maxbytes` and `stdout_logfile_backups`**Graceful shutdown**: `stopwaitsecs` provides client reconnection window before force kill**Supervisor as default**: Documented standard in Laravel ecosystem; Forge uses it natively**systemd as alternative**: Available on modern Linux distributions; different configuration syntax**Docker entrypoint for containerized**: Docker deployments use entrypoint scripts rather than Supervisor internally**PHP process memory growth**: Long-running PHP processes may develop memory leaks over days/weeks; periodic restart via `startretries` counter**Single-threaded per process**: Each Supervisor-managed Reverb instance is a single-threaded ReactPHP event loop; multiple instances via `numprocs`**Startup delay on restart**: Reverb initialization (app boot, Redis connection) adds latency before accepting connections**Log volume**: `reverb:start` output can be verbose; configure log rotation or reduce log levelOne Reverb process per core is a reasonable starting point for multi-process setupsEach process maintains its own event loop and connection pool; total connection capacity scales with process countShared Redis/database backpressure affects all processes equallyMonitor per-process memory to detect leaks; restart individual processes rather than allSet `stopwaitsecs` to at least 2x the Reverb `activity_timeout` (e.g., 60s for default 30s timeout)Use `user=www-data` or the appropriate web server user for file permissionsConfigure `stdout_logfile` to write Reverb logs to a dedicated file (not mixed with Laravel logs)Set `stdout_logfile_maxbytes=50MB` and `stdout_logfile_backups=10` for log rotationUse `environment=ENV_VAR=value` to pass environment variables if not set globallyFor multiple instances, use `numprocs` with `process_name` template to differentiate logsMonitor Supervisor process status via `supervisorctl status` in health checksNot setting `stopwaitsecs` high enough (force kills Reverb, causing mass disconnections)Running Reverb as root (security risk; use `www-data` or dedicated user)Forgetting to run `supervisorctl reread && supervisorctl update` after config changesUsing the default `command` without `--host=127.0.0.1 --port=8080` (binds to all interfaces unnecessarily)Not configuring log rotation (logs grow unbounded and fill the disk)Setting `numprocs` without corresponding Reverb scaling configuration (multiple processes on one server with database driver need shared state)**Supervisor crash**: Supervisor itself crashes; all child processes become orphaned**Fatal error loop**: Reverb crashes immediately on start; `autorestart=true` creates infinite restart loop; `startretries` limits this**Memory exhaustion**: PHP memory limit hit after days of uptime; process killed by OOM killer**Log disk full**: Unbounded log growth fills disk; Reverb stops because it cannot write logs**Configuration syntax error**: INI syntax error prevents Supervisor from loading config; Reverb never startsStandard process manager for Laravel Forge deploymentsRequired for self-hosted Reverb on Ubuntu/Debian serversAlternative: systemd on RHEL/Fedora/CentOS; Docker health checks for containerizedUsed in conjunction with Nginx reverse proxy for complete Reverb production stackLaravel Cloud manages Reverb processes transparently (no Supervisor needed)K03: Reverb Installation & ConfigurationK32: Nginx WebSocket Proxy ConfigurationK05: Reverb Connection Lifecycle & State ManagementK33: Dedicated Reverb Fleet Architecture

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization