# Decomposition: Fly.io Laravel Deployment

## Topic Overview
Fly.io is a Docker-based hosting platform that runs applications on global edge hardware. For Laravel, `fly launch` auto-detects the framework and generates a production Dockerfile with PHP-FPM + Nginx (or FrankenPHP). Deployments are triggered via `fly deploy`, which builds the Docker image and deploys it to the specified region (or multiple regions for global deployments).

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
flyio-deployment/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Fly.io Laravel Deployment
- **Purpose:** Fly.io is a Docker-based hosting platform that runs applications on global edge hardware.
- **Difficulty:** Intermediate
- **Dependencies:** Railway Laravel Deployment (KU-018) — comparable Docker-based platform, Platform.sh Laravel (KU-019) — Git-push deployment model, Laravel Cloud (KU-016) — fully managed alternative, Production Dockerfiles (KU-010) — Dockerfile patterns for Fly.io, Laravel Octane (KU-006) — Octane on Fly.io

## Dependency Graph
**Depends on:**
- Railway Laravel Deployment (KU-018) — comparable Docker-based platform
- Platform.sh Laravel (KU-019) — Git-push deployment model
- Laravel Cloud (KU-016) — fully managed alternative
- Production Dockerfiles (KU-010) — Dockerfile patterns for Fly.io
- Laravel Octane (KU-006) — Octane on Fly.io

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Fly Machines:** Lightweight VMs that run Docker containers. Each Fly App consist
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- Railway Laravel Deployment (KU-018) — comparable Docker-based platform, Platform.sh Laravel (KU-019) — Git-push deployment model, Laravel Cloud (KU-016) — fully managed alternative, Production Dockerfiles (KU-010) — Dockerfile patterns for Fly.io, Laravel Octane (KU-006) — Octane on Fly.io

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