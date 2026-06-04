# Decomposition: 4.12 Type mismatch implicit casts (string vs integer comparison)

## Topic Overview
Comparing a string column to an integer (or vice versa) triggers implicit type conversion that bypasses indexes. MySQL casts the column value, wrapping it in an implicit function. Non-numeric strings cast to 0, producing wrong results and full table scans.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-12-type-mismatch-implicit-casts/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.12 Type mismatch implicit casts (string vs integer comparison)
- **Purpose:** Comparing a string column to an integer (or vice versa) triggers implicit type conversion that bypasses indexes. MySQL casts the column value, wrapping it in an implicit function.
- **Difficulty:** Intermediate
- **Dependencies:** 3.29 Implicit type conversion, 3.28 Sargability rule

## Dependency Graph
**Depends on:** "3.29 Implicit type conversion", "3.28 Sargability rule"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **String vs integer**: `WHERE varchar_status = 0` — MySQL casts every `varchar_status` value to integer. 'pending' becomes 0, 'active' becomes 0. Wrong results. Full scan.; - **Fix**: Compare with the correct type. `WHERE varchar_status = '0'` or cast the input..
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