# Decomposition: Php Fpm Graceful Reload Patterns

## Topic Overview
PHP-FPM graceful reload (kill -USR2 <master_pid> or systemctl reload php8.x-fpm) restarts workers **one at a time** without dropping connections. The master process: 1) Reads updated configuration, 2) Spawns new worker pool, 3) New workers start accepting connections, 4) Old workers finish current requests and exit. During transition, both old and new workers coexist.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
deployment-cache-invalidation/php-fpm-graceful-reload-patterns/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Php Fpm Graceful Reload Patterns
- **Purpose:** PHP-FPM graceful reload (kill -USR2 <master_pid> or systemctl reload php8.x-fpm) restarts workers **one at a time** without dropping connections. The master process: 1) Reads updated configuration, 2) Spawns new worker pool, 3) New workers start accepting connections, 4) Old workers finish current requests and exit. During transition, both old and new workers coexist.
- **Difficulty:** Intermediate
- **Dependencies:
  - Green Deployment
  - --

## Dependency Graph
**Depends on:**
  - Green Deployment
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Deployment script
  - SIGTERM instead of SIGUSR2
  - Parking garage model
  - Zero-downtime deployment pipeline

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