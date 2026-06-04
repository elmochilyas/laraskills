# Decomposition: Health Check Endpoint Design

## Topic Overview
Health check endpoints (`/health`, `/up`, `/ready`) enable load balancers, container orchestrators (Kubernetes, Docker Swarm), and monitoring systems to verify application availability. Laravel 11+ ships a built-in `/up` endpoint that dispatches a `DiagnosingHealth` event. Production health check design distinguishes between _liveness_ (process is alive) and _readiness_ (process can serve traffic) probes, with appropriate depth of dependency checking for each.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
health-checks/health-check-endpoint/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Health Check Endpoint Design
- **Purpose:** Health check endpoints (`/health`, `/up`, `/ready`) enable load balancers, container orchestrators (Kubernetes, Docker Swarm), and monitoring systems to verify application availability. Laravel 11+ ships a built-in `/up` endpoint that dispatches a `DiagnosingHealth` event. Production health check design distinguishes between _liveness_ (process is alive) and _readiness_ (process can serve traffic) probes, with appropriate depth of dependency checking for each.
- **Difficulty:** Intermediate
- **Dependencies:
  - Spatie Laravel Health (full dependency health framework)
  - Laravel Pulse (health metrics visualization)

## Dependency Graph
**Depends on:**
  - Spatie Laravel Health (full dependency health framework)
  - Laravel Pulse (health metrics visualization)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Liveness probe
  - Readiness probe
  - Startup probe
  - DiagnosingHealth event
  - Shallow vs deep health check

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

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