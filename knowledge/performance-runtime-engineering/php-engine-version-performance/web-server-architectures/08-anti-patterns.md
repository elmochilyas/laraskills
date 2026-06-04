# Anti-Patterns: Web Server Architectures

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Engine Performance |
| Knowledge Unit | Web Server Architectures |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Using TCP Instead of Unix Socket for Same-Machine FPM | Configuration | High |
| 2 | Exposing PHP-FPM Directly to the Internet | Security | Critical |
| 3 | Using Apache mod_php for New Projects | Architecture | High |
| 4 | PHP-FPM Without Process Manager Configuration | Configuration | High |
| 5 | Keeping CGI in Production | Architecture | Critical |

## Repository-Wide Anti-Patterns

- **SAPI mismatch**: Using a PHP build compiled for one SAPI (CGI, FastCGI, CLI, embedded) in an environment that requires a different SAPI, leading to incompatibility, missing features, or performance issues.
- **Reverse proxy bypass**: Configuring PHP-FPM without a reverse proxy in front, exposing the FastCGI process manager to external attack surface and missing security and performance benefits.

---

## Anti-Pattern 1: Using TCP Instead of Unix Socket for Same-Machine FPM

### Category
Configuration

### Description
Configuring Nginx to communicate with PHP-FPM via TCP loopback (127.0.0.1:9000) instead of a Unix socket when both are on the same machine, adding 15-25% unnecessary latency from full network stack overhead.

### Why It Happens
- TCP is the default in many Nginx configurations and online tutorials
- Unix socket configuration requires filesystem permission management
- "Works across machines" reasoning applied even when both services are local
- Unawareness that Unix sockets bypass the network stack entirely
- Historical habit from when PHP-FPM had socket stability issues

### Warning Signs
- astcgI_pass 127.0.0.1:9000 instead of unix:/var/run/php/php8.5-fpm.sock
- listen = 127.0.0.1:9000 in PHP-FPM pool configuration
- No specific reason for TCP (not a remote FPM server)
- Profiling shows 0.1-0.5ms FastCGI communication overhead

### Why Harmful
TCP adds measurable overhead for no benefit when both services are on the same machine:
- TCP loopback traverses the full network stack: handshake, segmentation, checksumming
- Unix sockets write directly to the socket file, bypassing the network stack
- 15-25% higher latency for FastCGI communication than necessary
- CPU cycles wasted on TCP stack processing for loopback traffic

### Consequences
- 15-25% higher PHP-FPM communication latency than necessary
- CPU wasted on networking stack for loopback
- Throughput capacity reduced by avoidable overhead
- Infrastructure complexity from TCP configuration

### Alternative
Always use Unix sockets for same-machine Nginx and PHP-FPM:
- Nginx: astcgi_pass unix:/var/run/php/php8.5-fpm.sock;
- PHP-FPM: listen = /var/run/php/php8.5-fpm.sock
- Set socket permissions to 0660, ensure web server user has access

### Refactoring Strategy
1. Change PHP-FPM listen directive to Unix socket path
2. Set appropriate socket permissions (0660, www-data owner/group)
3. Restart PHP-FPM to create the socket file
4. Update Nginx fastcgi_pass to use the Unix socket
5. Reload Nginx and verify application functionality

### Detection Checklist
- [ ] Nginx and PHP-FPM on same machine
- [ ] Unix socket configured (not TCP loopback)
- [ ] Socket permissions properly set
- [ ] Latency benchmark confirms improvement
- [ ] Container deployments use shared volume for socket

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Web Server Architectures
- 05-rules.md: Use Unix Sockets for Same-Machine FPM
- 07-decision-trees.md: FPM Communication Decision Tree

---

## Anti-Pattern 2: Exposing PHP-FPM Directly to the Internet

### Category
Security

### Description
Configuring PHP-FPM to listen on a publicly accessible network interface without a reverse proxy in front, exposing the FastCGI protocol parser to external attack surface and bypassing HTTP-level security controls.

### Why It Happens
- Development configurations carried to production
- Container orchestrator default network configurations
- Simplifying architecture by removing the reverse proxy
- Load balancer routing directly to FPM port
- Unawareness that FastCGI is not designed for external exposure

### Warning Signs
- listen = 0.0.0.0:9000 in PHP-FPM pool configuration
- No reverse proxy (Nginx, Caddy) in the request path
- FPM port accessible from external IP addresses
- Security audit flags exposed FastCGI port
- FPM status page accessible externally

### Why Harmful
PHP-FPM is not designed for direct external exposure:
- FastCGI protocol parser is not hardened against malicious input
- No HTTP-level protection (request filtering, rate limiting, WAF)
- No TLS termination (FastCGI is unencrypted)
- Status page leaks sensitive information (process list, configuration)
- Historical CVEs targeting PHP-FPM FastCGI parsing

### Consequences
- Direct attack surface on FastCGI protocol parser
- No TLS encryption for communication
- Security compliance violations (PCI-DSS requires reverse proxy)
- Potential remote code execution via FastCGI exploits
- Sensitive information leaked via status page

