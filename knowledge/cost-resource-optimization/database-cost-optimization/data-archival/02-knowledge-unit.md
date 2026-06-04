# KU-03-DATA-ARCHIVAL: Data Archival

## Metadata
- **ID**: KU-03-DATA-ARCHIVAL
- **Subdomain**: Database Cost Optimization
- **Topic**: Data Archival
- **Source**: Database Cost Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Data archival moves infrequently accessed data from expensive database storage to cheaper long-term storage (S3, Glacier, or separate archival database). For Laravel applications, old orders, historical logs, archived user data, and stale soft-deleted records accumulate over time, increasing table sizes, slowing queries, and requiring larger database instances. Systematic archival reduces active database size by 60-80%, enabling smaller instances and faster queries.

## Core Concepts
- **Active data**: Frequently accessed data (current month, recent transactions); kept in primary database
- **Warm data**: Occasionally accessed (last year's records); may stay in database or cheap tier
- **Cold data**: Rarely accessed (audit trails, 3+ year old records); moved to S3/Glacier
- **Soft delete archival**: Moving soft-deleted records older than N days to archive
- **Table partitioning**: PostgreSQL or MySQL partitioning by date; older partitions detachable for archival
- **Neon branching**: Serverless Postgres with instant branching; archive branches serve as historical snapshots
- **S3 archival**: CSV/Parquet export to S3; queryable via Athena when needed

## Mental Models
- Default: partition by date from day 1; archive data older than 6 months
- Use Neon branching for instant archive snapshots
- Test archive restoration quarterly

## Internal Mechanics
- Active table size reduction: 10GB -> 2GB after archival (queries 5x faster on remaining data)
- Partition detachment: <1 second for single partition (metadata operation)
- Export to S3 time: 1GB/minute for CSV export from database (parallelize with chunks)
- Archive restore: 5-30 minutes to reload data from S3 to database
- Index maintenance: Smaller tables = smaller indexes; fewer buffer pool pages needed

## Patterns
- Archive by date partition
- Keep 3-6 months in active database
- Use soft delete with auto-archival
- Export to Parquet format for archiving
- Use Neon branching for instant archive DB
- Test restoration from archive quarterly

## Architectural Decisions
- Identify hot/cold data split early in database schema design (include `created_at` for partitioning)
- Use Laravel's `prunable` trait for Eloquent models to auto-purge old soft-deleted records
- Implement archival as a scheduled job (`php artisan app:archive-old-records`)
- Move archived data to separate database instance first, then to S3
- Keep archive database on smaller, cheaper instance (or serverless)
- Document data retention policy per entity type (orders: 7 years, logs: 1 year, temp data: 30 days)

## Tradeoffs
**When To Use:**
- Database > 100GB: Active data is small percentage; archival reclaims space and improves performance
- Query performance degradation: Old data slows down queries that should only touch recent records
- Compliance retention: Legal requirement to keep data for 7 years but active access is only 30 days
- Cost reduction: Database resize from r7g.2xlarge to r7g.large after archival (50-75% cost reduction)
- Soft-deleted accumulation: Millions of soft-deleted records still in active tables

**When NOT To Use:**
- Small databases (< 50GB): Archival overhead may not justify savings
- Active data only: If all data is accessed equally (no clear hot/cold separation)
- No retention requirement: If there's no compliance or business need to keep old data
- E-commerce with repeat purchases: Customers may need access to 3+ year old orders (keep accessible but archive)
- Real-time analytics: Archived data in S3 is not available for real-time queries

## Performance Considerations
- Active table size reduction: 10GB -> 2GB after archival (queries 5x faster on remaining data)
- Partition detachment: <1 second for single partition (metadata operation)
- Export to S3 time: 1GB/minute for CSV export from database (parallelize with chunks)
- Archive restore: 5-30 minutes to reload data from S3 to database
- Index maintenance: Smaller tables = smaller indexes; fewer buffer pool pages needed

## Production Considerations
- Archived data still needs access controls (IAM policies for S3)
- Encrypt archival data at rest (S3 SSE-KMS or client-side encryption)
- Data retention policy must comply with GDPR/CCPA (right to deletion)
- Archive logs should track what was archived and when
- Test that PII in archived data is properly handled (redaction, anonymization)

## Common Mistakes
- **No archival strategy**: Database grows unbounded to 500GB for a 2 year old app (Cause: never planned for data lifecycle; Consequence: queries slow, database resize costs $1000+/month extra; Better: implement partition-by-date in year 1, archive monthly)
- **Deleting instead of archiving**: `DELETE FROM old_posts WHERE created_at < '2022-01-01'` (Cause: quick cleanup; Consequence: data permanently lost; no compliance trail; Better: export to S3/Parquet first, verify, then delete)
- **Archiving to CSV without structure**: CSV files with no schema, mixed formats, missing relationships (Cause: quick export; Consequence: restoring data requires manual schema mapping; attributes lost; Better: use Parquet or structured export with schema)

## Failure Modes
- **Keeping everything forever**: No data lifecycle management; database grows until cost is prohibitive
- **Manual archival**: Engineers manually running queries to move data; error-prone, inconsistent
- **Archiving without testing restoration**: Archived data is worthless if it can't be restored
- **S3 CSV archival without indexing**: Finding specific records in CSV dump requires scanning entire dump

## Ecosystem Usage
- **Orders table**: Partition by month; keep 6 months active; archive months > 6 to Parquet on S3; restore via Athena for compliance queries
- **Soft-deleted users**: `User::whereNotNull('deleted_at')->where('deleted_at', '<', now()->subDays(90))` -> export to archive -> force delete
- **Logs table**: Keep 7 days in PostgreSQL; move to S3 Glacier after 7 days; queryable via Athena if needed

## Related Knowledge Units
- Storage Tier Selection (ku-07 in cdn-storage)
- Query Optimization Cost (ku-01)
- Serverless Database (ku-07)

## Research Notes
Derived from Database Cost Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.