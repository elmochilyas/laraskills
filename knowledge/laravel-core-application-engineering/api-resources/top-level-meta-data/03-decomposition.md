# Decomposition: Top-level Meta Data

## Topic Overview
Adding custom key-value pairs to the resource response outside the data envelope — for timestamps, request IDs, or application-specific metadata.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
top-level-meta-data/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Top-level Meta Data
- **Purpose:** Custom key-value pairs outside the data envelope
- **Difficulty:** Advanced
- **Dependencies:** Resource Fundamentals

## Dependency Graph
This KU depends on: Resource Fundamentals. It serves as prerequisite for JSON:API Resources (top-level meta in jsonapi format).

## Boundary Analysis
**In scope:** with() method for additional response keys, toResponse() Response object manipulation, additional() array trait method, ResponseData meta parameter construction, mergeWithResponseData for additional root keys, merging with pagination metadata, deferred metadata via jsonSerialize and DeferrableProvider pattern.
**Out of scope:** Pagination-specific metadata (pagination-metadata KU), JSON:API top-level members (json-api-resources KU), response middleware for injecting global metadata (Middleware domain).

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