### Alternative
Always place a reverse proxy in front of PHP-FPM:
- Nginx or Caddy handles TLS, HTTP security, rate limiting, static files
- PHP-FPM listens only on localhost or Unix socket
- Reverse proxy is the only entry point exposed to the internet
- Configure TLS termination at the reverse proxy

### Refactoring Strategy
1. Change PHP-FPM listen to localhost or Unix socket only
2. Deploy Nginx/Caddy as reverse proxy on the same machine
3. Configure TLS termination, HTTP security headers, rate limiting at proxy
4. Remove any firewall rules allowing external access to FPM port
5. Verify no direct access to FPM from external IPs

### Detection Checklist
- [ ] PHP-FPM listens only on localhost or Unix socket
- [ ] Reverse proxy (Nginx/Caddy) in front of FPM
- [ ] TLS termination at reverse proxy
- [ ] Firewall blocks external access to FPM port
- [ ] Status page not accessible externally
- [ ] Security audit passes for web server architecture

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Web Server Architectures
- 05-rules.md: Never Expose FPM Directly
- 07-decision-trees.md: Reverse Proxy Decision Tree

---

## Anti-Pattern 3: Using Apache mod_php for New Projects

### Category
Architecture

### Description
Starting new PHP projects with Apache mod_php, a deprecated architecture where PHP runs as an Apache module with poor process isolation, no per-pool configuration, and no separation from the web server process.

### Why It Happens
- Developer familiarity with Apache and mod_php from legacy projects
- Existing Apache infrastructure and configuration expertise
- One less service to manage (no separate FPM process)
- Copy-paste from older tutorials and documentation
- Unawareness of mod_php's deprecation and disadvantages

### Warning Signs
- New project uses Apache + mod_php for production
- PHP runs as an Apache module (mod_php, mod_php7, mod_php8)
- No PHP-FPM process manager in the architecture
- Process isolation concerns (a PHP crash takes down Apache)
- Per-pool configuration needed but not available (single pool only)
- Nginx + PHP-FPM not evaluated as an alternative

