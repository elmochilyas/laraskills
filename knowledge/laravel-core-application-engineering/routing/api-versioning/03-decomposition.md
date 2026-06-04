# Decomposition: API Versioning

## Topic Overview
Versioning API endpoints at the routing level using route prefixes, controller namespaces, and separate route files per version.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
api-versioning/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### API Versioning
- **Purpose:** Versioning API endpoints at the routing level
- **Difficulty:** Advanced
- **Dependencies:** Route Groups

## Dependency Graph
This KU depends on: Route Groups. It serves as prerequisite for Versioned Resources and Rate Limiting across versions.

## Boundary Analysis
**In scope:** URL path versioning vs header versioning vs media type versioning, controller inheritance pattern, resource versioning, separate route files per version, deprecation header middleware (Sunset, Deprecation), version discovery endpoints, version removal strategies, day-one vs retrofit versioning.
**Out of scope:** Versioned API Resources (versioned-resources KU), Form Request versioning (Form Requests domain), consumer migration strategies (API Design domain), rate limiting per version (rate-limiting KU).

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization