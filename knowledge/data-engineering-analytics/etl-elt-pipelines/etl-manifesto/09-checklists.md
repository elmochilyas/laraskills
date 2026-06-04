# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 03-etl-elt-pipelines
**Knowledge Unit:** etl-manifesto
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] YAML manifest structure understood — entity definitions, relationships, mappings, aggregation
- [ ] ETL Manifesto role vs Laravel Ingest role understood (Manifesto = extract/export, Ingest = import/load)
- [ ] Entity extraction defined per source Eloquent model
- [ ] Relationship extraction defined for nested/related data
- [ ] Transform mappings configured for data type conversion and value transformation
- [ ] Output target selected (CSV, JSON, XLSX, or database table) with schema mapping

---

# Architecture Checklist

- [ ] YAML manifest files organized per pipeline purpose, not per output format
- [ ] Entity definitions reference Eloquent models with explicit column selection
- [ ] Relationship extraction defined at manifest level, not scattered in code
- [ ] Transform mappings separate from extraction logic for reusability
- [ ] Output targets decoupled from entity definitions — same manifest can output to multiple formats
- [ ] Manifest outputs land in Bronze or Silver layer of Medallion architecture (K014)

---

# Implementation Checklist

- [ ] YAML manifest file created with entities, relationships, transforms, and output sections
- [ ] Entity section defines model class, query scope, and selected columns
- [ ] Relationship section defines eager-loading paths with depth limit
- [ ] Transform mapping section defines value cast, date format, and aggregation functions
- [ ] Output section defines target format and file path template (including date partitions)
- [ ] Late-arriving dimension handling (K033) configured for manifests with dimension references

---

# Performance Checklist

- [ ] Chunked querying configured for large entity extraction to avoid memory exhaustion
- [ ] Relationship extraction uses eager loading, not lazy loading per row
- [ ] Transform operations pushed to database when possible (DB casts), not PHP
- [ ] Output file writing uses streaming to avoid full result set in memory
- [ ] Aggregation functions computed in manifest SQL, not post-extract in PHP
- [ ] Late-arriving dimension lookup cached to avoid per-row database query

---

# Security Checklist

- [ ] Sensitive model columns excluded from entity extraction in manifest YAML
- [ ] Output file permissions restricted to pipeline user
- [ ] YAML manifest files committed to repository with sensitive values in env
- [ ] Manifest output paths outside webroot to prevent direct file access
- [ ] Source database credentials scoped to read-only for extraction query

---

# Reliability Checklist

- [ ] Manifest extraction uses transactions (when appropriate) to prevent partial exports
- [ ] Chunked extraction checkpoint resumes on failure, not restart from beginning
- [ ] Output file write validated with checksum after completion
- [ ] Relationship depth limit prevents infinite recursion on circular references
- [ ] Manifest validation run before execution to catch YAML syntax errors

---

# Testing Checklist

- [ ] Test entity extraction produces correct row count matching source table
- [ ] Test relationship extraction includes all nested related records
- [ ] Test transform mapping converts values correctly (dates, enums, math)
- [ ] Test output file in each format (CSV, JSON, XLSX) parses correctly
- [ ] Test manifest validation catches invalid YAML and missing entity references
- [ ] Test chunked extraction handles large dataset without memory error

---

# Maintainability Checklist

- [ ] YAML manifest file includes description field for purpose and owner
- [ ] Entity definitions use model aliases consistent across manifests
- [ ] Transform mapping functions in separate reusable file referenced by manifest
- [ ] Output file path template configured via env variables, not hardcoded in YAML
- [ ] Manifests versioned alongside Eloquent model schema changes

---

# Anti-Pattern Prevention Checklist

- [ ] Do not use ETL Manifesto for imports — Laravel Ingest is the import framework
- [ ] Do not embed business logic in YAML transforms — keep as simple mappings
- [ ] Do not define same entity extraction logic in multiple manifests — use YAML anchors
- [ ] Do not extract all columns when subset suffices — select explicitly
- [ ] Do not skip relationship depth limit — circular references cause infinite loop

---

# Production Readiness Checklist

- [ ] Prometheus metrics for manifest extraction time, row count, and output file size
- [ ] Logged warning when manifest row count is zero (empty source or filter issue)
- [ ] Alert when chunked extraction error rate exceeds threshold
- [ ] Output file archive and retention policy defined per manifest
- [ ] Deploy checklist includes manifest version compatibility with model schema
- [ ] Manifest scheduled via Laravel scheduler with timezone-aware cron expression

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: YAML-driven entity/relationship/transform/output separation
- [ ] Security requirements satisfied: column exclusion, file permissions, read-only credentials
- [ ] Performance requirements satisfied: chunked querying, eager loading, streaming output, cached lookups
- [ ] Testing requirements satisfied: row count, relationship depth, transform correctness, format validation
- [ ] Anti-pattern checks passed: no import use case, simple transforms, no all-column extraction, depth limit
- [ ] Production readiness verified: timing/row-count metrics, empty-result alerts, archive policy, deploy checklist

---

# Related References

- K005 (Laravel Ingest): Complementary import framework (ETL Manifesto = extract/export, Laravel Ingest = import/load)
- K014 (Medallion Architecture): Bronze-to-Silver-to-Gold: where manifest outputs land
- K033 (Late-Arriving Dimensions): Handling delayed dimension data in ETL pipelines
