# Decomposition: CSV/Excel/Parquet Export with Chunked Processing

## Topic Overview
Data export is the final mile of the analytics pipeline — transforming query results into downloadable files for end users (CSV, Excel) or data lakes (Parquet). The core engineering challenge is memory: naive collection-based exports load all data into PHP memory, causing OOM crashes on datasets > 100K rows. Chunked processing — reading from the database in smaller batches, writing to the output format incrementally — is mandatory for production-scale exports.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k009-csv-excel-parquet-export/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### CSV/Excel/Parquet Export with Chunked Processing
- **Purpose:** Data export is the final mile of the analytics pipeline — transforming query results into downloadable files for end users (CSV, Excel) or data lakes (Parquet).
- **Difficulty:** Intermediate
- **Dependencies:** K004 (ETL Manifesto): Export-oriented ETL — the export framework equivalent of this KU, K005 (Laravel Ingest): Import framework — reverse of export flow, K002 (Queue Dispatching): Queue-based exports for large file generation

## Dependency Graph
**Depends on:**
- K004 (ETL Manifesto): Export-oriented ETL — the export framework equivalent of this KU
- K005 (Laravel Ingest): Import framework — reverse of export flow
- K002 (Queue Dispatching): Queue-based exports for large file generation

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Chunked query:
- Lazy collections / Cursors:
- OpenSpout:
- PhpSpreadsheet:
- Parquet:
- Memory ceiling:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K004 (ETL Manifesto): Export-oriented ETL — the export framework equivalent of this KU, K005 (Laravel Ingest): Import framework — reverse of export flow, K002 (Queue Dispatching): Queue-based exports for large file generation

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