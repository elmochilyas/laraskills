# Decomposition: SCD Type 1/2 Dimension Handling in Laravel Star-Schema

## Topic Overview
Slowly Changing Dimensions (SCD) manage how dimension tables handle attribute changes over time in a star schema. Type 1 overwrites the attribute, losing history. Type 2 preserves history by adding new rows with date-effective ranges.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k030-scd-dimensions/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### SCD Type 1/2 Dimension Handling in Laravel Star-Schema
- **Purpose:** Slowly Changing Dimensions (SCD) manage how dimension tables handle attribute changes over time in a star schema.
- **Difficulty:** Intermediate
- **Dependencies:** K006 (Star Schema): Dimension modeling fundamentals that SCD extends, K033 (Late-Arriving Dimensions): Fact loading when facts arrive after their related dimension has changed, K014 (Medallion Architecture): SCD is typically implemented in the Silver → Gold transformation, K004 (ETL Manifesto): ETL framework that supports SCD dimension configuration

## Dependency Graph
**Depends on:**
- K006 (Star Schema): Dimension modeling fundamentals that SCD extends
- K033 (Late-Arriving Dimensions): Fact loading when facts arrive after their related dimension has changed
- K014 (Medallion Architecture): SCD is typically implemented in the Silver → Gold transformation
- K004 (ETL Manifesto): ETL framework that supports SCD dimension configuration

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- SCD Type 1 (Overwrite):
- SCD Type 2 (Row Versioning):
- SCD Type 3 (Attribute Addition):
- SCD Type 0 (Retain):
- Surrogate key + natural key:
- Current row marker:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K006 (Star Schema): Dimension modeling fundamentals that SCD extends, K033 (Late-Arriving Dimensions): Fact loading when facts arrive after their related dimension has changed, K014 (Medallion Architecture): SCD is typically implemented in the Silver → Gold transformation, K004 (ETL Manifesto): ETL framework that supports SCD dimension configuration

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