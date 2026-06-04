# Decomposition: FrankenPHP Standalone Deployments

## Topic Overview
FrankenPHP is a modern PHP application server built as a standalone Go binary that embeds the PHP interpreter and the Caddy web server. It replaces the traditional Nginx + PHP-FPM + PHP stack with a single binary that serves HTTP/1.1, HTTP/2, and HTTP/3 directly. Designed for Laravel Octane, it integrates Caddy's automatic HTTPS, on-demand TLS, and Mercure hub support.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
multi-stage-builds/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### FrankenPHP Standalone Deployments
- **Purpose:** FrankenPHP is a modern PHP application server built as a standalone Go binary that embeds the PHP interpreter and the Caddy web server.
- **Difficulty:** Intermediate
- **Dependencies:** Laravel Octane Deployment (KU-006) — Octane runtime options including FrankenPHP, Production Dockerfiles (KU-010) — multi-stage builds for FrankenPHP, Kubernetes for Laravel (KU-013) — single-container FrankenPHP on K8s, Environment & Secret Management (KU-021) — env injection for FrankenPHP

## Dependency Graph
**Depends on:**
- Laravel Octane Deployment (KU-006) — Octane runtime options including FrankenPHP
- Production Dockerfiles (KU-010) — multi-stage builds for FrankenPHP
- Kubernetes for Laravel (KU-013) — single-container FrankenPHP on K8s
- Environment & Secret Management (KU-021) — env injection for FrankenPHP

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Single-binary architecture
- Octane worker pool management
- Caddy integration and automatic HTTPS
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- Laravel Octane Deployment (KU-006) — Octane runtime options including FrankenPHP, Production Dockerfiles (KU-010) — multi-stage builds for FrankenPHP, Kubernetes for Laravel (KU-013) — single-container FrankenPHP on K8s, Environment & Secret Management (KU-021) — env injection for FrankenPHP

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
