# Decision Trees: CSV/Excel/Parquet Export with Chunked Processing

## Decision: Export Format Selection

**Q: Who is the export consumer?**
- End user (download) → CSV or Excel
- Data lake / ML pipeline → Parquet
- Another system via API → CSV or Parquet

**Q: Does the export require formatting (colors, formulas, multiple sheets)?**
- Yes → Excel (PhpSpreadsheet for < 10K rows)
- No → CSV or Parquet

## Decision: Export Mode

**Q: How many rows will be exported?**
- < 1,000 → Synchronous HTTP response
- 1,000-100,000 → Queue job with progress polling
- > 100,000 → Queue job with email notification

## Decision: Excel Library

**Q: How many rows and what formatting is needed?**
- < 10K rows, complex formatting → PhpSpreadsheet
- 10K-1M rows, simple formatting → OpenSpout XLSX
- > 1M rows → Parquet (Excel cannot handle this volume)
