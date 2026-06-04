# Decomposition: Laravel Ingest Configuration Classes

## Topic Overview
Laravel Ingest is a configuration-driven import framework that handles the "L" in ETL — loading data into Laravel from external sources. Unlike ETL Manifesto (which extracts from Laravel), Laravel Ingest imports into Laravel: CSV/Excel/JSON files, API responses, and database connections. Its architecture is based on `IngestDefinition` and `IngestConfig` classes that declare the import schema, validation rules, relationship resolution, and failure handling — treating data imports as declarative configurations rather than procedural scripts.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k005-laravel-ingest/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Laravel Ingest Configuration Classes
- **Purpose:** Laravel Ingest is a configuration-driven import framework that handles the "L" in ETL — loading data into Laravel from external sources.
- **Difficulty:** Foundation
- **Dependencies:** K004 (ETL Manifesto): Complementary export framework (Ingest = import, Manifesto = export), K009 (CSV/Excel/Parquet Export): Shared file format knowledge, K014 (Medallion Architecture): Ingest feeds the Bronze layer

## Dependency Graph
**Depends on:**
- K004 (ETL Manifesto): Complementary export framework (Ingest = import, Manifesto = export)
- K009 (CSV/Excel/Parquet Export): Shared file format knowledge
- K014 (Medallion Architecture): Ingest feeds the Bronze layer

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- IngestDefinition:
- IngestConfig:
- Streaming import:
- Chunked processing:
- Validation pipeline:
- Auto-resolve relationships:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K004 (ETL Manifesto): Complementary export framework (Ingest = import, Manifesto = export), K009 (CSV/Excel/Parquet Export): Shared file format knowledge, K014 (Medallion Architecture): Ingest feeds the Bronze layer

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