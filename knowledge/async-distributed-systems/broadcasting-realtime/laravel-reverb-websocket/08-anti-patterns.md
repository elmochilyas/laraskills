---
Domain: Async & Distributed Systems
Subdomain: Broadcasting & Real-Time
Knowledge Unit: K031 — Laravel Reverb WebSocket Server
Knowledge ID: K031
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Running Reverb Without Supervisor | Operations | Critical |
| 2 | Not Increasing Open File Limits | Operations | High |
| 3 | Running Reverb on Same Server as PHP-FPM | Architecture | Medium |
| 4 | Scaling Reverb Without Load Balancing or Redis Pub/Sub | Architecture | Critical |
| 5 | Storing Session-Dependent Data in Reverb Memory | Design | High |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Unmanaged Reverb Process | Critical — crash drops all WebSocket connections permanently | Mandatory Supervisor config deployment checklist |
| Default ulimit Blindness | High — silent connection rejection before hitting other limits | Infrastructure-as-code with ulimit enforcement |
| No Redis for Multi-Process | Critical — clients on different processes isolated from each other | Pre-deployment check: Redis pub/sub enabled when >1 process |

---

## 1. Running Reverb Without Supervisor

### Category
Operations

### Description
Starting Reverb as a background process (`php artisan reverb:start &`) without a process manager like Supervisor. If Reverb crashes due to OOM, unhandled exception, or any fatal error, all WebSocket connections drop permanently until an operator manually restarts the process.

### Why It Happens
- Developer tests Reverb locally and starts it manually
- Production deployment scripts don't include Supervisor configuration
- Not understanding that Reverb is a long-lived process needing process management
- Assuming Reverb won't crash
- Copying development setup to production

### Warning Signs
- Reverb is started via cron job or init.d script (no auto-restart)
- Production server has `php artisan reverb:start &` in a startup script
- After Reverb crash, all WebSocket features are down until SSH intervention
- No monitoring for Reverb process health
- Uptime of Reverb is unknown — it restarts only on manual intervention

### Why Harmful
- A single unhandled exception disconnects ALL clients
- No automatic recovery — downtime lasts until an operator notices
- Real-time features silently broken — users see stale UI without reconnection
- Support tickets flood in before ops team knows about the crash
- Long-running processes inevitably crash (memory leaks, edge cases)

### Consequences
- Extended WebSocket downtime (manual recovery)
- All connected users lose real-time functionality
- Presence channel state reset on restart
- Emergency deployment to add Supervisor
- Business impact for real-time-dependent features

### Alternative
- Always run Reverb under Supervisor:
  ```ini
  [program:reverb]
  command=php /var/www/artisan reverb:start
  user=forge
  autostart=true
  autorestart=true
  startretries=3
  ```

### Refactoring Strategy
1. Create Supervisor configuration file for Reverb
2. Set `autostart=true` and `autorestart=true`
3. Set `numprocs` to match CPU core count
4. Reload Supervisor configuration
5. Verify with `supervisorctl status` — Reverb must show RUNNING
6. Test crash recovery: kill Reverb process and verify Supervisor restarts it

### Detection Checklist
- [ ] Supervisor config exists for Reverb
- [ ] `autorestart=true` is set
- [ ] `supervisorctl status` shows Reverb as RUNNING
- [ ] Kill test: process restarts automatically within 5 seconds
- [ ] No manual start commands in deployment scripts
- [ ] Process health monitoring configured

### Related Rules
- manage-reverb-under-supervisor

### Related Skills
- Deploy and Secure Laravel Reverb in Production

### Related Decision Trees
- Single vs Multi-Process Reverb Scaling

---

## 2. Not Increasing Open File Limits

### Category
Operations

### Description
Running Reverb with the default OS file descriptor limit (typically 1024 on Linux). Each WebSocket connection uses two file descriptors (one for the socket, one for the SSL/TLS context). At ~500 connections, Reverb hits the limit and rejects new connections with "too many open files" errors.

