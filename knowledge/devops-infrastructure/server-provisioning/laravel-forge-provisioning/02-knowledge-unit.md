# Laravel Forge Provisioning

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Server Provisioning
- **Knowledge Unit:** Laravel Forge Provisioning
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Laravel Forge is the first-party server management panel that provisions cloud VPS instances and automates the full LEMP stack setup. It reduces server setup from hours to minutes, eliminates configuration drift, and provides a centralized control plane for fleet management.

---

## Core Concepts

- **SSH-Based Provisioning** — Forge connects via SSH and runs a deterministic provisioning script that installs and configures the entire stack
- **Server Type Decomposition** — App server, web server, database server, cache server, worker server, and load balancer each serve a specific role
- **Stack Components** — Nginx, PHP-FPM, MySQL/PostgreSQL, Redis, Supervisor, and Node.js are installed and configured
- **Deployment Scripts** — Shell scripts defined in the dashboard clone the repo, install dependencies, run migrations, clear caches, and symlink to release directories
- **Forge Recipes** — Reusable provisioning templates that ensure every provisioned server starts from the same baseline

---

## Mental Models

- **Pets vs. Cattle for Databases** — Database servers provisioned by Forge should be treated as pets; use managed database services for production
- **Provisioning Boundary** — Forge manages OS-level and service-level configuration but not application state; service discovery and request routing must be designed separately
- **Decomposition Trajectory** — Start single-server, plan app+DB separation at 10k DAU, add cache/worker at 50k DAU, add load balancer at 200k DAU

---

## Internal Mechanics

Forge's provisioning flow starts when a server is created: the user selects a cloud provider, region, size, and server type. Forge connects via SSH using stored keys, then runs a provisioning script that installs the LEMP stack components. Post-provisioning, the server appears in the dashboard where sites can be added, deployment scripts configured, and recipes applied. Forge monitors server connectivity and displays status but does not actively monitor application health. The 2025 relaunch introduced Laravel VPS with sub-10-second provisioning and built-in zero-downtime deployments for new sites.

---

## Patterns

- **Deployment Script Standardization** — Store deployment scripts in `deploy/deploy.sh` in the repository, not only in the Forge dashboard, for audit trail and version history
- **OPcache Reset on Deploy** — Add `php artisan opcache:clear` to every deployment script; Forge does not automatically clear OPcache
- **PHP-FPM Math** — Calculate `pm.max_children` using `(total_ram - os_ram - db_ram - redis_ram) / avg_php_process_size` rather than relying on defaults

---

## Architectural Decisions

- **Forge vs. Managed Services** — Use Forge for server provisioning and configuration; use managed database services (RDS, DigitalOcean Managed DB) for production databases
- **Forge vs. Envoyer** — Use Forge for individual server management; use Envoyer for orchestrated multi-server zero-downtime deployments
- **Forge vs. IaC** — Use Forge for small to medium fleets (2-10 servers); use Terraform/Ansible/Pulumi for large fleets (100+ servers) where version-controlled infrastructure is critical

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Rapid server provisioning (minutes vs. hours) | Less control over OS-level configuration | Non-standard stack configurations may not be supported |
| Centralized management dashboard | Configuration drift from manual SSH changes | Next provisioning or recipe application overwrites manual changes silently |
| Integrated ecosystem (Envoyer, Nightwatch) | Per-server pricing at scale | Budget grows linearly with fleet size |
| SSH-based management | SSH key becomes critical asset; loss or compromise affects all servers | Key rotation and audit become essential operational practices |

---

## Performance Considerations

Choose PHP-FPM pm mode based on traffic pattern: `dynamic` for most production workloads, `ondemand` for low-traffic servers with spikes, `static` for consistent high-traffic. Set `opcache.memory_consumption` between 128MB-512MB and monitor hit ratio below 5% miss rate. Forge Nginx defaults are safe but not optimized for large response payloads — tune `fastcgi_buffers` and `proxy_buffers` based on monitoring. Configure persistent Redis connections in `config/database.php` for high-throughput applications to avoid connection churn.

---

## Production Considerations

Verify firewall rules on every provisioned server (default allow: 22, 80, 443). Ensure internal service ports use private network interfaces only. Each Forge site should use separate PHP-FPM pools with distinct Unix users for filesystem isolation. Verify `.env` permissions are set to 600. Load balancing should be external to Forge at scale using HAProxy, AWS ALB, or DigitalOcean LB. Forge does not monitor the application — always integrate Nightwatch or third-party monitoring.

---

## Common Mistakes

- **Skipping OPcache Reset** — Developers assume deployment refreshes OPcache automatically; stale opcode serves until PHP-FPM reloads. Always add `php artisan opcache:clear` to the deployment script.
- **Default PHP-FPM Settings at Scale** — Forge's `pm.max_children=10` causes 502 errors under moderate traffic. Calculate the correct value based on server memory.
- **Manual Server Modifications Outside Forge** — Editing configs directly via SSH creates unreproducible configuration drift. Make all changes through Forge recipes or the dashboard.
- **No Monitoring Integration** — Deploying without monitoring means discovering problems through customer complaints. Always configure monitoring before going live.

---

## Failure Modes

- **SSH Key Loss or Compromise** — Detection: failed provisioning, unable to connect to server. Mitigation: rotate SSH keys, audit key usage, use separate keys per environment.
- **Forge-Managed Database Failure** — Single point of failure when database runs on the application server. Mitigation: use managed database services or dedicated database servers.
- **Recipe Overwrite** — Forge recipes overwrite existing configuration without warning. Detection: unexpected configuration changes after recipe application. Mitigation: version-control custom configurations and apply recipes in staging first.
- **Provisioning Timeout** — Large or custom provisioning scripts may exceed SSH session timeouts. Mitigation: break large provisioning into modular recipes, test on staging.

---

## Ecosystem Usage

Forge is the foundation of the Laravel hosting ecosystem. It integrates with Envoyer for multi-server zero-downtime deployments, Nightwatch for production monitoring, and provides an API for automated server management from CI/CD pipelines. The 2025 relaunch includes built-in zero-downtime deployments (Laravel VPS), reducing the dependency on Envoyer for new sites. Forge-managed servers can be targets for deployment tools like Deployer PHP and GitHub Actions.

---

## Related Knowledge Units

### Prerequisites
- Basic Linux administration, SSH concepts, DNS management

### Related Topics
- Ploi Server Management (direct competitor, Docker support)
- Envoyer Zero-Downtime Deployments (multi-server deploy orchestration)
- Server Hardening (post-provisioning lockdown)

### Advanced Follow-up Topics
- Environment & Secret Management
- Observability & Monitoring
- Forge API Automation

---

## Research Notes

Forge provisions servers but does not configure application-level settings. Engineers must generate explicit configuration recommendations for OPcache, PHP-FPM tuning, and Nginx buffer sizes. The 2025 relaunch with built-in ZDD changes deployment recommendations — prefer Forge-native ZDD for new sites over Forge+Envoyer for simple cases. Forge API tokens enable automated server management from CI/CD pipelines. Server type decomposition decisions should be made early as migrating from single-server to decomposed architecture is significantly more expensive.
