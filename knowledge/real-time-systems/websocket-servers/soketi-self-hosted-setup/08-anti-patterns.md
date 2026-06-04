# Anti-Patterns: Soketi Self-Hosted Setup

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Real-Time Systems |
| Subdomain | WebSocket Servers |
| Knowledge Unit | Soketi Self-Hosted Setup |
| Audience | Developers, DevOps Engineers |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-SOK-01 | Running Soketi Without Nginx Reverse Proxy | Critical | High | Medium |
| AP-SOK-02 | Using Soketi When Reverb Would Integrate Better | Medium | High | High |
| AP-SOK-03 | Not Configuring allowed_origins | High | Medium | Low |
| AP-SOK-04 | In-Memory Adapter Behind Load Balancer | Critical | High | Medium |
| AP-SOK-05 | No Process Manager for Soketi | Critical | High | Low |

---

## Repository-Wide Anti-Patterns

- **Not updating broadcast config**: Defaults to Pusher's servers instead of local Soketi
- **Missing `SOKETI_DEFAULT_APP_*` env vars**: Clients cannot authenticate
- **Not configuring rate limits**: Leaves the server open to abuse

---

## 1. Running Soketi Without Nginx Reverse Proxy

### Category
Security · Architecture

### Description
Exposing Soketi directly to the internet without an Nginx reverse proxy, serving plain WebSocket connections without TLS and bypassing connection management.

### Why It Happens
Soketi starts on a configured port and accepts WebSocket connections directly. The setup instructions often show direct connection examples. Adding Nginx seems like unnecessary complexity. In production, the missing TLS makes WSS connections impossible.

### Warning Signs
- Soketi is accessible directly on its configured port
- No Nginx virtual host configured for Soketi
- `SOKETI_DEBUG=false` but still seeing plain WS connections
- Browser refuses to connect from HTTPS pages (requires WSS)
- No TLS certificate configured for the WebSocket endpoint

### Why Harmful
Without a reverse proxy, Soketi receives plain WebSocket connections with no encryption. Browsers on HTTPS pages refuse to connect to non-secure WebSocket endpoints. All real-time data — messages, notifications, tokens — is transmitted in plaintext over the network.

### Real-World Consequences
- Browsers reject WebSocket connections from HTTPS pages — real-time features broken
- All WebSocket traffic sent in plaintext — data interception risk
- Mobile users on public Wi-Fi have data intercepted
- Security audit identifies missing TLS as critical finding
- Emergency Nginx configuration required after launch

### Preferred Alternative
Always run Soketi behind an Nginx reverse proxy with TLS termination.

