# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** PHP Engine & Version Performance
**Knowledge Unit:** Web Server Architectures â€” CGI, FastCGI, PHP-FPM SAPI, Embedded SAPI
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Use PHP-FPM for standard deployments**: It's the most battle-tested, feature-rich, and well-documented option for PHP production.
- [ ] **Prefer Unix sockets over TCP**: Unix sockets are 15-25% faster than TCP loopback for PHP-FPM communication because they bypass the network stack.
- [ ] **Consider FrankenPHP for simplicity**: A single binary replacing Nginx + PHP-FPM + certbot reduces operational complexity.
- [ ] **Embedded SAPI for maximum performance**: Eliminates inter-process communication overhead entirely. FrankenPHP's embedded SAPI provides 3-5x throughput vs PHP-FPM.
- [ ] PHP-FPM used for standard deployments (not CGI)
- [ ] Unix socket configured instead of TCP (if same-machine)
- [ ] PHP-FPM not exposed directly to the internet
- [ ] pm.max_children and pm.max_requests properly tuned
- [ ] If using FrankenPHP: PHP compiled with --enable-zts
- [ ] Web server architecture selected based on documented requirements
- [ ] Baseline vs new architecture benchmark completed
- [ ] Throughput meets or exceeds requirements
- [ ] SSL/TLS configured correctly with A+ rating
- [ ] Team trained on new architecture operations
- [ ] Current architecture baseline measured
- [ ] Candidate architecture selected based on requirements
- [ ] Candidate benchmarked with production workload
- [ ] SSL/TLS configuration tested (certificates, cipher suites)
- [ ] Static file caching configured (Cache-Control headers, expires)
- [ ] Slow client buffering configured (proxy_buffering, fastcgi_buffering)

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Shared-nothing architecture** (PHP-FPM): Each request is isolated in a separate OS process. Maximizes fault isolation at the cost of per-request bootstrap overhead. Best for multi-tenant hosting where isolation is prioritized.
- [ ] **Memory-resident architecture** (Octane/Swoole): Boot once, handle many. Reduces latency by 60-90% for framework-heavy applications but introduces state management complexity. Best for dedicated API servers with controlled code deployments.
- [ ] **Event-driven coroutines** (Swoole/FrankenPHP): Single process handles many concurrent requests via coroutine switching. Memory efficiency is high but requires non-blocking I/O for all operations.
- [ ] **Nginx + PHP-FPM**: The dominant architecture â€” Nginx proxies requests to PHP-FPM via FastCGI protocol. Unix sockets preferred over TCP for lower latency.
- [ ] **FrankenPHP (embedded)**: Caddy server with embedded PHP via CGO. Single binary, automatic HTTPS, HTTP/3. Thread-based concurrency with ZTS.
- [ ] **Apache + mod_php**: Deprecated. Legacy architecture where PHP is loaded as an Apache module. Not recommended for new deployments.
- [ ] Document and follow through on architectural decision: Web server architecture selection
- [ ] Document and follow through on architectural decision: TCP vs Unix socket for FPM communication
- [ ] Document and follow through on architectural decision: PHP-FPM vs embedded SAPI (FrankenPHP)
- [ ] Ensure architecture aligns with core concept: **CGI**: Fork a PHP process per request. High overhead. Effectively deprecated.
- [ ] Ensure architecture aligns with core concept: **FastCGI**: Long-running PHP processes managed by a process manager. Nginx communicates via TCP socket or Unix socket.
- [ ] Ensure architecture aligns with core concept: **PHP-FPM**: Enhanced FastCGI implementation. Adds process pool management (static/dynamic/ondemand), slow log, status page, per-pool configuration. The standard for PHP production deployments.
- [ ] Ensure architecture aligns with core concept: **Embedded SAPI**: PHP interpreter linked directly as a library. Used by FrankenPHP (CGO-embedded via Caddy), Apache mod_php (deprecated), and custom runtimes. Lowest latency, but requires thread-safe (ZTS) PHP compilation.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Use PHP-FPM for standard deployments**: It's the most battle-tested, feature-rich, and well-documented option for PHP production.
- [ ] **Prefer Unix sockets over TCP**: Unix sockets are 15-25% faster than TCP loopback for PHP-FPM communication because they bypass the network stack.
- [ ] **Consider FrankenPHP for simplicity**: A single binary replacing Nginx + PHP-FPM + certbot reduces operational complexity.
- [ ] **Embedded SAPI for maximum performance**: Eliminates inter-process communication overhead entirely. FrankenPHP's embedded SAPI provides 3-5x throughput vs PHP-FPM.
- [ ] Document current architecture: web server type, PHP handler, SSL termination, reverse proxy setup
- [ ] Measure current throughput and p95 latency to establish baseline
- [ ] Identify architecture-specific bottlenecks: slow-connection buffering, SSL overhead, static file serving
- [ ] For high-concurrency static + dynamic workloads: select Nginx + PHP-FPM (event-driven, buffers slow clients)
- [ ] For maximum simplicity and HTTP/3 support: select FrankenPHP (Caddy + PHP in single binary)
- [ ] For Laravel Octane: select RoadRunner (octane:start --server=roadrunner)
- [ ] For legacy applications requiring .htaccess compatibility: stay with Apache
- [ ] Benchmark candidate architecture against current baseline with production workload
- [ ] If throughput improvement <10%, stay with current architecture â€” migration effort not justified
- [ ] Deploy using blue-green strategy with rollback

