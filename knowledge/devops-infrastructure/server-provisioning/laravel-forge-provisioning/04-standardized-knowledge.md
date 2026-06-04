# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 01-server-provisioning
**Knowledge Unit:** laravel-forge-provisioning
**Difficulty:** Intermediate
**Category:** Server Management & Provisioning
**Last Updated:** 2026-06-03

# Overview

Laravel Forge is a first-party server management panel that provisions and manages cloud VPS instances across DigitalOcean, Linode, AWS, Vultr, and Hetzner. It automates the full LEMP/LEMP stack setup — Nginx, PHP-FPM, MySQL/PostgreSQL, Redis, Supervisor, Node.js — and provides a dashboard for ongoing management of sites, SSL certificates, queue workers, cron jobs, firewall rules, and deployment scripts.

Forge exists because manual server provisioning is error-prone, inconsistent, and time-consuming. The engineering value lies in eliminating configuration drift across environments, reducing server setup from hours to minutes, and providing a centralized control plane for fleet management. The 2025 relaunch introduced Laravel VPS with sub-10-second provisioning and built-in zero-downtime deployments for new sites, further reducing operational overhead.

Engineers should care because Forge represents the opinionated path to production Laravel hosting — it codifies the recommended LEMP stack configuration, handles OS-level security baselines, and frees teams to focus on application logic rather than infrastructure plumbing.

# Core Concepts

## Provisioning Layer
Forge uses SSH-based provisioning: when a server is created, Forge connects via SSH and runs a provisioning script that installs and configures the entire stack. The provisioning script is deterministic — same inputs produce identical server configurations.

## Server Type Decomposition
Forge supports decomposing infrastructure into purpose-specific server types:
- **App Server** — runs PHP-FPM, serves application code
- **Web Server** — runs Nginx, terminates SSL, proxies to app servers
- **Database Server** — runs MySQL/PostgreSQL, isolated from application traffic
- **Cache Server** — runs Redis/Memcached, dedicated memory for caching
- **Worker Server** — runs Supervisor-managed queue workers, separate from web traffic
- **Load Balancer** — runs Nginx in upstream mode, distributes traffic across web servers

## Stack Components
- **Nginx** — static file serving, reverse proxy, SSL termination, load balancing
- **PHP-FPM** — PHP process manager with configurable pool settings
- **MySQL/PostgreSQL** — relational database with automated backup support
- **Redis** — in-memory cache, session driver, queue backend
- **Supervisor** — process control for queue workers, ensures auto-restart on failure
- **Node.js** — asset compilation pipeline via npm/Yarn

## Deployment Script
Forge deploys use a shell script defined in the dashboard. Standard pattern: clone repository, install Composer dependencies, run migrations, clear caches, symlink to release directory. The script executes on the server and has full access to the application environment.

# When To Use

- Teams deploying Laravel applications on cloud VPS who want managed server administration without fully managed PaaS lock-in
- Single-server to medium-scale multi-server architectures (2-10 servers)
- Projects that benefit from the Forge ecosystem (Envoyer integration, Nightwatch monitoring)
- Teams that need rapid, repeatable server provisioning across multiple cloud providers
- Organizations with moderate operations headcount who want to reduce but not eliminate server management
- Projects requiring traditional LEMP stack with familiar Nginx/PHP-FPM debugging

# When NOT To Use

