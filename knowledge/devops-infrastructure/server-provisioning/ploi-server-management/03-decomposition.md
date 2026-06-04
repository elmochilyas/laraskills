# Decomposition: Ploi Server Management

## Topic Overview
Ploi is a third-party server management panel competing directly with Laravel Forge. It supports provisioning across DigitalOcean, Linode, AWS, Vultr, Hetzner, and others. Key differentiators include built-in Docker server support, staging site management with automatic SSL, load balancer configuration, status pages, and a free tier.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ploi-server-management/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Ploi Server Management
- **Purpose:** Ploi is a third-party server management panel competing directly with Laravel Forge.
- **Difficulty:** Intermediate
- **Dependencies:** Laravel Forge Provisioning & Management (KU-001) — primary alternative, Deployer PHP (KU-008) — can be used with Ploi-managed servers, Environment & Secret Management (KU-021)

## Dependency Graph
**Depends on:**
- Laravel Forge Provisioning & Management (KU-001) — primary alternative
- Deployer PHP (KU-008) — can be used with Ploi-managed servers
- Environment & Secret Management (KU-021)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Ploi manages servers through an agent-based architecture — a Ploi agent runs o
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- Laravel Forge Provisioning & Management (KU-001) — primary alternative, Deployer PHP (KU-008) — can be used with Ploi-managed servers, Environment & Secret Management (KU-021)

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