---
Domain: Async & Distributed Systems
Subdomain: Broadcasting & Real-Time
Knowledge Unit: K034 — Reverb Production Deployment
Knowledge ID: K034
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Direct Reverb Exposure to Internet | Security | Critical |
| 2 | Blocking the Event Loop | Performance | Critical |
| 3 | Setting ulimit via Shell Instead of Supervisor | Configuration | High |
| 4 | Using Default Nginx Timeouts for WebSocket | Configuration | High |
| 5 | Running Reverb Without Memory Monitoring | Operations | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| No Reverse Proxy | Critical — missing SSL, rate limiting, DDoS protection | Mandatory Nginx proxy in deployment checklist |
| Blocking I/O in Handlers | Critical — single sleep freezes ALL connections | Code review ban on blocking calls in Reverb handlers |
| Shell ulimit Misconfiguration | High — silent file descriptor exhaustion | Infrastructure-as-code with Supervisor `minfds` enforcement |

---

## 1. Direct Reverb Exposure to Internet

### Category
Security

### Description
Running Reverb on a public TCP port without a reverse proxy (Nginx) in front. Reverb directly handles WebSocket connections without SSL termination, rate limiting, DDoS protection, or connection management that a reverse proxy provides.

### Why It Happens
- Developer tests Reverb locally on port 8080 and deploys the same config
- Not understanding that Reverb should not handle TLS directly
- Convenience — fewer moving parts without Nginx
- Assumption that Reverb's built-in HTTP handling is sufficient for production
- Copying development setup to production without the proxy layer

### Warning Signs
- Reverb port (8080) is publicly accessible from the internet
- No Nginx config exists for WebSocket proxying
- WebSocket connections use `ws://` instead of `wss://`
- No rate limiting on WebSocket connections
- SSL certificate is configured in Reverb instead of Nginx

### Why Harmful
- No SSL termination — browsers reject insecure WebSocket on HTTPS pages
- No rate limiting — a single client can open thousands of connections and exhaust file descriptors
- No DDoS protection — connection flood directly hits the PHP process
- No IP filtering or access control at the network edge
- Reverb's internal HTTP endpoint is exposed to the public internet

