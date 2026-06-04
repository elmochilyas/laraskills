# Decision Trees: Laravel Ingest Configuration Classes

## Decision: Import Strategy by File Size

**Q: How large is the source file?**
- < 50MB → Memory load acceptable; use chunked iterator
- 50-500MB → Streaming import with chunked database writes
- > 500MB → Streaming import, queue-based, with progress tracking

## Decision: Error Handling Strategy

**Q: What is the import criticality?**
- Compliance/migration → Fail-fast (no partial data)
- Bulk data loading → Skip-and-log (partial success acceptable)
- User uploads → Fail-fast with clear error messages

## Decision: Duplicate Resolution

**Q: Should existing records be overwritten?**
- Yes → Use Update strategy (match on unique key)
- No → Use Skip strategy; log duplicates for review
- Never allow duplicates → Use Fail strategy

## Decision: Source Type

**Q: What is the data source?**
- CSV file → CSV source definition with delimiter detection
- Excel file → Excel source with sheet selection
- JSON file → JSON source with path expression
- REST API → API source with pagination handling
- Database → Database source with query and chunking
