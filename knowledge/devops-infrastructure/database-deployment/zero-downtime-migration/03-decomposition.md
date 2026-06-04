# Decomposition: Zero-Downtime Migration Strategies

## Topic Overview
Zero-downtime migration strategies enable schema changes on production databases without locking tables or causing application downtime. The core challenge is that MySQL (and most relational databases) lock tables during DDL operations on large datasets, blocking reads and writes for minutes or hours. The two primary tools are `pt-online-schema-change` (Percona Toolkit) and `gh-ost` (GitHub).

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
zero-downtime-migration/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Zero-Downtime Migration Strategies
- **Purpose:** Zero-downtime migration strategies enable schema changes on production databases without locking tables or causing application downtime.
- **Difficulty:** Intermediate
- **Dependencies:** Database Migration in CI (KU-019) — migration execution in deployment, Envoyer Zero-Downtime Deployments (KU-003) — migration ordering, Kubernetes for Laravel (KU-013) — migration Job pattern for zero-downtime, Performance optimization (cross-domain) — query optimization for minimal lock contention

## Dependency Graph
**Depends on:**
- Database Migration in CI (KU-019) — migration execution in deployment
- Envoyer Zero-Downtime Deployments (KU-003) — migration ordering
- Kubernetes for Laravel (KU-013) — migration Job pattern for zero-downtime
- Performance optimization (cross-domain) — query optimization for minimal lock contention

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- The locking problem:** Standard MySQL `ALTER TABLE` operations acquire a schema 
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- Database Migration in CI (KU-019) — migration execution in deployment, Envoyer Zero-Downtime Deployments (KU-003) — migration ordering, Kubernetes for Laravel (KU-013) — migration Job pattern for zero-downtime, Performance optimization (cross-domain) — query optimization for minimal lock contention

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