### Why It Happens
- Not knowing about file descriptor limits for WebSocket servers
- Server provisioning scripts don't configure ulimit
- Assuming default ulimit is sufficient for any workload
- Not monitoring file descriptor usage during load testing
- Setting ulimit in shell session instead of Supervisor config (doesn't apply to managed processes)

### Warning Signs
- Reverb logs show "too many open files" errors
- Connection count plateaus at ~500 regardless of capacity
- New WebSocket connections fail silently (no error on client)
- Production incident: "some users can't connect to real-time features"
- `lsof -p <reverb_pid> | wc -l` shows open file count at ulimit

### Why Harmful
- Hard connection cap that cannot be exceeded regardless of server resources
- Users randomly fail to connect when limit is reached
- No graceful degradation — connection failures are silent
- Capacity planning is impossible — hard limit isn't adjustable at runtime
- Wasted server resources (CPU, RAM) because connection cap prevents utilization

### Consequences
- Maximum concurrent users capped by ulimit, not server capacity
- Random connection failures under load
- User complaints about "real-time not working"
- Emergency server configuration change during incident
- Inaccurate capacity planning and scaling decisions

### Alternative
- Set file descriptor limit in Supervisor config (not shell ulimit):
  ```ini
  [program:reverb]
  minfds=65536
  ```
- Calculate required limit: `expected_connections * 2 + 1000`
- Monitor actual file descriptor usage in production

### Refactoring Strategy
1. Determine expected max concurrent connections
2. Calculate fd requirement: `connections * 2 + 1000`
3. Set `minfds` in Supervisor config to calculated value
4. Increase system-wide `fs.file-max` if needed
5. Verify with `supervisorctl` that process has correct limit
6. Test with connection load test to confirm no fd exhaustion

### Detection Checklist
- [ ] `minfds` set in Supervisor config (not just shell ulimit)
- [ ] Limit >= expected_connections * 2 + 1000
- [ ] Load test confirms no "too many open files" errors
- [ ] File descriptor usage is monitored
- [ ] System-wide `fs.file-max` is sufficient

### Related Rules
- set-ulimit-for-websockets

### Related Skills
- Deploy and Secure Laravel Reverb in Production

### Related Decision Trees
- Single vs Multi-Process Reverb Scaling

---

## 3. Running Reverb on Same Server as PHP-FPM

### Category
Architecture

### Description
Hosting Reverb WebSocket server on the same machine as PHP-FPM workers handling HTTP requests. WebSocket connections (long-lived, memory-intensive) compete with HTTP request processing for CPU, memory, and file descriptors.

### Why It Happens
- Cost saving — single server for everything
- Not understanding Reverb's resource profile (long-lived persistent connections)
- Development setup works fine, so production should too
- Convenience — one server to manage
- Assuming both PHP processes share resources peacefully

### Warning Signs
- PHP-FPM response latency increases when WebSocket connections grow
- Reverb memory pressure causes PHP-FPM OOM kills
- File descriptor limit shared between HTTP and WebSocket workloads
- CPU contention during peak traffic (HTTP requests + WebSocket messages overlap)
- Monitoring shows both services competing for resources

### Why Harmful
- WebSocket connections are long-lived — each consumes memory (~50-100KB) for the entire session
- HTTP requests are short-lived but CPU-intensive — they compete with Reverb's event loop
- File descriptors are shared between both — HTTP requests fail when WebSocket connections consume them
- Memory pressure from either service causes OOM kills on the other
- Performance of both HTTP and WebSocket degrades predictably under load

### Consequences
- HTTP response times spike during WebSocket connection bursts
- OOM kills affect both HTTP requests and WebSocket connections
- File descriptor exhaustion from combined workloads
- Hard to diagnose: "is the app slow or is the WebSocket server overloaded?"
- Scaling is coupled — cannot scale HTTP independently from WebSocket

### Alternative
- Dedicate separate servers for Reverb and PHP-FPM
- Or use different CPU core sets (cgroups, CPU pinning) for isolation on the same machine
- Monitor resource usage separately for each service
- Scale independently based on metrics

### Refactoring Strategy
1. Provision separate server(s) for Reverb
2. Configure Reverb listener to bind to the dedicated server's IP
3. Update broadcast configuration to point to the new Reverb server
4. Remove Reverb from the application server's process list
5. Update load balancer to route WebSocket traffic to Reverb servers
6. Verify WebSocket connections work and HTTP performance improves

### Detection Checklist
- [ ] Reverb runs on dedicated server(s) or isolated CPU/memory cgroup
- [ ] No resource contention between HTTP and WebSocket workloads
- [ ] PHP-FPM response times don't correlate with WebSocket connection count
- [ ] File descriptor usage is within limits for each service independently
- [ ] OOM kills don't affect both services

### Related Rules
- manage-reverb-under-supervisor

### Related Skills
- Deploy and Secure Laravel Reverb in Production

### Related Decision Trees
- Single vs Multi-Process Reverb Scaling

---

## 4. Scaling Reverb Without Load Balancing or Redis Pub/Sub

### Category
Architecture

### Description
Running multiple Reverb processes (for scaling) without a load balancer to distribute WebSocket connections and without Redis pub/sub to share state across processes. Clients connected to different processes cannot see each other's presence state or receive broadcasts from other processes.

### Why It Happens
- Starting Reverb processes manually without infrastructure setup
- Not understanding that each process has isolated in-memory state
- Assuming Reverb automatically coordinates across processes
- No load balancer in the infrastructure to handle WebSocket upgrade
- Redis pub/sub configuration is complex and skipped

### Warning Signs
- Multiple Reverb processes running but clients see incomplete presence lists
- User A connected to process 1 broadcasts an event — User B on process 2 never receives it
- Presence channel shows some online users but not others
- Load is unbalanced — one process has 800 connections, another has 200
- No load balancer in front of Reverb processes

### Why Harmful
- Multi-process deployment is effectively broken — isolation defeats scaling purpose
- Clients on different processes cannot communicate (no shared state)
- Presence channels show incorrect online user counts
- Broadcast events are delivered to a subset of subscribers
- Feature behavior depends on which process the client connects to

### Consequences
- Incomplete presence data — users appear offline to each other
- Missed broadcast events for clients on different processes
- Unbalanced load — some processes overloaded while others idle
- Hard to debug: feature works for some users but not others
- Scaling by adding processes doesn't improve reliability

### Alternative
- Always configure Redis pub/sub for multi-process Reverb:
  ```php
  // config/reverb.php
  'scaling' => [
      'enabled' => true,
      'channel' => 'reverb',
      'server' => ['host' => env('REDIS_HOST')],
  ],
  ```
- Place a load balancer (Nginx, HAProxy) that supports WebSocket upgrades in front of Reverb processes
- Ensure all processes share the same Redis instance

### Refactoring Strategy
1. Configure Redis pub/sub in `config/reverb.php`
2. Set up load balancer with WebSocket upgrade support
3. Stop all Reverb processes, start fresh with new config
4. Verify clients on different processes receive same broadcast events
5. Verify presence channels show complete user lists across processes
6. Monitor load distribution across processes

### Detection Checklist
- [ ] `scaling.enabled = true` in `config/reverb.php`
- [ ] Redis pub/sub configured with correct host
- [ ] Load balancer in front of Reverb processes
- [ ] Broadcast events delivered to all clients regardless of process
- [ ] Presence channels show complete user lists
- [ ] Connection load is balanced across processes

### Related Rules
- share-state-via-redis-multiprocess

### Related Skills
- Deploy and Secure Laravel Reverb in Production

### Related Decision Trees
- Single vs Multi-Process Reverb Scaling

---

## 5. Storing Session-Dependent Data in Reverb Memory

### Category
Design

### Description
Storing application state (user sessions, temporary data, feature flags) in Reverb process memory. Reverb state is per-process, in-memory, and lost on restart. Any state that must survive process restart or be shared across processes should live in Redis or another external store.

### Why It Happens
- Convenience — storing state in PHP memory is immediate and simple
- Not considering that Reverb processes can restart (crash, deploy, scaling event)
- Misunderstanding the Reverb architecture (each process has isolated memory)
- Assuming state stored during connection setup persists across the process lifetime
- Not separating runtime state from application data

### Warning Signs
- Application state stored in global PHP variables or static properties
- State resets when Reverb restarts (users logged out, features disabled)
- Different Reverb processes have different state (inconsistency)
- After deployment, all Reverb-managed state is reset
- State stored without considering process isolation

### Why Harmful
- State is lost on any process restart (deploy, crash, scaling)
- State is isolated per-process — clients on different processes see different state
- No recovery mechanism — state cannot be rehydrated
- Scales poorly — each new process starts with empty state
- Debugging is confusing — state appears only in one process

### Consequences
- User sessions lost on Reverb restart
- Inconsistent application behavior across different Reverb processes
- Feature state reset on every deployment
- Cannot scale processes up/down without losing state
- Emergency recovery requires manual state restoration

### Alternative
- Use Redis for any state that must survive restart or be shared:
  ```php
  Redis::set('user:123:status', 'online');
  Redis::expire('user:123:status', 3600);
  ```
- Use Laravel's cache system for temporary data
- Use databases for persistent data
- Design Reverb handlers to be stateless — read from external stores

### Refactoring Strategy
1. Identify all state stored in Reverb process memory
2. Categorize: session data → Redis, persistent data → database, ephemeral → remain in memory
3. Move non-ephemeral state to external stores
4. Update handlers to read/write from external stores
5. Test with process restart — verify state is preserved

### Detection Checklist
- [ ] No application state stored in Reverb process memory
- [ ] Session and user state stored in Redis or database
- [ ] Reverb process restart doesn't lose essential state
- [ ] All processes see consistent state (shared external store)
- [ ] Handlers are stateless — read from external stores

### Related Rules
- share-state-via-redis-multiprocess

### Related Skills
- Deploy and Secure Laravel Reverb in Production

### Related Decision Trees
- Single vs Multi-Process Reverb Scaling
