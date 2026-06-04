# Decomposition: Neon Serverless PostgreSQL

## Topic Overview
Neon offers serverless PostgreSQL with sub-1 second cold starts, 100 compute-hours free tier, 0.5GB storage free, and paid plans from $0.106/CU-hour. It features instant database branching (copy-on-write) for zero-cost dev/staging databases. Neon is the default database for Laravel Cloud, offering elastic scaling, scale-to-zero, and significant cost advantages over Aurora for variable workloads.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k08-neon-serverless-postgres/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Neon Serverless PostgreSQL
- **Purpose:** Neon offers serverless PostgreSQL with sub-1 second cold starts, 100 compute-hours free tier, 0.5GB storage free, and paid plans from $0.106/CU-hour.
- **Difficulty:** Intermediate
- **Dependencies:** K47: Neon Database Branching, K06: Aurora Serverless v2, K42: Superscript Heroku Migration

## Dependency Graph
**Depends on:**
- K47: Neon Database Branching
- K06: Aurora Serverless v2
- K42: Superscript Heroku Migration

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Compute Units (CU)
- Free tier
- Scale-to-zero
- Cold start
- Database branching
- Laravel Cloud default
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K47: Neon Database Branching, K06: Aurora Serverless v2, K42: Superscript Heroku Migration

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