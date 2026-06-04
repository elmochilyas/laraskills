# Decomposition: 2.18 Model serialization (toArray, toJson, hidden, visible, append)

## Topic Overview
Model serialization converts models and collections to arrays or JSON for API responses. The `hidden` and `visible` properties control which attributes are included. `append` adds computed attributes (accessors) to the serialized output.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-18-model-serialization/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.18 Model serialization (toArray, toJson, hidden, visible, append)
- **Purpose:** Model serialization converts models and collections to arrays or JSON for API responses. The `hidden` and `visible` properties control which attributes are included.
- **Difficulty:** Foundation
- **Dependencies:** 2.16 Accessors and mutators, 2.17 Casts, 2.27 API resource classes

## Dependency Graph
**Depends on:** "2.16 Accessors and mutators", "2.17 Casts", "2.27 API resource classes"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **toArray()**: Converts model + loaded relationships to a nested array.; - **toJson()**: JSON-encodes the result of `toArray()`.; - **$hidden**: Array of attribute names to exclude from serialization (passwords, tokens).; - **$visible**: Whitelist of attributes to include (alternative to hidden).; - **$appends**: List of accessor attributes to include in serialization (not stored in DB)..
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