### Consequences
- WebSocket connections blocked by browser security (ws:// on HTTPS page)
- Connection flood attacks exhaust file descriptors — all users disconnected
- No SSL — data transmitted in plaintext over WebSocket
- Malicious clients can probe the Reverb HTTP endpoint
- Cannot use WSS without additional configuration

### Alternative
- Always proxy Reverb through Nginx:
  ```nginx
  location /app {
      proxy_pass http://localhost:8080;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_read_timeout 86400s;
  }
  ```
- Terminate SSL at Nginx
- Apply rate limiting and IP filtering at Nginx level

### Refactoring Strategy
1. Configure Nginx site with WebSocket proxy location
2. Set up SSL certificate for the domain
3. Point Reverb Echo config to the Nginx endpoint (WSS)
4. Block direct access to Reverb port (firewall, bind to localhost)
5. Test WSS connections through Nginx
6. Apply rate limiting at Nginx

### Detection Checklist
- [ ] Reverb port bound to localhost only (127.0.0.1), not 0.0.0.0
- [ ] Firewall blocks external access to Reverb port
- [ ] Nginx proxy config exists with WebSocket upgrade headers
- [ ] WSS connections work through Nginx
- [ ] Direct Reverb port access returns 400 or connection refused
- [ ] Rate limiting configured at Nginx

### Related Rules
- proxy-reverb-through-nginx

### Related Skills
- Deploy Reverb to Production (SSL, Nginx, Supervisor)

### Related Decision Trees
- Reverb SSL Termination Strategy

---

## 2. Blocking the Event Loop

### Category
Performance

### Description
Performing blocking I/O operations (sleep, synchronous HTTP calls, database queries, file reads) inside Reverb event handlers. Reverb runs a single-threaded event loop — one blocking operation freezes ALL WebSocket connections on that process for the duration.

### Why It Happens
- Writing event handler code without considering the event loop architecture
- Using familiar synchronous PHP patterns (Http::post(), DB::query(), sleep())
- Not understanding that Reverb is not a traditional request-response PHP application
- Copy-paste from controller code where blocking is acceptable
- No code review awareness of the event loop constraint

### Warning Signs
- `sleep()` or `usleep()` calls in Reverb event handlers
- Synchronous `Http::post()` or `Http::get()` calls in handlers
- Database queries (DB::select(), Model::find()) in handlers
- File reads (`file_get_contents()`) in handlers
- All WebSocket users experience simultaneous freezes
- Reverb process CPU stays at 0% while users report lag (blocked on I/O)

### Why Harmful
- One blocking call freezes ALL connections on that Reverb process
- A `sleep(1)` in a handler blocks every connected user for 1 second
- A slow HTTP API call (5 seconds) freezes all users for 5 seconds
- Users perceive the application as completely frozen during the block
- Multiple blocks can cascade — a slow external service makes Reverb unusable

### Consequences
- All WebSocket users experience simultaneous freezes
- Chat messages, cursor positions, live updates all pause
- Users refresh thinking the app is broken, causing reconnection storms
- Reverb process appears healthy (TCP port open) but is actually frozen
- Support tickets: "real-time app keeps freezing"

### Alternative
- Offload blocking work to queued jobs:
  ```php
  dispatch(new ProcessWebhook($data)); // Returns immediately
  ```
- Use non-blocking I/O if available (async HTTP clients, non-blocking DB)
- For simple state updates, keep handlers pure (no I/O)
- Never use `sleep()`, `usleep()`, or `time_sleep_until()` in handlers

### Refactoring Strategy
1. Audit all Reverb event handler code for blocking I/O
2. Replace synchronous HTTP calls with queued job dispatch
3. Replace database queries with pre-loaded cache reads
4. Remove all `sleep()` and timing functions from handlers
5. Test under load — verify no freeze periods
6. Add code review rule: no blocking I/O in Reverb handlers

### Detection Checklist
- [ ] No `sleep()`, `usleep()`, or timing functions in handlers
- [ ] No synchronous HTTP calls (use queued jobs)
- [ ] No database queries in handlers (pre-cache data)
- [ ] No file reads/writes in handlers
- [ ] Load test shows no freeze periods under concurrent connections
- [ ] Event loop profiling shows 0% blocking I/O time

### Related Rules
- never-block-reverb-event-loop

### Related Skills
- Deploy Reverb to Production (SSL, Nginx, Supervisor)

### Related Decision Trees
- Reverb Reverse Proxy Configuration

---

## 3. Setting ulimit via Shell Instead of Supervisor

### Category
Configuration

### Description
Running `ulimit -n 65536` in a shell session or startup script, assuming it affects Supervisor-managed Reverb processes. Supervisor does not inherit shell-level ulimit settings — managed processes run with default limits.

### Why It Happens
- Most Linux tutorials show `ulimit -n` in shell for changing limits
- Not knowing that Supervisor has its own file descriptor configuration
- Assuming shell ulimit applies to all child processes
- Copying generic server setup guides without Supervisor-specific knowledge
- Testing ulimit in shell works, so assuming Supervisor is configured

### Warning Signs
- `ulimit -n` appears in startup scripts or /etc/security/limits.conf
- Supervisor config has no `minfds` setting
- `cat /proc/<reverb_pid>/limits` shows default 1024 file descriptor limit
- Reverb hits "too many open files" despite configuring ulimit
- Different results between shell `ulimit -n` and Supervisor process limit

### Why Harmful
- Supervisor-managed Reverb runs with OS default file descriptor limit (1024)
- At ~500 connections, Reverb hits the limit and rejects new connections silently
- The operator believes ulimit is configured (shell shows correct value)
- Debugging is confusing — "I set ulimit to 65536, why am I getting errors?"
- Connection failures are silent — no alert, just rejected WebSocket upgrades

### Consequences
- Connection cap at ~500 despite proper shell configuration
- Production incidents from file descriptor exhaustion
- Hours of debugging ulimit configuration that "should work"
- Emergency fix to add `minfds` to Supervisor config
- Users randomly disconnected when limit is hit

### Alternative
- Set `minfds=65536` in Supervisor config:
  ```ini
  [program:reverb]
  minfds=65536
  ```
- Verify with `cat /proc/<reverb_pid>/limits` or `supervisorctl fds <program>`
- Remove shell-level ulimit configuration for Reverb

### Refactoring Strategy
1. Add `minfds=65536` to Reverb Supervisor config
2. Remove shell-level `ulimit` settings from Reverb startup scripts
3. Reload Supervisor configuration
4. Verify with `cat /proc/<reverb_pid>/limits | grep "Max open files"`
5. Load test to confirm no file descriptor exhaustion

### Detection Checklist
- [ ] `minfds` set in Supervisor config (not shell ulimit)
- [ ] Shell-level ulimit removed from Reverb startup
- [ ] Process file descriptor limit matches `minfds` config
- [ ] Load test passes without "too many open files" errors
- [ ] File descriptor usage monitoring for Reverb process

### Related Rules
- set-ulimit-via-supervisor-minfds

### Related Skills
- Deploy Reverb to Production (SSL, Nginx, Supervisor)

### Related Decision Trees
- Reverb Reverse Proxy Configuration

---

## 4. Using Default Nginx Timeouts for WebSocket

### Category
Configuration

### Description
Leaving Nginx's `proxy_read_timeout` at the default value (60 seconds) for the WebSocket proxy location. WebSocket connections can idle for extended periods — the default 60s timeout causes premature disconnection after 60 seconds of inactivity.

### Why It Happens
- Standard Nginx config doesn't adjust timeouts for WebSocket
- Not knowing that WebSocket connections have different timeout requirements than HTTP
- Assuming the connection stays active as long as the page is open
- Copy-paste from regular HTTP proxy configs
- Not testing with idle connections

### Warning Signs
- WebSocket connections drop after exactly 60 seconds of inactivity
- Users report random disconnections when pausing on a page
- Reconnecting after idle period shows successful reconnect (Echo auto-reconnects)
- Nginx error log shows "upstream timed out" at 60-second intervals
- Real-time features stop updating after a period of inactivity

### Why Harmful
- All idle WebSocket connections are disconnected every 60 seconds
- Echo auto-reconnects, but there's a gap in event delivery during reconnect
- Reconnection storm when many users idle simultaneously
- Presence channel state resets on each disconnect/reconnect
- Users perceive the app as unreliable — "I keep getting disconnected"

### Consequences
- Frequent reconnections for idle users
- Missed broadcast events during reconnect window
- Presence channel flicker (user appears online/offline repeatedly)
- Unnecessary WebSocket handshake overhead
- Poor user experience for reading-intensive pages

### Alternative
- Set `proxy_read_timeout` and `proxy_send_timeout` to 86400 seconds:
  ```nginx
  proxy_read_timeout 86400s;  # 24 hours
  proxy_send_timeout 86400s;  # 24 hours
  ```
- This allows connections to idle for a full day before timeout

### Refactoring Strategy
1. Locate Nginx config for Reverb proxy location
2. Set `proxy_read_timeout 86400s;`
3. Set `proxy_send_timeout 86400s;`
4. Reload Nginx configuration
5. Test with idle WebSocket connection — verify no disconnect after 60 seconds

### Detection Checklist
- [ ] `proxy_read_timeout` set to 86400 or higher
- [ ] `proxy_send_timeout` set to 86400 or higher
- [ ] No idle disconnects after 60 seconds
- [ ] WebSocket connection persists for hours of inactivity
- [ ] Nginx error log shows no timeout-related errors for WebSocket

### Related Rules
- increase-nginx-proxy-read-timeout

### Related Skills
- Deploy Reverb to Production (SSL, Nginx, Supervisor)

### Related Decision Trees
- Reverb Reverse Proxy Configuration

---

## 5. Running Reverb Without Memory Monitoring

### Category
Operations

### Description
Running Reverb in production without monitoring its RSS memory usage. Reverb processes that have memory leaks grow over hours or days — eventually hitting the process memory limit and OOM-killing all WebSocket connections simultaneously.

### Why It Happens
- Not setting up monitoring for the Reverb process specifically
- Assuming Reverb has no memory issues (it's PHP, which is typically request-scoped)
- No alerting infrastructure for process-level memory
- Monitoring only covers HTTP response metrics, not WebSocket processes
- "It just works" — no proactive monitoring until an incident occurs

### Warning Signs
- Reverb process restarts at regular intervals (OOM kill → Supervisor restart)
- Memory usage graph shows growth trend over hours
- Users report mass disconnection events at regular intervals
- System logs show `Out of memory: Kill process` for Reverb
- Supervisor restart count indicates frequent OOM recovery

### Why Harmful
- Memory leaks cause OOM kills that disconnect ALL WebSocket users simultaneously
- Restart disconnects all clients, causing reconnection storm
- User state (presence, subscriptions) is lost on restart
- Each OOM event is a mini-outage for real-time features
- Growth trend is invisible until the OOM limit is hit

### Consequences
- Mass disconnection of all WebSocket users
- Reconnection storm as all clients reconnect simultaneously
- Lost broadcast events during restart window
- Support tickets flooding in after each OOM event
- Ops team unaware of the issue until users complain

### Alternative
- Monitor Reverb RSS memory with alerting:
  ```bash
  # Check memory for Reverb process
  ps -o rss= -p $(pgrep -f reverb:start) | awk '{print $1/1024 " MB"}'
  ```
- Set alert threshold at 80% of expected max memory
- Investigate memory growth patterns — stable is normal, growing is a leak
- Use Supervisor's `maxmem` as a safety net (restart on limit)

### Refactoring Strategy
1. Set up Reverb memory monitoring (Prometheus, DataDog, or custom script)
2. Establish baseline: stable memory over 24h of normal traffic
3. Set alert at 80% of process memory limit
4. Add Supervisor `maxmem` limit as safety net:
   ```ini
   [program:reverb]
   maxmem=1024  # Restart if >1GB
   ```
5. Investigate and fix any memory growth identified

### Detection Checklist
- [ ] Reverb RSS memory monitored and graphed
- [ ] Baseline memory usage established for normal load
- [ ] Alert set at 80% of limit threshold
- [ ] No memory growth trend over 24 hours
- [ ] Supervisor `maxmem` configured as safety net
- [ ] OOM-related disconnection incidents are zero

### Related Rules
- stabilize-memory-no-leaks

### Related Skills
- Deploy Reverb to Production (SSL, Nginx, Supervisor)

### Related Decision Trees
- Reverb SSL Termination Strategy
