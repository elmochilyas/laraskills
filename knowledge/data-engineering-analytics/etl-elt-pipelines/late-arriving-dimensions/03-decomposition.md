# Decomposition: Late-Arriving Dimension Handling in Fact Table Loading

## Topic Overview
Late-arriving dimensions occur when a fact record references a dimension key that hasn't been loaded yet. For example, an order references `customer_id = 12345`, but the customer profile hasn't arrived from the CRM system. In traditional star-schema ETL, dimensions must exist before facts reference them.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k033-late-arriving-dimensions/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Late-Arriving Dimension Handling in Fact Table Loading
- **Purpose:** Late-arriving dimensions occur when a fact record references a dimension key that hasn't been loaded yet.
- **Difficulty:** Intermediate
- **Dependencies:** K006 (Star Schema): Fact/dimension modeling context for late-arriving strategies, K014 (Medallion Architecture): Late-arriving dimensions are handled in Silver layer, K030 (SCD Type 1/2): Combined pattern — late-arriving + slowly changing dimensions

## Dependency Graph
**Depends on:**
- K006 (Star Schema): Fact/dimension modeling context for late-arriving strategies
- K014 (Medallion Architecture): Late-arriving dimensions are handled in Silver layer
- K030 (SCD Type 1/2): Combined pattern — late-arriving + slowly changing dimensions

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Late-arriving dimension:
- Early-arriving fact:
- Unknown member / Placeholder row:
- Re-processing / Retroactive update:
- Dimension bridge / Mapping table:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K006 (Star Schema): Fact/dimension modeling context for late-arriving strategies, K014 (Medallion Architecture): Late-arriving dimensions are handled in Silver layer, K030 (SCD Type 1/2): Combined pattern — late-arriving + slowly changing dimensions

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