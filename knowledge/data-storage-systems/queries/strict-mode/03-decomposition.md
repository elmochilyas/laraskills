# Decomposition: 2.30 Strict mode (preventSilentlyDiscardingAttributes, preventAccessingMissingAttributes)

## Topic Overview
Laravel strict mode enables guardrails that prevent silent data loss and debugging frustration. `preventSilentlyDiscardingAttributes` throws an exception when mass-assignment discards unfillable attributes. `preventAccessingMissingAttributes` throws when accessing attributes not loaded or set.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-30-strict-mode/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.30 Strict mode (preventSilentlyDiscardingAttributes, preventAccessingMissingAttributes)
- **Purpose:** Laravel strict mode enables guardrails that prevent silent data loss and debugging frustration. `preventSilentlyDiscardingAttributes` throws an exception when mass-assignment discards unfillable attributes.
- **Difficulty:** Intermediate
- **Dependencies:** 2.17 Casts, 2.24 replicate, fill, forceFill, 2.18 Model serialization

## Dependency Graph
**Depends on:** "2.17 Casts", "2.24 replicate, fill, forceFill", "2.18 Model serialization"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **preventSilentlyDiscardingAttributes**: When mass-assigning, unfillable attributes are silently dropped. This mode throws an exception instead.; - **preventAccessingMissingAttributes**: Accessing a non-existent attribute returns null. This mode throws an exception instead.; - **Environment-specific**: Enable in local/staging/CI. Disable in production (or log instead of throw)..
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