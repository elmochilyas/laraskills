# Decomposition: Provisioning Tools

## Topic Overview
Server provisioning tools (primarily Laravel Forge) automate cloud VPS setup with full LEMP stack deployment. Covers provisioning workflows, server type decomposition, OPcache optimization, PHP-FPM configuration, deployment scripts, and scaling patterns from single to multi-server architectures.

## Decomposition Strategy
1. **Provisioning workflow** — Forge server creation, provider integration, LEMP stack installation
2. **Server type decomposition** — Application, Web, Database, Cache, Worker, Load Balancer types
3. **PHP-FPM configuration** — process manager modes, pm.max_children calculation, pool configuration
4. **OPcache optimization** — production configuration, revalidation, clearing on deploy
5. **Deployment patterns** — zero-downtime directory layout, deployment scripts, rollback
6. **SSL management** — Let's Encrypt integration, auto-renewal, certificate monitoring
7. **Load balancing** — Nginx-based load balancer, upstream configuration, health checks

## Proposed Folder Structure
```
server-provisioning/
├── provisioning-tools/
│   ├── 01-knowledge-unit.md  (KU definition)
│   ├── 02-knowledge-unit.md  (detailed knowledge)
│   ├── 03-decomposition.md   (this file)
│   ├── 04-standardized-knowledge.md
│   └── templates/
│       ├── deployment-script.sh
│       ├── php-fpm-calc.sh
│       └── opcache-recommended.ini
```

## Knowledge Unit Inventory
- KU-001: Provisioning Tools — Forge, LEMP stack, server management
- KU-002: Server Hardening — security configuration for Forge-managed servers
- KU-003: Ploi Server Management — competitor, Docker support

## Dependency Graph
- **Prerequisites:** Cloud VPS basics (DigitalOcean, AWS, Linode), SSH, Linux administration
- **Related:** Server Hardening (post-provisioning security), Envoyer (multi-server deploys), Nightwatch (monitoring)
- **Extends:** Single server → decomposed multi-server → orchestrated deployments

## Boundary Analysis
- **In scope:** Forge provisioning, server type decomposition, LEMP stack configuration, deployment scripts, SSL management
- **Out of scope:** Docker-based infrastructure (covered by Docker containerization), Kubernetes orchestration, infrastructure-as-code (Terraform, Ansible)
- **Adjacent:** Server hardening (complementary post-provisioning step), deployment strategies (Envoyer, ZDD)

## Future Expansion Opportunities
- Forge recipe templates for common application patterns
- Forge API integration examples for major CI/CD platforms
- Migration guides: single-server → decomposed → multi-server
- Cost analysis tools for server type decomposition decisions