# Performance Checklist (from 04/06)
- [ ] Shared-nothing (FPM)
- [ ] Memory-resident (Octane)
- [ ] JIT compilation
- [ ] OpCache

# Security Checklist (from 04/06 - only if relevant)
- [ ] PHP-FPM pools can be isolated per-user for multi-tenant security
- [ ] Unix socket permissions control which users can communicate with PHP-FPM
- [ ] Embedded SAPI (FrankenPHP) has a smaller attack surface (no FastCGI protocol parsing)
- [ ] CGI is less secure due to process-per-request environment variable handling

# Reliability Checklist (from 04/05/06)
- [ ] **Deadlock**: PHP-FPM workers deadlocked on shared resource (file lock, database connection pool). Symptom: active workers plateau at max_children, no requests complete. Mitigation: Set request_terminate_timeout to kill stuck workers.
- [ ] **Memory exhaustion**: PHP worker exceeds memory_limit. Symptom: PHP Fatal error "Allowed memory size exhausted". Mitigation: Increase limit or optimize memory usage. Root cause analysis via memory profiler.
- [ ] **File descriptor exhaustion**: OpCache or PHP worker runs out of file descriptors. Symptom: "Too many open files" errors. Mitigation: Increase ulimit -n in systemd service file.
- [ ] **PHP version lifecycle**: Always run a supported PHP version (currently 8.1+). Each minor version brings 5-15% performance improvement. Upgrade within 3 months of release.
- [ ] **Configuration audit**: Check memory_limit, max_execution_time, max_input_vars, ealpath_cache_size are tuned for your application. Defaults are conservative.
- [ ] **Error handling**: display_errors=Off, log_errors=On, error_reporting=E_ALL. Never show errors to users.

