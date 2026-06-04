# Decomposition: Production Dockerfiles & Multi-Stage Builds

## Topic Overview
Production Dockerfiles for Laravel use multi-stage builds to minimize final image size by separating dependency installation (Composer) and asset building (Node) into intermediate stages, copying only the results into the final runtime image. Typical architecture separates Nginx (serving static files, reverse-proxying PHP) from PHP-FPM (executing application code) into different containers, or combines them using Supervisor for simpler deployments.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
docker-compose-laravel/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Production Dockerfiles & Multi-Stage Builds
- **Purpose:** Production Dockerfiles for Laravel use multi-stage builds to minimize final image size by separating dependency installation (Composer) and asset building (Node) into intermediate stages, copying only the results into the final runtime image.
- **Difficulty:** Intermediate
- **Dependencies:** Laravel Sail (KU-009) — development Docker with shared base image patterns, FrankenPHP Standalone Deployments (KU-012) — alternative combined PHP+server image, Kubernetes for Laravel (KU-013) — container orchestration using these images, Laravel Octane Deployment (KU-006) — Dockerfile considerations for Octane

## Dependency Graph
**Depends on:**
- Laravel Sail (KU-009) — development Docker with shared base image patterns
- FrankenPHP Standalone Deployments (KU-012) — alternative combined PHP+server image
- Kubernetes for Laravel (KU-013) — container orchestration using these images
- Laravel Octane Deployment (KU-006) — Dockerfile considerations for Octane

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Multi-stage build stages (vendor, node, runtime)
- OPcache configuration in Dockerfile
- Nginx + PHP-FPM split pattern
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- Laravel Sail (KU-009) — development Docker with shared base image patterns, FrankenPHP Standalone Deployments (KU-012) — alternative combined PHP+server image, Kubernetes for Laravel (KU-013) — container orchestration using these images, Laravel Octane Deployment (KU-006) — Dockerfile considerations for Octane

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