### Refactoring Strategy
1. Configure an Nginx virtual host for the Soketi subdomain
2. Add TLS certificate (Let's Encrypt via Certbot)
3. Configure Nginx to proxy WebSocket connections:
   ```
   proxy_set_header Upgrade $http_upgrade;
   proxy_set_header Connection "upgrade";
   ```
4. Update `config/broadcasting.php` `options.host` to point to the Nginx proxy
5. Close the direct Soketi port in the firewall
6. Verify WSS connections work through the proxy

### Detection Checklist
- [ ] Is Soketi accessible directly on its configured port?
- [ ] Is there an Nginx reverse proxy configured?
- [ ] Are WebSocket connections using WSS (not WS)?
- [ ] Is the direct Soketi port closed in the firewall?
- [ ] Is TLS configured at the reverse proxy level?

### Related Rules/Skills/Trees
- Always Run Soketi Behind Nginx Reverse Proxy (05-rules.md)
- Configure Soketi Self-Hosted Setup (06-skills.md)
- Nginx Reverse Proxy for Soketi (06-skills.md)

---

## 2. Using Soketi When Reverb Would Integrate Better

### Category
Architecture · Maintainability

### Description
Choosing Soketi (Node.js) over Reverb (PHP) for a Laravel application, adding a second runtime (Node.js) to the infrastructure stack when Reverb would provide equivalent functionality with better Laravel integration.

### Why It Happens
Soketi is well-known as a Pusher protocol compatible server. Teams coming from Node.js backgrounds or with existing Node.js infrastructure choose it for familiarity. The fact that Reverb is first-party Laravel and runs on PHP (same runtime as the application) is undervalued.

### Warning Signs
- Existing Laravel stack with no Node.js services
- No team expertise in Node.js operations
- Soketi chosen because "we've always used it" or "Reverb is new"
- Team manages both PHP and Node.js runtimes for deployment
- No Soketi-specific features needed that Reverb doesn't provide

### Why Harmful
Adding Node.js to the infrastructure stack increases operational complexity: new deployment pipeline, new process management, new monitoring, new security patching cadence. Reverb runs on PHP, the same runtime as Laravel, sharing the same ecosystem, deployment tools, and security monitoring.

### Real-World Consequences
- Team must manage Node.js version updates for Soketi
- Deployment pipeline must handle both PHP and Node.js application servers
- Monitoring must cover both PHP-FPM and Node.js processes
- Security patching for both runtimes required
- Developer knowledge split between PHP and Node.js ecosystems

### Preferred Alternative
Use Reverb for new Laravel projects. It is first-party, actively maintained, and runs on the same PHP runtime.

### Refactoring Strategy
1. Evaluate if Soketi-specific features are needed (NATS adapter, specific protocol version)
2. If not, plan migration to Reverb
3. Install Reverb: `composer require laravel/reverb`
4. Update environment: `BROADCAST_CONNECTION=reverb`
5. Configure Supervisor for Reverb process management
6. Update Echo client config to connect to Reverb
7. Test all real-time features with Reverb
8. Decommission Soketi after verification

### Detection Checklist
- [ ] Is there an existing Node.js infrastructure need beyond Soketi?
- [ ] Does the team have Node.js operational expertise?
- [ ] Are there specific Soketi features unavailable in Reverb?
- [ ] Is the application using standard broadcasting features?
- [ ] Would Reverb provide the same functionality with less complexity?

### Related Rules/Skills/Trees
- Use Reverb (PHP) Instead of Soketi (Node.js) for Laravel Apps (05-rules.md)
- Configure Soketi Self-Hosted Setup (06-skills.md)
- WebSocket Server Selection (07-decision-trees.md)

---

## 3. Not Configuring allowed_origins

### Category
Security · Critical

### Description
Deploying Soketi without configuring `SOKETI_ALLOWED_ORIGINS`, allowing any website to open WebSocket connections to the Soketi server and potentially trigger cross-site WebSocket hijacking (CSWSH) attacks.

### Why It Happens
The default configuration allows all origins. The `allowed_origins` setting is optional in the documentation. Developers skip it because "it works without it." The CSWSH attack vector is less well-known than standard CSRF, making it easy to overlook.

### Warning Signs
- `SOKETI_ALLOWED_ORIGINS` is not set in the environment
- Soketi accepts connections from any domain
- Channel authorization is the only access control
- No CORS configuration on Soketi
- Unauthorized origins can open WebSocket connections

### Why Harmful
Without origin restrictions, any website can open a WebSocket connection to the Soketi server. While channel authorization limits what data the connection can access, the server is still vulnerable to CSWSH attacks where an attacker's website makes a WebSocket connection from the victim's browser, potentially using the victim's existing session.

### Real-World Consequences
- Attacker embeds WebSocket connection in malicious webpage
- Victim's browser connects to Soketi with victim's cookies/session
- Private channel subscriptions leaked through timing or event observations
- CSWSH attack enables unauthorized channel subscription
- Security audit identifies missing origin restriction as finding

### Preferred Alternative
Configure `SOKETI_ALLOWED_ORIGINS` with an explicit allowlist of domains that are permitted to open WebSocket connections.

### Refactoring Strategy
1. Set `SOKETI_ALLOWED_ORIGINS` in the environment:
   ```
   SOKETI_ALLOWED_ORIGINS=https://example.com,https://admin.example.com
   ```
2. For development, include localhost origins: `http://localhost:3000`
3. Test: verify connections from allowed origins work
4. Test: verify connections from disallowed origins are rejected
5. Monitor Soketi logs for rejected origin attempts
6. Update the allowlist as new application domains are added

### Detection Checklist
- [ ] Is `SOKETI_ALLOWED_ORIGINS` configured?
- [ ] Are connections from unexpected origins accepted?
- [ ] Is the origin allowlist up to date with all application domains?
- [ ] Are there logs of rejected origin attempts?
- [ ] Is there a process for updating the allowlist?

### Related Rules/Skills/Trees
- Configure Soketi Allowed Origins for CSWSH Prevention (05-rules.md)
- Configure Soketi Self-Hosted Setup (06-skills.md)
- Soketi Security Configuration (06-skills.md)

---

## 4. In-Memory Adapter Behind Load Balancer

### Category
Reliability · Architecture

### Description
Running multiple Soketi instances behind a load balancer using the default in-memory adapter (instead of Redis or NATS), causing events broadcast from one instance to never reach clients connected to other instances.

### Why It Happens
Soketi's default adapter is in-memory. Developers deploy multiple instances for high availability or capacity without configuring the Redis or NATS adapter. Each instance operates independently, unaware of other instances.

### Warning Signs
- Multiple Soketi instances are running
- `SOKETI_ADAPTER` is not set (defaults to in-memory)
- Events published reach only a subset of clients
- Some users receive real-time updates while others don't
- Load balancer round-robins between instances but events don't propagate

### Why Harmful
With the in-memory adapter, each Soketi instance only knows about its own connected clients. Events published by the Laravel application are received by one Soketi instance (via the HTTP API) and forwarded only to that instance's clients. Clients connected to other instances never receive the event.

### Real-World Consequences
- 50% of users receive real-time updates — those on other instances miss all events
- Support tickets: "Notifications work for some users but not others"
- Debugging shows events are published but only a subset of clients receive them
- Team doesn't realize the issue for weeks — hard to reproduce
- Emergency Redis adapter configuration during production incident

### Preferred Alternative
Configure the Redis or NATS adapter for multi-instance Soketi deployments. Ensure the load balancer uses sticky sessions.

### Refactoring Strategy
1. Set the adapter: `SOKETI_ADAPTER=redis` (or `nats`)
2. Configure Redis connection: `SOKETI_REDIS_HOST`, `SOKETI_REDIS_PORT`, etc.
3. Ensure the load balancer has sticky sessions enabled
4. Restart all Soketi instances
5. Test: publish an event, verify all connected clients receive it
6. Monitor Redis pub/sub channel for cross-instance communication

### Detection Checklist
- [ ] Is the adapter set to `redis` or `nats` for multi-instance deployments?
- [ ] Do events reach all clients or only a subset?
- [ ] Are sticky sessions configured on the load balancer?
- [ ] Is the Redis adapter configured with correct credentials?
- [ ] Are there multiple Soketi instances without scaling adapter?

### Related Rules/Skills/Trees
- Configure Redis Adapter for Multi-Instance Soketi (05-rules.md)
- Configure Soketi Self-Hosted Setup (06-skills.md)
- Soketi Horizontal Scaling (06-skills.md)

---

## 5. No Process Manager for Soketi

### Category
Reliability · Operations

### Description
Running Soketi as a direct Node.js process without a process manager (Supervisor, PM2, systemd), causing all WebSocket connections to drop when the process crashes and no automatic restart.

### Why It Happens
Node.js runs Soketi directly with `soketi start`. This works in the terminal. In production, the process is started manually or via a startup script. Without a process manager, a crash or server restart leaves Soketi down until someone manually restarts it.

### Warning Signs
- Soketi was started with a direct `soketi start` command
- No PM2, Supervisor, or systemd configuration exists
- Soketi crashes are followed by extended downtime
- Server restart requires manual Soketi start
- Users report "real-time features are down" and SSH restart is required

### Why Harmful
When Soketi crashes (unhandled exception, OOM, server restart), all WebSocket connections drop and no new connections are accepted. Without automatic restart, real-time features are down until a human notices and restarts the process. This creates extended downtime, especially outside business hours.

### Real-World Consequences
- Unhandled exception at 2 AM crashes Soketi — 8 hours of downtime
- Server restart for security update doesn't restart Soketi — real-time features down
- Node.js out-of-memory during traffic spike kills Soketi — manual restart required
- All connected users lose real-time functionality
- Users report issues before the operations team notices

### Preferred Alternative
Use a process manager to automatically restart Soketi. PM2 is the standard choice for Node.js applications.

### Refactoring Strategy
1. Install PM2: `npm install -g pm2`
2. Configure PM2 to manage Soketi: `pm2 start soketi --name soketi`
3. Save the PM2 process list: `pm2 save`
4. Configure PM2 to restart on server boot: `pm2 startup`
5. For Supervisor alternative: create a Supervisor config that runs `soketi start`
6. Test: kill the Soketi process, verify PM2 restarts it
7. Set up monitoring on Soketi process uptime

### Detection Checklist
- [ ] Is Soketi running under a process manager?
- [ ] Does PM2, Supervisor, or systemd restart Soketi on crash?
- [ ] What happens when Soketi crashes — automatic restart?
- [ ] Are there monitoring alerts for Soketi process status?
- [ ] Is the process manager configuration documented?

### Related Rules/Skills/Trees
- Use Process Manager (PM2/Supervisor) for Soketi (05-rules.md)
- Configure Soketi Self-Hosted Setup (06-skills.md)
- PM2 Configuration for Soketi (06-skills.md)