# Testing Checklist (from 04/06)
- [ ] PHP-FPM used for standard deployments (not CGI)
- [ ] Unix socket configured instead of TCP (if same-machine)
- [ ] PHP-FPM not exposed directly to the internet
- [ ] pm.max_children and pm.max_requests properly tuned
- [ ] If using FrankenPHP: PHP compiled with --enable-zts
- [ ] Deployment architecture documented and understood
- [ ] Web server architecture selected based on documented requirements
- [ ] Baseline vs new architecture benchmark completed
- [ ] Throughput meets or exceeds requirements
- [ ] SSL/TLS configured correctly with A+ rating
- [ ] Team trained on new architecture operations
- [ ] Current architecture baseline measured
- [ ] Candidate architecture selected based on requirements
- [ ] Candidate benchmarked with production workload
- [ ] SSL/TLS configuration tested (certificates, cipher suites)
- [ ] Static file caching configured (Cache-Control headers, expires)
- [ ] Slow client buffering configured (proxy_buffering, fastcgi_buffering)
- [ ] Deployment automation updated for new architecture

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Use PHP-FPM for standard deployments**: It's the most battle-tested, feature-rich, and well-documented option for PHP production.
- [ ] **Prefer Unix sockets over TCP**: Unix sockets are 15-25% faster than TCP loopback for PHP-FPM communication because they bypass the network stack.
- [ ] **Consider FrankenPHP for simplicity**: A single binary replacing Nginx + PHP-FPM + certbot reduces operational complexity.
- [ ] **Embedded SAPI for maximum performance**: Eliminates inter-process communication overhead entirely. FrankenPHP's embedded SAPI provides 3-5x throughput vs PHP-FPM.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using TCP instead of Unix socket
- [ ] Avoid: PHP-FPM without process management
- [ ] Avoid: Not enabling ZTS for FrankenPHP
- [ ] Avoid: Keeping CGI in production
- [ ] Avoid anti-pattern: **Using Apache mod_php for new projects**: Deprecated architecture with poor isolation and performance. Use PHP-FPM with Nginx or FrankenPHP.
- [ ] Avoid anti-pattern: **Mixing PHP-FPM and mod_php**: Different SAPIs have different configuration and behavior. Standardize on one architecture.
- [ ] Avoid anti-pattern: **Exposing PHP-FPM directly to the internet**: PHP-FPM should only listen on localhost or Unix socket. Always use a reverse proxy (Nginx, Caddy) in front.
- [ ] Guard against anti-pattern: Using TCP Instead of Unix Socket for Same-Machine FPM
- [ ] Guard against anti-pattern: Exposing PHP-FPM Directly to the Internet
- [ ] Guard against anti-pattern: Using Apache mod_php for New Projects
- [ ] Guard against anti-pattern: PHP-FPM Without Process Manager Configuration
- [ ] Guard against anti-pattern: Keeping CGI in Production
- [ ] Nginx and PHP-FPM on same machine
- [ ] Unix socket configured (not TCP loopback)

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **PHP version lifecycle**: Always run a supported PHP version (currently 8.1+). Each minor version brings 5-15% performance improvement. Upgrade within 3 months of release.
- [ ] **Configuration audit**: Check memory_limit, max_execution_time, max_input_vars, ealpath_cache_size are tuned for your application. Defaults are conservative.
- [ ] **Error handling**: display_errors=Off, log_errors=On, error_reporting=E_ALL. Never show errors to users.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **CGI**: Fork a PHP process per request. High overhead. Effectively deprecated., **FastCGI**: Long-running PHP processes managed by a process manager. Nginx communicates via TCP socket or Unix socket., **PHP-FPM**: Enhanced FastCGI implementation. Adds process pool management (static/dynamic/ondemand), slow log, status page, per-pool configuration. The standard for PHP production deployments., **Embedded SAPI**: PHP interpreter linked directly as a library. Used by FrankenPHP (CGO-embedded via Caddy), Apache mod_php (deprecated), and custom runtimes. Lowest latency, but requires thread-safe (ZTS) PHP compilation.
**Skills:** FPM Process Manager Mode Selection, FrankenPHP Installation and Caddyfile Configuration, RoadRunner Installation and Configuration
**Decision Trees:** Web server architecture selection, TCP vs Unix socket for FPM communication, PHP-FPM vs embedded SAPI (FrankenPHP)
**Anti-Patterns:** Using TCP Instead of Unix Socket for Same-Machine FPM, Exposing PHP-FPM Directly to the Internet, Using Apache mod_php for New Projects, PHP-FPM Without Process Manager Configuration, Keeping CGI in Production
**Related Topics:** Shared-Nothing Architecture, Memory-Resident Architecture, PHP-FPM Process Manager Modes, FrankenPHP Architecture, Web Server Configuration

