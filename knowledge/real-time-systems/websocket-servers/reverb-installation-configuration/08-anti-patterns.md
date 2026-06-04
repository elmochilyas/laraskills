# Anti-Patterns: Reverb Installation & Configuration

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Real-Time Systems |
| Subdomain | WebSocket Servers |
| Knowledge Unit | Reverb Installation & Configuration |
| Audience | Developers, DevOps Engineers |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-RIC-01 | Running Reverb Without a Reverse Proxy | Critical | High | Medium |
| AP-RIC-02 | Binding Reverb to 0.0.0.0 Without Firewall | High | Medium | Low |
| AP-RIC-03 | Not Verifying Reverb Version After Composer Update | High | Medium | Low |
| AP-RIC-04 | QUEUE_CONNECTION=sync in Production | Critical | High | Low |
| AP-RIC-05 | No Process Manager for Reverb | Critical | High | Low |

---

## Repository-Wide Anti-Patterns

- **Default credentials in production**: Use unique app credentials per environment
- **No `allowed_origins` configured**: Any domain can connect — CSWSH vulnerability
- **Port conflict between REVERB_HOST and REVERB_SERVER_HOST**: Reverb fails to start

---

## 1. Running Reverb Without a Reverse Proxy

### Category
Security · Architecture

### Description
Exposing the Reverb WebSocket daemon directly to the internet without an Nginx reverse proxy, bypassing TLS termination, domain routing, and connection management.

### Why It Happens
Reverb starts on a configured port and accepts WebSocket connections directly. In development, this works without a proxy. Deploying the same configuration to production seems natural. The reverse proxy adds a layer of complexity that teams skip for simplicity.

