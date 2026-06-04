# Decomposition: Laravel Forge Provisioning & Management

## Topic Overview
Laravel Forge is a first-party server management panel that provisions and manages cloud VPS instances across DigitalOcean, Linode, AWS, Vultr, and Hetzner. It automates the full LEMP/LEMP stack setup — Nginx, PHP-FPM, MySQL/PostgreSQL, Redis, Supervisor, Node.js — and provides a dashboard for ongoing management of sites, SSL certificates, queue workers, cron jobs, firewall rules, and deployment scripts. The 2025 relaunch introduced Laravel VPS (sub-10-second provisioning) and built-in zero-downtime deployments for new sites.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
laravel-forge-provisioning/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Laravel Forge Provisioning & Management
- **Purpose:** Laravel Forge is a first-party server management panel that provisions and manages cloud VPS instances across DigitalOcean, Linode, AWS, Vultr, and Hetzner.
- **Difficulty:** Intermediate
- **Dependencies:** Ploi Server Management (KU-002) — direct competitor, Docker server support, Envoyer Zero-Downtime Deployments (KU-003) — pairs with Forge for multi-server deploys, Environment & Secret Management (KU-021), Observability & Monitoring (KU-022), Deployer PHP (KU-008) — open-source alternative to Envoyer

## Dependency Graph
**Depends on:**
- Ploi Server Management (KU-002) — direct competitor, Docker server support
- Envoyer Zero-Downtime Deployments (KU-003) — pairs with Forge for multi-server deploys
- Environment & Secret Management (KU-021)
- Observability & Monitoring (KU-022)
- Deployer PHP (KU-008) — open-source alternative to Envoyer

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Forge provisions servers with a opinionated-but-configurable stack. Application 
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- Ploi Server Management (KU-002) — direct competitor, Docker server support, Envoyer Zero-Downtime Deployments (KU-003) — pairs with Forge for multi-server deploys, Environment & Secret Management (KU-021), Observability & Monitoring (KU-022), Deployer PHP (KU-008) — open-source alternative to Envoyer

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization