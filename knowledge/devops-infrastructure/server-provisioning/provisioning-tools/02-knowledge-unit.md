# Provisioning Tools

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Server Provisioning
- **Knowledge Unit:** Provisioning Tools
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-04

---

## Executive Summary

Provisioning tools automate the setup of cloud VPS instances with the full LEMP stack required to run Laravel applications. They eliminate manual server setup errors and reduce the time from creating a server to having a production-ready environment from hours to minutes.

---

## Core Concepts

- **Provisioning Workflow** — Provider selection, server sizing, stack installation, configuration, and security baseline applied sequentially
- **Server Type Decomposition** — Application, web, database, cache, worker, and load balancer servers each serve distinct roles
- **LEMP Stack Components** — Linux, Nginx, MySQL/MariaDB, PHP-FPM form the standard Laravel hosting foundation
- **Symlink-Swap Deployments** — Atomic releases using `current` symlink pointing to numbered release directories
- **Configuration Drift** — Servers deviate from their provisioned baseline over time; tools should be re-applied periodically

---

## Mental Models

- **Server as Cattle** — Provisioned servers should be disposable and reproducible; never manually configure a server that you couldn't replace in minutes
- **Decomposition Early** — Separate app and database servers even at small scale; the cost difference is minimal and the architectural flexibility is significant
- **Defaults Are Floor, Not Ceiling** — Tool defaults are safe minimums; production requires calculated customizations for PHP-FPM, OPcache, and Nginx

---

## Internal Mechanics

A provisioning tool connects to a fresh VPS via SSH (or through a cloud provider API), identifies the OS version, and executes a deterministic script that installs and configures each stack component. The script typically: updates package repositories, installs Nginx with site configuration, installs PHP-FPM with specified version and extensions, installs and secures MySQL/PostgreSQL, installs Redis, configures Supervisor for queue workers, installs Node.js for asset compilation, and applies firewall rules. The entire process takes 5-15 minutes depending on provider and stack complexity.

---

## Patterns

- **PHP-FPM Calculation Formula** — `pm.max_children = (total_ram - os_ram - db_ram - redis_ram) / avg_php_process_size` where typical PHP process is 30-50MB
- **OPcache Configuration** — Set `opcache.memory_consumption` based on application footprint; target >95% hit ratio monitored via `opcache_get_status()`
- **Deployment Directory Layout** — Use `releases/`, `current -> releases/timestamp/`, `shared/` pattern for atomic rollback-capable deployments

---

## Architectural Decisions

- **Forge/Ploi vs. Manual Provisioning** — Use Forge or Ploi for teams without dedicated DevOps; use manual provisioning scripts or IaC for teams needing fine-grained control
- **Single Server vs. Decomposed** — Accept single-server for development and low-traffic staging; decompose to at least app + database for production
- **Provisioning vs. Configuration Management** — Provisioning tools set up the stack; configuration management tools (Ansible, Chef) maintain ongoing state. For simple deployments, provisioning tools suffice alone.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Rapid, repeatable server setup | Less control over OS-level configuration | Non-standard stacks may not be supported |
| Standardized environments | Tool lock-in | Migrating between tools requires re-provisioning |
| Reduced DevOps skill requirement | Default settings are not production-optimized | Must manually tune PHP-FPM, OPcache, Nginx |
| Integrated monitoring not included | Separate monitoring setup required | Easy to forget monitoring until incidents occur |

---

## Performance Considerations

OPcache is critical — production Laravel runs 5-10x faster with OPcache enabled. PHP-FPM `pm` mode selection depends on traffic: `dynamic` for most production loads, `ondemand` for tight memory/variable traffic, `static` for consistent high-traffic workloads. Nginx buffer tuning (`proxy_buffers`, `fastcgi_buffers`) should be increased for applications with large response payloads. Monitor buffer overflow counters in Nginx status.

---

## Production Considerations

Server inventory documentation is essential for operational continuity — maintain records of provider, region, size, installed services, and purpose. Configure unattended-upgrades for security patches with testing on staging first. SSH hardening (disable password auth, disable root login, use ed25519 keys) should be applied at provisioning time. Set up firewall with default-deny policy allowing only ports 22, 80, 443.

---

## Common Mistakes

- **Overlooking OPcache Reset** — Deploying code without resetting OPcache serves stale opcode until PHP-FPM reloads. Always add `artisan opcache:clear` to deployment scripts.
- **Default PHP-FPM Settings** — Default `pm.max_children=10` causes failures on any server with memory for more processes. Calculate based on available memory.
- **Manual SSH Management** — Editing configs directly via SSH creates unreproducible servers. Always use provisioning tools or configuration management.
- **Missing Monitoring** — Deploying without monitoring means discovering problems through customer complaints. Configure monitoring before going live.

---

## Failure Modes

- **Incorrect PHP-FPM Calculation** — Overestimating `max_children` causes OOM kills; underestimating causes 502 errors under load. Monitor PHP-FPM process count and memory usage.
- **Unattended-Upgrade Breakage** — Automatic patches can break application compatibility if critical packages (PHP, Nginx) are updated. Pin critical packages and test upgrades on staging.
- **Firewall Misconfiguration** — Blocking legitimate traffic (CI/CD, monitoring) or leaving internal services exposed. Mitigation: test firewall rules after every change, use private networking.
- **Disk Space Exhaustion** — Release directories accumulate without retention policy. Configure release retention (3-5 releases) and set up disk usage monitoring.

---

## Ecosystem Usage

Provisioning tools are the entry point to Laravel hosting. Forge (first-party) and Ploi (third-party) provide managed provisioning with dashboards. These tools set up the base stack that deployment tools (Envoyer, Deployer PHP) and monitoring tools (Nightwatch, Pulse, Telescope) operate on top of. Provisioning tools do not include monitoring — this must be added separately.

---

## Related Knowledge Units

### Prerequisites
- Basic Linux administration, SSH concepts, DNS management

### Related Topics
- Server Hardening (post-provisioning security lockdown)
- Laravel Forge Provisioning
- Ploi Server Management

### Advanced Follow-up Topics
- Docker Containerization
- Infrastructure as Code
- Kubernetes Orchestration

---

## Research Notes

Provisioning tools set up the stack but do not optimize it. Engineers must generate specific configuration values (OPcache size, PHP-FPM children, Nginx buffers) for each server specification. Server type decomposition should be recommended aggressively because rearchitecting later is expensive. Monitoring is not included in provisioning tools — always recommend monitoring setup as a separate step.
