# Decomposition: Unique Enforcement — firstOrCreate vs createOrFirst

## Boundary Analysis
This KU covers Eloquent methods for ensuring unique records under concurrent conditions: `firstOrCreate()`, `createOrFirst()`, `firstOrNew()`, and `updateOrCreate()`. It focuses on the race condition differences between these methods. It excludes bulk upsert operations (`upsert-patterns`), general database constraint definition (`database-constraints`), and locking strategies (`concurrency-handling`).

## Atomicity Assessment
**Status:** ✅ Atomic
Unique enforcement via find-or-create patterns is a single conceptual topic. The two primary methods differ in their approach to atomicity, but the underlying goal — ensure exactly one record matches criteria — is the same.

## Dependency Graph
- **Depends on:** `database-constraints` (unique index requirement for `createOrFirst`)
- **Depends on:** Model creation fundamentals
- **Referenced by:** `first-or-create-vs-create-or-first` (deep comparison)
- **Referenced by:** `upsert-patterns` (bulk alternative)
- **Referenced by:** Registration, slug, and idempotency implementations

## Follow-up Opportunities
- Custom atomic find-or-create using `INSERT ... ON CONFLICT DO NOTHING` (PostgreSQL) or `INSERT IGNORE` (MySQL)
- Distributed unique enforcement with Redis locks
- Application-level hybrid strategies: pessimistic locking + firstOrCreate
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization