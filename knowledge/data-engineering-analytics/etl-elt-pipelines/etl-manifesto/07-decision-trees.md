# Decision Trees: ETL Manifesto YAML Configuration

## Decision: Output Format Selection

**Q: Who consumes the output?**
- Business users (Excel/CSV) → CSV or Excel format
- Other systems (APIs) → JSON format
- Data warehouse → Database target (table insert)

**Q: How large is the output dataset?**
- < 10,000 rows → Full load in memory
- 10,000 - 1,000,000 → Chunked processing (1000 rows/chunk)
- > 1,000,000 → Chunked + queue-based execution

## Decision: Transformation Strategy

**Q: Does the transformation require conditional logic?**
- Yes → Move logic to a service class; reference class in manifest
- No → Define in manifest with field mappings and simple expressions

**Q: Are aggregations needed?**
- Yes → Define in manifest with aggregation type and source field
- No → Direct field mappings only

## Decision: Loading Strategy

**Q: Does the target table need a full refresh or incremental load?**
- Full refresh (small, static data) → `truncate_insert` strategy
- Incremental (large, growing data) → `merge` or `insert_overwrite` strategy
