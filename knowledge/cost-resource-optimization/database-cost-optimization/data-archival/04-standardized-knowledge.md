# Data Archival

## Metadata
- **ID**: KU-03-DATA-ARCHIVAL
- **Subdomain**: database-cost-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Data Archival
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Data archival moves infrequently accessed data from expensive database storage to cheaper long-term storage (S3, Glacier, or separate archival database). For Laravel applications, old orders, historical logs, archived user data, and stale soft-deleted records accumulate over time, increasing table sizes, slowing queries, and requiring larger database instances. Systematic archival reduces active database size by 60-80%, enabling smaller instances and faster queries.

## Core Concepts
- **Active data**: Frequently accessed data (current month, recent transactions); kept in primary database
- **Warm data**: Occasionally accessed (last year's records); may stay in database or cheap tier
- **Cold data**: Rarely accessed (audit trails, 3+ year old records); moved to S3/Glacier
- **Soft delete archival**: Moving soft-deleted records older than N days to archive
- **Table partitioning**: PostgreSQL or MySQL partitioning by date; older partitions detachable for archival
- **Neon branching**: Serverless Postgres with instant branching; archive branches serve as historical snapshots
- **S3 archival**: CSV/Parquet export to S3; queryable via Athena when needed

## When To Use
- Database > 100GB: Active data is small percentage; archival reclaims space and improves performance
- Query performance degradation: Old data slows down queries that should only touch recent records
- Compliance retention: Legal requirement to keep data for 7 years but active access is only 30 days
- Cost reduction: Database resize from r7g.2xlarge to r7g.large after archival (50-75% cost reduction)
- Soft-deleted accumulation: Millions of soft-deleted records still in active tables

## When NOT To Use
- Small databases (< 50GB): Archival overhead may not justify savings
- Active data only: If all data is accessed equally (no clear hot/cold separation)
- No retention requirement: If there's no compliance or business need to keep old data
- E-commerce with repeat purchases: Customers may need access to 3+ year old orders (keep accessible but archive)
- Real-time analytics: Archived data in S3 is not available for real-time queries

## Best Practices
- **Archive by date partition**: Partition tables by month/year; detach partitions older than N months (WHY: partition detachment is instant (metadata-only); no data copying during archival; old data becomes a separate table that can be moved or dropped easily)
- **Keep 3-6 months in active database**: Move data older than 6 months to archive (WHY: typical Laravel apps access only recent data; 80% of queries touch last 30 days; keeping 6 months in active DB is safety buffer for edge cases)
- **Use soft delete with auto-archival**: Auto-archive soft-deleted records after 30-90 days (WHY: soft-deleted records serve no purpose after appeal/recovery window; they bloat tables; archival removes them from queries while keeping for compliance)
- **Export to Parquet format for archiving**: Convert to Parquet (columnar) on S3 for size and query efficiency (WHY: Parquet compresses 70-80% vs CSV; queryable via Athena with standard SQL; cost $5/TB scanned vs $115/GB/month in RDS)
- **Use Neon branching for instant archive DB**: Create a branch of the database at archival point, then delete data from primary (WHY: branches are instant (copy-on-write); archived state is preserved without duplicate storage; queryable on-demand)
- **Test restoration from archive quarterly**: Verify that archived data can be restored and queried (WHY: archival format may become unreadable; quarterly test ensures compliance and business continuity)

## Architecture Guidelines
- Identify hot/cold data split early in database schema design (include `created_at` for partitioning)
- Use Laravel's `prunable` trait for Eloquent models to auto-purge old soft-deleted records
- Implement archival as a scheduled job (`php artisan app:archive-old-records`)
- Move archived data to separate database instance first, then to S3
- Keep archive database on smaller, cheaper instance (or serverless)
- Document data retention policy per entity type (orders: 7 years, logs: 1 year, temp data: 30 days)

## Performance Considerations
- Active table size reduction: 10GB -> 2GB after archival (queries 5x faster on remaining data)
- Partition detachment: <1 second for single partition (metadata operation)
- Export to S3 time: 1GB/minute for CSV export from database (parallelize with chunks)
- Archive restore: 5-30 minutes to reload data from S3 to database
- Index maintenance: Smaller tables = smaller indexes; fewer buffer pool pages needed

## Security Considerations
- Archived data still needs access controls (IAM policies for S3)
- Encrypt archival data at rest (S3 SSE-KMS or client-side encryption)
- Data retention policy must comply with GDPR/CCPA (right to deletion)
- Archive logs should track what was archived and when
- Test that PII in archived data is properly handled (redaction, anonymization)

## Common Mistakes
1. **No archival strategy**: Database grows unbounded to 500GB for a 2 year old app (Cause: never planned for data lifecycle; Consequence: queries slow, database resize costs $1000+/month extra; Better: implement partition-by-date in year 1, archive monthly)
2. **Deleting instead of archiving**: `DELETE FROM old_posts WHERE created_at < '2022-01-01'` (Cause: quick cleanup; Consequence: data permanently lost; no compliance trail; Better: export to S3/Parquet first, verify, then delete)
3. **Archiving to CSV without structure**: CSV files with no schema, mixed formats, missing relationships (Cause: quick export; Consequence: restoring data requires manual schema mapping; attributes lost; Better: use Parquet or structured export with schema)

## Anti-Patterns
- **Keeping everything forever**: No data lifecycle management; database grows until cost is prohibitive
- **Manual archival**: Engineers manually running queries to move data; error-prone, inconsistent
- **Archiving without testing restoration**: Archived data is worthless if it can't be restored
- **S3 CSV archival without indexing**: Finding specific records in CSV dump requires scanning entire dump

## Examples
- **Orders table**: Partition by month; keep 6 months active; archive months > 6 to Parquet on S3; restore via Athena for compliance queries
- **Soft-deleted users**: `User::whereNotNull('deleted_at')->where('deleted_at', '<', now()->subDays(90))` -> export to archive -> force delete
- **Logs table**: Keep 7 days in PostgreSQL; move to S3 Glacier after 7 days; queryable via Athena if needed

## Related Topics
- Storage Tier Selection (ku-07 in cdn-storage)
- Query Optimization Cost (ku-01)
- Serverless Database (ku-07)

## AI Agent Notes
- Default: partition by date from day 1; archive data older than 6 months
- Use Neon branching for instant archive snapshots
- Test archive restoration quarterly

## Verification
- [ ] Data retention policy documented per entity type
- [ ] Table partitioning by date implemented
- [ ] Archival job scheduled (cron) for regular archival
- [ ] Parquet/structured export format used
- [ ] Archive restoration tested quarterly
- [ ] Active table size reduced by 60-80% after archival
- [ ] Soft-deleted records auto-archived after 90 days
