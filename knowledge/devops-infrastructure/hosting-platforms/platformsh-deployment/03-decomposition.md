# Decomposition: Platform.sh Laravel

## Topic Overview
Platform.sh is a Git-driven PaaS where each Git branch automatically creates a full copy of the infrastructure (web server, database, cache, queue) with its own URL. Configuration is via three YAML files: `.platform.app.yaml` (application definition), `routes.yaml` (HTTP routing), and `services.yaml` (backing services). Platform.sh provides built-in Redis, Elasticsearch, RabbitMQ, and managed MariaDB/PostgreSQL.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
platformsh-deployment/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Platform.sh Laravel
- **Purpose:** Platform.sh is a Git-driven PaaS where each Git branch automatically creates a full copy of the infrastructure (web server, database, cache, queue) with its own URL.
- **Difficulty:** Intermediate
- **Dependencies:** Fly.io Deployment (KU-017) — Docker-based alternative, Railway Laravel Deployment (KU-018) — simpler Git-push alternative, Laravel Cloud (KU-016) — managed K8s-based alternative, Laravel Forge Provisioning (KU-001) — server-level alternative, Database Migration in CI (KU-019) — deploy hook migrations

## Dependency Graph
**Depends on:**
- Fly.io Deployment (KU-017) — Docker-based alternative
- Railway Laravel Deployment (KU-018) — simpler Git-push alternative
- Laravel Cloud (KU-016) — managed K8s-based alternative
- Laravel Forge Provisioning (KU-001) — server-level alternative
- Database Migration in CI (KU-019) — deploy hook migrations

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- `.platform.app.yaml`:
- `routes.yaml`:
- `services.yaml`:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- Fly.io Deployment (KU-017) — Docker-based alternative, Railway Laravel Deployment (KU-018) — simpler Git-push alternative, Laravel Cloud (KU-016) — managed K8s-based alternative, Laravel Forge Provisioning (KU-001) — server-level alternative, Database Migration in CI (KU-019) — deploy hook migrations

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