### Why Harmful
mod_php has fundamental architectural disadvantages:
- PHP runs embedded in the Apache process — a PHP crash takes down Apache
- No per-pool configuration (all virtual hosts share the same PHP config)
- No process manager (pm = static/dynamic/ondemand not available)
- No slow log, status page, or per-pool process limits
- Thread safety issues (Apache's worker MPM requires ZTS PHP)
- Deprecated in favor of PHP-FPM since PHP 5.4 (2012)

### Consequences
- Poor process isolation (one site's PHP issue affects all sites)
- Limited configuration flexibility (one pool for all virtual hosts)
- No process manager tuning (static/dynamic/ondemand not available)
- No slow log for debugging slow requests
- Higher operational complexity from Apache + PHP tight coupling
- Migration effort needed later (mod_php to FPM)

### Alternative
Use PHP-FPM with Nginx for new projects:
- PHP-FPM: dedicated process manager, per-pool config, slow log, status page
- Nginx: high-performance static file serving, reverse proxy, TLS termination
- Process isolation: PHP crash affects only the FPM pool, not the web server
- Per-pool configuration: different PHP settings per virtual host
- This is the standard PHP deployment architecture for 10+ years

### Refactoring Strategy
1. Install PHP-FPM and configure the pool (listen, pm, limits)
2. Install Nginx as the reverse proxy in front of FPM
3. Migrate Apache virtual host configurations to Nginx server blocks
4. Configure FastCGI pass to PHP-FPM via Unix socket
5. Test all endpoints, monitoring, and logging
6. Decommission Apache mod_php after validation

### Detection Checklist
- [ ] New projects use PHP-FPM + Nginx (not mod_php)
- [ ] mod_php used only for legacy applications with migration plan
- [ ] PHP-FPM process manager configured (not default)
- [ ] Per-pool configuration used for different virtual hosts
- [ ] mod_php not recommended in architecture documentation
- [ ] Migration plan exists for existing mod_php deployments

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Web Server Architectures
- 05-rules.md: Use PHP-FPM + Nginx for New Projects
- 07-decision-trees.md: Web Server Selection Decision Tree

---

## Anti-Pattern 4: PHP-FPM Without Process Manager Configuration

### Category
Configuration

### Description
Using PHP-FPM with default process manager settings (pm = dynamic with default values), without tuning pm.max_children, pm.max_requests, or choosing the appropriate pm mode for the workload, leading to pool exhaustion or memory waste.

### Why It Happens
- Default configuration "works" for low-traffic applications
- No understanding of the process manager modes (static vs dynamic vs ondemand)
- Configuration copied from examples without customization
- No monitoring of FPM status page (listen queue, process counts)
- Performance tuning focused on PHP rather than FPM process management

### Warning Signs
- pm = dynamic with default max_children value (5 or 10)
- pm.max_children not customized for server memory
- pm.max_requests not set (default 0 = no recycling)
- FPM status page shows active processes at max_children
- FPM listen queue length > 0 (requests are waiting for workers)
- Memory usage grows over time with no recycling (no max_requests)
- pm = ondemand with no min_spare_servers (cold start latency)

### Why Harmful
Default FPM configuration leads to production issues:
- pm.max_children = 5 or 10 is too low for any production server with > 1GB RAM
- Workers exhaust quickly under load, causing 502/503 errors
- No max_requests means no worker recycling — memory drift accumulates
- Wrong pm mode wastes memory (dynamic keeps idle workers) or causes latency (ondemand spawns slowly)
- Worker count not matched to server memory, causing OOM or underutilization

### Consequences
- 502/503 errors from worker pool exhaustion under load
- Unbounded memory growth (no max_requests recycling)
- Wasted memory from idle workers in dynamic mode
- Slow response under traffic spikes (ondemand spawning delay)
- Server OOM from too many workers
- Inconsistent configuration across environments

### Alternative
Configure the process manager explicitly:
1. Choose pm mode: static (consistent traffic), dynamic (variable traffic), ondemand (low traffic, shared hosting)
2. Set max_children based on available memory / per-worker RSS
3. Set max_requests to recycle workers and prevent memory drift (1000-10000)
4. Set min/max_spare_servers for dynamic and ondemand modes
5. Monitor FPM status page and adjust based on listen queue length

### Refactoring Strategy
1. Measure per-worker RSS (resident set size)
2. Calculate max_children = (total RAM - OS reserve - other services) / per-worker RSS
3. Set pm = dynamic for most production workloads
4. Set pm.max_children to calculated value
5. Set pm.max_requests = 5000 (balance between recycling overhead and memory control)
6. Set pm.start_servers, pm.min_spare_servers, pm.max_spare_servers appropriately
7. Monitor FPM listen queue: if > 0, increase max_children

### Detection Checklist
- [ ] pm mode explicitly configured (not default)
- [ ] pm.max_children calculated based on available memory
- [ ] pm.max_requests set to prevent memory drift
- [ ] Spare server counts configured for the chosen mode
- [ ] FPM status page monitored for listen queue length
- [ ] Worker count validated under peak load (not at limit)
- [ ] Configuration documented with rationale

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Web Server Architectures
- 04-standardized-knowledge.md: FPM Process Manager Modes
- 05-rules.md: Configure Process Manager Explicitly
- 07-decision-trees.md: Process Manager Mode Decision Tree

---

## Anti-Pattern 5: Keeping CGI in Production

### Category
Architecture

### Description
Running PHP via CGI (process-per-request) in production instead of PHP-FPM or FastCGI, incurring 10x+ overhead from forking a new PHP process for every request with no persistent process pool.

### Why It Happens
- Legacy infrastructure never migrated from CGI
- Shared hosting providers stuck on old control panel configurations
- Custom web server or embed setup that defaults to CGI
- No awareness that CGI is obsolete and severely inefficient
- "It works" — the application runs, albeit slowly
- No performance comparison with FPM to justify migration

### Warning Signs
- PHP running via mod_cgi or mod_cgid in Apache
- No PHP-FPM process manager running
- ps output shows php-cgi processes spawning and dying per request
- High system CPU from process creation/destruction overhead
- Response time includes significant process spawn time
- Server load and latency are much higher than expected for the traffic level

### Why Harmful
CGI's process-per-request model is extremely inefficient:
- Each request forks a new PHP process — 10-50ms process creation overhead
- No opcode caching across requests (OpCache works but cache is lost when process dies)
- No persistent database connections (connection per request)
- Process creation overhead adds 50-200% to response time
- No process pooling, no slow log, no status monitoring
- CGI is obsolete — PHP-FPM has been the standard since PHP 5.4 (2012)

### Consequences
- 2-5x higher latency than PHP-FPM for the same application
- 10x+ process creation overhead for each request
- No persistent OpCache across requests (cache populated and lost)
- No process pool management or health monitoring
- High system CPU usage from process forking
- Inability to handle moderate traffic without excessive server resources
- Security concerns from environment variable handling in CGI

### Alternative
Migrate to PHP-FPM immediately:
- PHP-FPM: persistent process pool, opcode caching, connection pooling
- 2-5x throughput improvement over CGI with zero code changes
- Process manager modes for different workload types
- Status monitoring, slow log, per-pool configuration
- This should be the first performance optimization for any CGI-based deployment

### Refactoring Strategy
1. Install PHP-FPM on the server
2. Configure the FPM pool (listen, pm settings, user/group)
3. Update web server configuration to use FastCGI protocol to FPM
4. Remove CGI handler configuration
5. Test all endpoints
6. Compare performance: CGI vs FPM (expect 2-5x improvement)
7. Decommission CGI

### Detection Checklist
- [ ] PHP-FPM used in production (not CGI)
- [ ] No php-cgi processes spawning per request
- [ ] Web server configured for FastCGI proxy (not CGI)
- [ ] Performance benchmark confirms FPM improvement over CGI
- [ ] CGI not recommended or used in any production environment
- [ ] Legacy CGI deployments have migration plan

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Web Server Architectures
- 05-rules.md: Use PHP-FPM, Not CGI
- 07-decision-trees.md: Web Server Architecture Decision Tree
