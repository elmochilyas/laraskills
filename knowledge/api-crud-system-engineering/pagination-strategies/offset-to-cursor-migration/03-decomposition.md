# Decomposition: Offset-to-Cursor Migration

## Topic Overview
Strategy and implementation for migrating an API from offset pagination to cursor pagination, including dual-pagination support, deprecation headers, client communication, and sunset timelines.

## Decomposition Strategy
This KU is a migration-focused guide that synthesizes offset and cursor pagination knowledge into a practical transition plan. It addresses both technical (dual-controller pattern) and organizational (client communication) aspects.

## Proposed Folder Structure
```
offset-to-cursor-migration/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Offset-to-Cursor Migration
- **Purpose:** Plan and execute a breaking migration from offset to cursor pagination
- **Difficulty:** Advanced
- **Dependencies:** Offset Pagination Design, Cursor Pagination Design, Pagination Strategy Selection

## Dependency Graph
This KU depends on: Offset Pagination Design, Cursor Pagination Design, Pagination Strategy Selection. It is related to: API Versioning Strategies, Deprecation and Sunset Policies.

## Boundary Analysis
**In scope:** Dual-pagination controller pattern, feature flag rollout, deprecation/sunset headers, gradual migration with coexistence period, client communication, backward-compatible total estimation, legacy endpoint LTS strategy, index readiness verification.
**Out of scope:** Cursor encoding specifics (cursor-encoding-strategies KU), performance tuning of cursor pagination (cursor-pagination-performance KU), general API versioning (API versioning KU).

## Future Expansion Opportunities
None — migration patterns are well-established and the technical surface is stable.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization