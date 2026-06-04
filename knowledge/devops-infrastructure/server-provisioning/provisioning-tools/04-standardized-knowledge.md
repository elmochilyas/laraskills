# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 01-server-provisioning
**Knowledge Unit:** provisioning-tools
**Difficulty:** Beginner
**Category:** Server Management & Provisioning
**Last Updated:** 2026-06-03

# Overview

Provisioning tools automate the setup of cloud VPS instances with the full LEMP/LEMP stack required to run Laravel applications. This includes operating system configuration, web server (Nginx), PHP-FPM, database (MySQL/PostgreSQL), caching (Redis), job processing (Supervisor), and asset compilation (Node.js).

Provisioning tools exist because manual server setup is error-prone, time-consuming, and inconsistent. The engineering value is repeatability — every provisioned server starts from the same baseline, eliminating "works on my machine" at the infrastructure level. For teams without dedicated DevOps engineers, provisioning tools reduce the time from clicking "create server" to having a production-ready Laravel environment from hours to minutes.

Engineers should care because the quality of server provisioning directly affects application reliability, security, and performance. A poorly provisioned server leads to 502 errors, security vulnerabilities, and scaling bottlenecks.

# Core Concepts

## Provisioning Workflow
1. **Provider Selection** — Choose cloud provider (DigitalOcean, Linode, AWS, Vultr, Hetzner) based on region, pricing, and feature requirements
2. **Server Sizing** — Select CPU, RAM, and storage based on workload profile
3. **Stack Installation** — Automated installation of Nginx, PHP-FPM, database, Redis, Supervisor
4. **Configuration** — Apply optimized settings for PHP-FPM pools, OPcache, Nginx buffers
5. **Security Baseline** — Configure firewall, SSH hardening, fail2ban, automatic patches

## Server Type Decomposition
- **Application Server** — PHP execution, application code
- **Web Server** — Nginx, SSL termination, static file serving
- **Database Server** — MySQL/PostgreSQL with dedicated I/O
- **Cache Server** — Redis/Memcached for session and cache storage
- **Worker Server** — Queue processing via Supervisor
- **Load Balancer** — Nginx upstream for traffic distribution

## LEMP Stack Components
The LEMP (Linux, Nginx, MySQL/MariaDB, PHP) stack is the standard Laravel hosting foundation. Nginx serves as both web server and reverse proxy, MySQL provides persistence, and PHP-FPM executes application code.

# When To Use

- Small to medium Laravel deployments (1-10 servers)
- Teams needing rapid server setup without DevOps specialization
- Projects requiring traditional LEMP stack familiarity
- Organizations consolidating to a single server management platform
- Teams transitioning from shared hosting to VPS infrastructure

# When NOT To Use

- Serverless architectures that abstract away provisioning entirely
- Container-native deployments (Docker, Kubernetes) with different operational models
- Large-scale fleets requiring infrastructure-as-code version control
- Teams with strong DevOps capabilities who prefer bare-metal control

# Best Practices

**Start Decomposed.** Begin with app+DB separation even at small scale. The cost difference is minimal, and the architectural flexibility is significant.

**Calculate PHP-FPM Settings.** Use memory-based calculation for `pm.max_children` rather than defaults. Default settings cause 502 errors under moderate load.

**Enable OPcache.** Production Laravel runs 5-10x faster with OPcache. Configure `opcache.memory_consumption` based on application footprint.

**Use Deployment Scripts for Releases.** Never upload files directly. Use symlink-swap deployments with atomic rollback.

**Document Server Inventory.** Maintain server records (provider, region, size, installed services, purpose) for operational continuity.

# Architecture Guidelines

Single-server architecture is acceptable for development and low-traffic staging. Production should decompose at minimum into app + database. As traffic grows, add cache, worker, and web server layers.

Load balancing should use dedicated Nginx upstream blocks, not DNS round-robin. Configure health checks to detect and remove unhealthy servers.

# Performance Considerations

**OPcache Hit Ratio.** Target > 95% hit ratio. Low hit ratio means OPcache memory is insufficient for the codebase. Monitor with `opcache_get_status()`.

**PHP-FPM pm Mode.** Use `dynamic` for most production loads. Switch to `ondemand` for servers with tight memory and variable traffic. Use `static` for consistent high-traffic workloads.

**PHP-FPM max_children Formula.** `(total_memory - os_memory - db_memory - redis_memory) / average_php_process_size`. Typical PHP process: 30-50MB.

**Nginx Buffer Tuning.** Increase `proxy_buffers` and `fastcgi_buffers` for large response payloads. Monitor buffer overflow counters in Nginx status.

# Security Considerations

**Firewall Minimization.** Only SSH (22), HTTP (80), and HTTPS (443) should be open to the internet. Database, Redis, and internal services must listen on private interfaces only.

**PHP-FPM Isolation.** Each site should use separate PHP-FPM pool with distinct Unix user. This prevents cross-site file access in multi-tenant setups.

**SSH Hardening.** Disable password authentication, disable root login, use ed25519 keys. Place SSH on a non-standard port or use fail2ban.

**Automated Patches.** Enable unattended-upgrades for security patches. Test on staging before production. Configure failure notifications.

# Common Mistakes

**Overlooking OPcache Reset.** Deploying without resetting OPcache means stale opcode serves until PHP-FPM reload. Always add `artisan opcache:clear` to deployments.

**Using Default PHP-FPM Settings.** Default `pm.max_children=10` works on tiny servers but causes failures on any server with memory for more processes.

**Manual SSH Management.** Editing configs directly via SSH creates unreproducible servers. Use provisioning tools or configuration management.

**Missing Monitoring.** Deploying without monitoring means discovering problems through customer complaints. Always configure monitoring before going live.

# Examples

**PHP-FPM Calculation:**
Server: 4GB RAM, MySQL 1GB, Redis 512MB, OS 512MB
Available for PHP: 4096 - 1024 - 512 - 512 = 2048MB
Average PHP process: 40MB
pm.max_children = 2048 / 40 = 51

**Deployment Directory Layout:**
```
/var/www/app/
├── current -> releases/20250101000000/
├── releases/
│   ├── 20250101000000/
│   └── 20250101020000/
└── shared/
    ├── .env
    ├── storage/
    └── public/uploads/
```

# Related Topics

**Prerequisites:** Basic Linux administration, SSH, DNS
**Closely Related:** Server Hardening, Ploi Server Management, Laravel Forge
**Advanced Follow-Ups:** Docker Containerization, Infrastructure as Code, Kubernetes
**Cross-Domain Connections:** Environment Management, Observability, Security Hardening

# AI Agent Notes

- Provisioning tools set up the stack but do not optimize it. AI agents must generate specific configuration values (OPcache size, PHP-FPM children, Nginx buffers) for each server spec.
- Server type decomposition should be recommended aggressively, even for small projects, because rearchitecting later is expensive.
- Monitoring is not included in provisioning tools. Agents must always recommend monitoring setup as a separate step.
