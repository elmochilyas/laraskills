# Decomposition: 4.13 N+1 detection and elimination strategies

## Topic Overview
N+1 is the most common performance problem in Eloquent applications. It occurs when a relationship is lazy-loaded inside a loop, generating N+1 queries (1 for the parent, N for each child). Detection: look for repeated query patterns with different WHERE values.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-13-n-plus-one-detection-elimination/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.13 N+1 detection and elimination strategies
- **Purpose:** N+1 is the most common performance problem in Eloquent applications. It occurs when a relationship is lazy-loaded inside a loop, generating N+1 queries (1 for the parent, N for each child).
- **Difficulty:** Foundation
- **Dependencies:** 2.3 Eager loading, 2.4 Lazy loading prevention, 2.7 Relationship counting, 2.28 N+1 detection via Telescope

## Dependency Graph
**Depends on:** "2.3 Eager loading", "2.4 Lazy loading prevention", "2.7 Relationship counting", "2.28 N+1 detection via Telescope"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Pattern**: 1 query + N queries (where N = number of parent rows).; - **Eager loading**: `Post::with('comments')` — 2 queries total (1 for posts, 1 for comments).; - **Hidden N+1**: In Blade views, API resources, accessors, policies — any place where relationship access happens outside the controller..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization