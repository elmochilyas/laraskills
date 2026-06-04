# Decomposition: Data Vault 2.0 Modeling (Hub/Link/Satellite/PIT/Bridge)

## Topic Overview
Data Vault 2.0 is an enterprise-grade data modeling methodology that separates data integration into three core constructs: Hubs (business keys), Links (relationships), and Satellites (context attributes). Unlike star schema (optimized for query performance) or 3NF (optimized for storage efficiency), Data Vault is optimized for auditability, flexibility, and parallel loading. It is ideal for large-scale data warehouses integrating from multiple heterogeneous sources where schema agility and full historical tracking are requirements.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k044-data-vault-20/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Data Vault 2.0 Modeling (Hub/Link/Satellite/PIT/Bridge)
- **Purpose:** Data Vault 2.0 is an enterprise-grade data modeling methodology that separates data integration into three core constructs: Hubs (business keys), Links (relationships), and Satellites (context attributes).
- **Difficulty:** Advanced
- **Dependencies:** K006 (Star Schema): Contrast — Data Vault vs star schema decision framework, K014 (Medallion Architecture: Data Vault can replace or complement medallion — Hubs/Links ≈ Silver, Satellites ≈ Silver detail, K029 (Temporal Queries): PIT tables enable temporal query patterns, K030 (SCD Type 1/2): Data Vault's satellite effective-dating subsumes SCD Type 2

## Dependency Graph
**Depends on:**
- K006 (Star Schema): Contrast — Data Vault vs star schema decision framework
- K014 (Medallion Architecture: Data Vault can replace or complement medallion — Hubs/Links ≈ Silver, Satellites ≈ Silver detail
- K029 (Temporal Queries): PIT tables enable temporal query patterns
- K030 (SCD Type 1/2): Data Vault's satellite effective-dating subsumes SCD Type 2

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Hub:
- Link:
- Satellite:
- PIT (Point-In-Time) table:
- Bridge table:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K006 (Star Schema): Contrast — Data Vault vs star schema decision framework, K014 (Medallion Architecture: Data Vault can replace or complement medallion — Hubs/Links ≈ Silver, Satellites ≈ Silver detail, K029 (Temporal Queries): PIT tables enable temporal query patterns, K030 (SCD Type 1/2): Data Vault's satellite effective-dating subsumes SCD Type 2

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