### Warning Signs
- Reverb is accessible directly on its configured port (e.g., `ws://yourserver.com:8080`)
- No Nginx/Apache virtual host configured for WebSocket traffic
- TLS termination is handled by Reverb itself (it doesn't support native TLS)
- No domain-based routing — Reverb accepts from any host
- `REVERB_HOST` points to the public IP/hostname without proxy

### Why Harmful
Without a reverse proxy, Reverb receives plain WebSocket connections with no TLS encryption. All data transmitted over the WebSocket — including authentication tokens and real-time application data — is sent in plaintext. Reverb does not handle TLS natively, so WSS (WebSocket Secure) is impossible without a reverse proxy.

### Real-World Consequences
- All WebSocket traffic transmitted in plaintext — data interception risk
- Browsers refuse to connect to non-secure WebSocket from HTTPS pages
- Mobile users on untrusted networks can have their WebSocket data intercepted
- Security audit identifies missing TLS as critical finding
- Emergency Nginx configuration required after launch

### Preferred Alternative
Always run Reverb behind an Nginx reverse proxy. Nginx handles TLS termination, domain routing, and upgrade headers.

### Refactoring Strategy
1. Configure an Nginx virtual host for the Reverb subdomain
2. Add TLS certificate (Let's Encrypt via Certbot)
3. Configure Nginx to proxy WebSocket connections:
   ```
   proxy_set_header Upgrade $http_upgrade;
   proxy_set_header Connection "upgrade";
   ```
4. Update `REVERB_HOST` to point to the Nginx proxy (not direct Reverb)
5. Close the direct Reverb port in the firewall
6. Verify WSS connections work through the proxy

### Detection Checklist
- [ ] Is Reverb accessible directly on its configured port?
- [ ] Is there an Nginx/Apache reverse proxy configured?
- [ ] Are WebSocket connections using WSS (not WS)?
- [ ] Is the direct Reverb port closed in the firewall?
- [ ] Is TLS configured at the reverse proxy level?

### Related Rules/Skills/Trees
- Always Run Reverb Behind Nginx Reverse Proxy (05-rules.md)
- Configure Reverb Installation and Configuration (06-skills.md)
- Nginx Reverse Proxy for WebSocket (06-skills.md)

---

## 2. Binding Reverb to 0.0.0.0 Without Firewall

### Category
Security · Operations

### Description
Configuring Reverb to listen on `0.0.0.0` (all network interfaces) without restricting access via firewall, making the WebSocket server accessible from any network.

### Why It Happens
The default Reverb configuration binds to `0.0.0.0` to accept connections from any interface. In development, this is convenient. In production, the assumption is that the cloud provider's firewall protects the instance. But firewall rules are often misconfigured or forgotten.

### Warning Signs
- `REVERB_HOST` is set to `0.0.0.0` in production
- No security group or firewall rule restricts access to the Reverb port
- Reverb port is accessible from the public internet
- `netstat -tlnp` shows Reverb listening on `0.0.0.0:8080` (or similar)
- No explicit network ACL limits access to the Reverb port

### Why Harmful
Binding to `0.0.0.0` makes Reverb accessible from any network interface. Without firewall restrictions, anyone on the internet can attempt WebSocket connections to the server. This exposes the application to unauthorized connection attempts, potential DoS attacks, and reconnaissance.

### Real-World Consequences
- Attacker discovers exposed Reverb port, enumerates connections
- DoS attack on WebSocket connections exhausts server resources
- Unauthorized connection attempts fill logs
- Security audit identifies exposed Reverb port as finding
- Emergency firewall rule added after vulnerability scan

### Preferred Alternative
Bind Reverb to `127.0.0.1` (localhost) when using a reverse proxy on the same server. The reverse proxy on localhost forwards to Reverb. If Reverb must accept from other hosts, restrict access via firewall to only the load balancer or proxy IPs.

### Refactoring Strategy
1. If using Nginx reverse proxy on the same server, set `REVERB_HOST=127.0.0.1`
2. If using a separate proxy server, set `REVERB_HOST` to the internal IP and restrict firewall to proxy IP only
3. Add a firewall rule: allow inbound on Reverb port only from proxy/load balancer IPs
4. Verify Reverb is not accessible from outside the allowed IPs
5. Test WebSocket connections through the configured path
6. Document the network architecture for future reference

### Detection Checklist
- [ ] Is `REVERB_HOST` set to `0.0.0.0`?
- [ ] Are there firewall restrictions on the Reverb port?
- [ ] Is Reverb accessible from outside the internal network?
- [ ] Is a reverse proxy used to front Reverb?
- [ ] Are the network ACLs documented?

### Related Rules/Skills/Trees
- Bind Reverb to 127.0.0.1 with Reverse Proxy (05-rules.md)
- Configure Reverb Installation and Configuration (06-skills.md)
- Network Security for Reverb Deployments (06-skills.md)

---

## 3. Not Verifying Reverb Version After Composer Update

### Category
Security · Operations

### Description
Running `composer update` without verifying the resolved Reverb version, potentially installing an older, vulnerable version or missing critical security patches.

### Why It Happens
Composer resolves dependency versions based on `composer.json` constraints. `^1.0` allows any 1.x version. Developers run `composer update` without `--dry-run` or reviewing the changelog. Older but satisfying versions may be resolved, and critical security fixes (CVE-2026-23524) are missed.

### Warning Signs
- `composer update` output is not reviewed
- No version constraint in `composer.json` specifies a minimum security patch
- Reverb version is not verified as part of the deployment process
- Security advisories for Reverb are not monitored
- `composer show laravel/reverb` shows a version older than the latest patch

### Why Harmful
Reverb has had critical security vulnerabilities (CVE-2026-23524 — Redis deserialization RCE). Running an outdated version leaves the application vulnerable to known exploits. Attackers can exploit known CVEs to compromise the Reverb server and potentially escalate to the application server.

### Real-World Consequences
- CVE-2026-23524 exploit used to gain RCE on Reverb server
- Known vulnerability present in production for months after patch release
- Penetration test identifies outdated Reverb as high-risk finding
- Emergency Reverb update required after vulnerability disclosure
- Application compromised through unpatched WebSocket server

### Preferred Alternative
Pin the Reverb version to a known good version. Review resolved versions after `composer update`. Monitor security advisories.

### Refactoring Strategy
1. Specify a minimum version in `composer.json`: `"laravel/reverb": "^1.7.0"` (or latest security patch)
2. Run `composer update` with `--dry-run` to review version changes before applying
3. Add a CI check that verifies Reverb version meets minimum security requirements
4. Subscribe to Laravel security advisories
5. Schedule monthly dependency update reviews
6. Automate dependency update PRs with Dependabot or Renovate

### Detection Checklist
- [ ] What version of Reverb is currently installed?
- [ ] Is the version free of known security vulnerabilities?
- [ ] Is there a minimum version constraint in `composer.json`?
- [ ] Are Reverb version updates reviewed before deployment?
- [ ] Is there a process for monitoring Reverb security advisories?

### Related Rules/Skills/Trees
- Pin Reverb Version and Verify After Updates (05-rules.md)
- Configure Reverb Installation and Configuration (06-skills.md)
- Laravel Package Security Management (06-skills.md)

---

## 4. QUEUE_CONNECTION=sync in Production

### Category
Reliability · Architecture

### Description
Using the `sync` queue driver in production, causing broadcast events to be processed synchronously within the HTTP request lifecycle, blocking the request until all listeners are processed.

### Why It Happens
The `sync` queue driver is Laravel's default for development. It processes jobs inline without a queue worker. When deploying to production, the `QUEUE_CONNECTION` is often left as `sync` because "it works." The impact on broadcast events is invisible in low-traffic development but devastating under production load.

### Warning Signs
- `QUEUE_CONNECTION=sync` in production `.env`
- Broadcast events add 100-500ms to HTTP response times
- Request response time increases proportionally to the number of broadcast listeners
- No queue worker process is running
- Failed broadcast jobs don't exist (they block the request instead)

### Why Harmful
With `QUEUE_CONNECTION=sync`, broadcast events are processed synchronously. If a broadcast event has multiple listeners (notifications, presence updates, logging), each listener executes sequentially during the HTTP request. For a broadcast with 5 listeners, each taking 50ms, the request is delayed by 250ms. Under load, this accumulates and causes request timeouts.

### Real-World Consequences
- HTTP response times increase by 300ms+ from synchronous broadcasts
- Request timeouts during peak traffic
- Users experience slow page loads after triggering broadcasts
- Cannot scale: every broadcast adds latency to the HTTP request
- Emergency switch to `redis` queue driver during performance incident

### Preferred Alternative
Use an asynchronous queue driver (`redis`, `database`) in production. Run a queue worker to process broadcast events asynchronously.

### Refactoring Strategy
1. Set `QUEUE_CONNECTION=redis` or `QUEUE_CONNECTION=database` in production
2. Configure Supervisor or systemd to run `php artisan queue:work`
3. Verify broadcast events are dispatched to the queue
4. Monitor queue backlog for broadcast events
5. Remove deployments of `sync` queue configuration
6. Test: measure HTTP response time before and after fix

### Detection Checklist
- [ ] Is `QUEUE_CONNECTION` set to `sync` in production?
- [ ] Are broadcast events adding latency to HTTP requests?
- [ ] Is a queue worker running on the production server?
- [ ] Are broadcast events processed asynchronously?
- [ ] Is request response time affected by broadcasting?

### Related Rules/Skills/Trees
- Use Async Queue Driver for Broadcast Events in Production (05-rules.md)
- Configure Reverb Installation and Configuration (06-skills.md)
- Laravel Queue Configuration for Broadcasting (06-skills.md)

---

## 5. No Process Manager for Reverb

### Category
Reliability · Operations

### Description
Running Reverb with `php artisan reverb:start` directly in the terminal without a process manager (Supervisor, systemd), causing the server to crash and all WebSocket connections to drop when the process terminates.

### Why It Happens
In development, running `php artisan reverb:start` is standard. Deploying to production, the command is added to startup scripts or the terminal is kept open. Developers don't realize that SSH disconnections, crashes, or OOM events kill the process without automatic restart.

### Warning Signs
- Reverb was started with `php artisan reverb:start` in a terminal
- No Supervisor configuration file for Reverb exists
- No systemd service file for Reverb exists
- Reverb crashes are followed by extended downtime until manual restart
- Users report "real-time features are down" and SSH restart is required

### Why Harmful
When Reverb crashes (due to an unhandled exception, OOM, or process manager restart), all WebSocket connections are dropped and no new connections are accepted. Without a process manager, Reverb stays down until a human notices and restarts it. This creates extended downtime for all real-time features.

### Real-World Consequences
- Nightly server restart kills Reverb — real-time features down until morning
- Unhandled exception at 3 AM crashes Reverb — 6 hours of downtime
- OOM kills Reverb during memory spike — manual restart required
- All connected users lose real-time functionality
- Support team unaware until users report "notifications not working"

### Preferred Alternative
Use Supervisor to automatically restart Reverb if it crashes. Configure `startsecs`, `stopwaitsecs`, and `numprocs` appropriately.

### Refactoring Strategy
1. Create Supervisor configuration: `/etc/supervisor/conf.d/reverb.conf`
   ```
   [program:reverb]
   command=php artisan reverb:start
   user=forge
   autostart=true
   autorestart=true
   startsecs=3
   stopwaitsecs=600
   ```
2. Enable and start Supervisor: `supervisorctl reread && supervisorctl update`
3. Verify Reverb is running under Supervisor: `supervisorctl status`
4. Test: kill the Reverb process, verify Supervisor restarts it
5. Set up monitoring on Reverb process uptime
6. Document the Supervisor configuration for future reference

### Detection Checklist
- [ ] Is Reverb running under a process manager?
- [ ] Does Supervisor or systemd restart Reverb on crash?
- [ ] What happens when Reverb crashes — is there automatic restart?
- [ ] Are there monitoring alerts for Reverb process status?
- [ ] Is the process manager configuration documented?

### Related Rules/Skills/Trees
- Use Supervisor to Manage Reverb Process (05-rules.md)
- Configure Reverb Installation and Configuration (06-skills.md)
- Supervisor Configuration for Reverb (06-skills.md)