- Serverless architectures (Laravel Vapor, Bref) where infrastructure management is fully abstracted
- Container-native deployments (Docker Compose, Kubernetes) where Forge's LEMP automation conflicts with container orchestration
- Large-scale fleets (100+ servers) where infrastructure-as-code tools (Terraform, Ansible, Pulumi) provide better repeatability and version control
- Teams already standardized on Ploi with Docker workflows (Ploi's Docker support is a genuine differentiator)
- Applications requiring non-standard stack configurations (e.g., custom PHP builds, alternative web servers)
- Scenarios requiring fine-grained control over OS-level configuration beyond what Forge exposes

# Best Practices

**Use Forge Recipes for Standardization.** Create Forge recipes for common provisioning patterns — a base recipe installs the LEMP stack, an app recipe configures PHP-FPM pools, a monitoring recipe installs Nightwatch. Recipes ensure every provisioned server starts from the same baseline.

**Decompose Server Types Early.** Start with a single server for development, but plan the decomposition into app/web/database/cache/worker servers before production launch. Server type decomposition in Forge is cheap; rearchitecting later is expensive.

**Tie OPcache Reset to Deployments.** Add `php artisan opcache:clear` to the deployment script. Forge does not automatically clear OPcache on deploy, which leads to stale opcode serving until PHP-FPM reloads.

**Calculate PHP-FPM Settings Mathematically.** Use `pm.max_children = (total_ram - os_ram - db_ram - redis_ram) / avg_php_process_size`. Setting arbitrary values causes OOM or underutilization. Forge's default settings are conservative; tune upward based on monitoring.

**Version-Control Deployment Scripts.** Store deployment scripts in `deploy/deploy.sh` in the application repository, not only in the Forge dashboard. This provides audit trail, version history, and the ability to test script changes in staging.

**Integrate Envoyer for Multi-Server Deployments.** Forge manages individual servers well, but Envoyer provides orchestrated zero-downtime deployments across multiple servers. Use Forge to provision servers; use Envoyer to deploy to them.

# Architecture Guidelines

Forge manages servers but does not manage application state. The architectural boundary is OS-level and service-level configuration. Application architecture (service discovery, request routing between decomposed servers, shared session state) must be designed separately.

Load balancing should be external to Forge when traffic justifies it. Forge's load balancer configuration is appropriate for small-scale multi-server setups, but at scale, a dedicated load balancer (HAProxy, AWS ALB, DigitalOcean LB) provides better health checking and traffic management.

Database servers provisioned by Forge should be treated as pets, not cattle. For production, use managed database services (RDS, DigitalOcean Managed DB, etc.) that Forge can connect to but does not manage directly.

# Performance Considerations

**PHP-FPM Process Manager Mode.** Choose `dynamic` for variable traffic, `ondemand` for low-traffic servers with occasional spikes, `static` for consistent high-traffic. `ondemand` saves memory but creates latency on cold starts. `dynamic` provides the best balance for most production workloads.

**OPcache Memory Sizing.** Set `opcache.memory_consumption` to 128MB-512MB based on application footprint. Monitor `opcache_get_status()` hit ratio — a miss rate above 5% indicates insufficient memory.

**Nginx Buffer Tuning.** Forge defaults are safe but not optimized. Increase `fastcgi_buffers` and `proxy_buffers` for applications with large response payloads. Monitor `nginx_status` for buffer overflow counters.

**Redis Connection Pooling.** Forge installs Redis but does not configure connection pooling. For high-throughput applications, configure persistent Redis connections in `config/database.php` to avoid connection churn.

# Security Considerations

**SSH Key Management.** Forge stores your SSH private key for server access. This key becomes a critical asset — protect it, rotate it periodically, and audit its usage. Use separate keys for different environments (staging vs. production).

**Firewall Defaults.** Forge applies a default firewall allowing ports 22, 80, 443. Verify this configuration on every provisioned server. Add internal service ports (e.g., database, Redis) on private network interfaces only.

**PHP-FPM Pool Isolation.** Each Forge site gets its own PHP-FPM pool. Verify that pools use separate Unix users for filesystem isolation. A compromised site should not be able to read other sites' files.

**Service Exposure.** Forge installs services with default configurations. Redis, MySQL, and PostgreSQL listen on localhost by default — verify this after provisioning. Never expose database or cache ports to the public internet.

**.env File Permissions.** Forge sets `.env` permissions to 600. Verify this after deployment. The `.env` file must never be committed to version control or accessible through the web server.

# Common Mistakes

**Skipping OPcache Reset on Deploy.** Developers assume deployment automatically refreshes OPcache. It doesn't. The consequence is stale code serving for minutes until PHP-FPM reload. Always add `php artisan opcache:clear` to the deployment script.

**Using Default PHP-FPM Settings at Scale.** Forge's default `pm.max_children=10` is safe for tiny servers but causes 502 errors under moderate traffic. Calculate the correct value based on server memory and average PHP process size.

**Manual Server Modifications Outside Forge.** Editing Nginx config files directly, installing packages via SSH, or modifying PHP settings manually creates configuration drift that Forge cannot track. Next provisioning or recipe application overwrites these changes silently.

**Shared .env Across Server Types.** In multi-server setups, using the same `.env` with database credentials on a web-only server unnecessarily exposes credentials. Use per-server-type `.env` files with only the connections needed.

**No Monitoring Integration.** Forge provisions the stack but does not monitor it. Deploying without monitoring means you discover problems through customer complaints rather than alerts.

# Anti-Patterns

**Forge-Managed Database for Production.** Using a Forge-provisioned MySQL server on the application server for production traffic. This couples database scaling to application scaling and introduces a single point of failure. Always use managed database services or dedicated database servers.

**Forge as Configuration Management.** Using Forge's dashboard as the source of truth for server configuration. Forge is a provisioning tool, not a configuration management system. Changes made in the dashboard can be overwritten by recipe reapplication. Use infrastructure-as-code (Terraform, Ansible) for repeatable, auditable server configuration.

**Single Server Running All Roles.** Running the web server, database, Redis, and queue workers on a single production server. This creates resource contention (database I/O competes with PHP execution, Redis memory reduces PHP process capacity) and eliminates isolation for fault domains.

# Examples

**Deployment Script Pattern:**
```
git pull origin main
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan queue:restart
php artisan opcache:clear
php artisan view:clear
ln -sfn releases/$(date +%Y%m%d%H%M%S) current
```

**Server Type Decision:** Start single-server for MVP ($24/mo DigitalOcean droplet). At 10k daily active users, split to app+DB servers. At 50k DAU, add Redis cache server and separate worker server. At 200k DAU, add load balancer and web servers.

# Related Topics

**Prerequisites:** Basic Linux administration, SSH concepts, DNS management
**Closely Related:** Ploi Server Management (direct competitor, Docker support), Envoyer Zero-Downtime Deployments (multi-server deploy orchestration)
**Advanced Follow-Ups:** Environment & Secret Management, Observability & Monitoring, Forge API Automation
**Cross-Domain Connections:** Security Hardening (post-provisioning lockdown), Containerization (alternative to LEMP stack)

# AI Agent Notes

- Forge provisions but does not configure application-level settings (OPcache, PHP-FPM tuning, Nginx buffer sizes). AI agents must explicitly generate configuration recommendations and deployment script additions.
- The 2025 Forge relaunch (Laravel VPS, built-in ZDD) changes deployment recommendations — agents should prefer Forge-native ZDD for new sites over Forge+Envoyer for simple cases.
- Forge API tokens enable automated server management from CI/CD pipelines — agents should generate Forge API integration code where appropriate.
- Server type decomposition decisions should be made early and communicated to the team — migrating from single-server to decomposed architecture is significantly more expensive than starting decomposed.
