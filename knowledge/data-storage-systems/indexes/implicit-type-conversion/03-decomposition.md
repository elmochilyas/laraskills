# Decomposition: 3.29 Implicit type conversion and index bypass

## Topic Overview
Implicit type conversion (type coercion) in WHERE comparisons can bypass indexes. When a string column is compared to an integer, the database casts the column to integer, wrapping it in an implicit function and breaking sargability.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-29-implicit-type-conversion/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.29 Implicit type conversion and index bypass
- **Purpose:** Implicit type conversion (type coercion) in WHERE comparisons can bypass indexes. When a string column is compared to an integer, the database casts the column to integer, wrapping it in an implicit function and breaking sargability.
- **Difficulty:** Intermediate
- **Dependencies:** 3.28 Sargability rule, 4.12 Type mismatch implicit casts

## Dependency Graph
**Depends on:** "3.28 Sargability rule", "4.12 Type mismatch implicit casts"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **String vs integer**: `WHERE varchar_col = 0` — MySQL casts `varchar_col` to integer. Non-numeric strings become 0. Index cannot be used.; - **Fix**: Compare with the correct type. `WHERE varchar_col = '0'` or cast the input to the column's type.; - **Detection**: In EXPLAIN, look for "Using where" with type=ALL. Check CAST operations in Extra..
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