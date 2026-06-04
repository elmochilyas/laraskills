# Decomposition: Superscript 30% Cost Savings (Heroku to Cloud)

## Topic Overview
Superscript achieved 30% cost savings migrating from Heroku to Laravel Private Cloud. Heroku's premium pricing for managed PostgreSQL and dyno hours was replaced by Cloud's Fargate containers with Neon PostgreSQL. The migration also improved performance via Octane and reduced operational complexity.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k42-superscript-heroku-migration/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Superscript 30% Cost Savings (Heroku to Cloud)
- **Purpose:** Superscript achieved 30% cost savings migrating from Heroku to Laravel Private Cloud.
- **Difficulty:** Advanced
- **Dependencies:** K27: Laravel Cloud vs Vapor, K08: Neon Serverless PostgreSQL, K38: Laravel Octane Throughput

## Dependency Graph
**Depends on:**
- K27: Laravel Cloud vs Vapor
- K08: Neon Serverless PostgreSQL
- K38: Laravel Octane Throughput

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Migration path
- 30% savings
- Database change
- Runtime change
- Heroku premium
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K27: Laravel Cloud vs Vapor, K08: Neon Serverless PostgreSQL, K38: Laravel Octane Throughput

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