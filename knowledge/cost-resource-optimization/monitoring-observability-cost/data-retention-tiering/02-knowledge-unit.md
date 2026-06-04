# KU-05-DATA-RETENTION-TIERING: Data Retention Tiering

## Metadata
- **ID**: KU-05-DATA-RETENTION-TIERING
- **Subdomain**: Monitoring & Observability Cost
- **Topic**: Data Retention Tiering
- **Source**: Monitoring & Observability Cost, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Observability data retention tiering moves data through storage classes based on age and access frequency. Hot data (last 7 days) needs fast, indexed access for debugging. Warm data (7-30 days) needs queryable access but can use slower, cheaper storage. Cold data (30+ days) can be archived to S3 Glacier for compliance. Without tiering, all data is stored in expensive hot storage forever, making monitoring costs dominate the infrastructure budget.

## Core Concepts
- **Hot tier**: Fast query/indexed; CloudWatch Logs, Datadog, New Relic live search (7-15 days retention)
- **Warm tier**: Queryable but slower; S3 + Athena, Elasticsearch cold nodes, BigQuery (15-90 days)
- **Cold tier**: Archived; S3 Glacier, S3 Standard-IA, parquet export (90 days - 7 years)
- **Retention period**: How long data is kept before deletion; varies by data type and compliance
- **Compliance retention**: Regulatory requirement (PCI/HIPAA: 1-7 years); cannot be deleted
- **Rollup/aggregation**: Store detailed data for 7 days, aggregated hourly for 30 days, daily for 1 year
- **Log archive to S3**: Export logs to S3/Parquet/CSV for long-term storage at $0.023/GB/month

## Mental Models
- Default: 7-30 days hot, archive to S3 with lifecycle, delete after compliance
- Default: export logs to Parquet format (compressed, queryable)
- Set automated deletion date = compliance period + 30 days

## Internal Mechanics
- S3 export time: 1GB/minute for CloudWatch Logs export to S3
- Athena query time: 5-30 seconds per query on multi-month data
- Rollup computation: Lambda with 1GB memory processes 1 month of data in 5 minutes
- Compression ratio: Parquet compresses logs 5-10x vs raw text; 50GB raw = 5-10GB Parquet
- Glacier restore: 5-12 hours retrieval time for Deep Archive data

## Patterns
- Export logs to S3 after 7 days
- Set retention at data type level
- Use S3 Lifecycle Policies for automatic tiering
- Rollup metrics before archiving
- Test data restoration from archive quarterly
- Set compliance-driven deletion

## Architectural Decisions
- CloudWatch Logs; retention = 30 days; export to S3 on Day 7
- Datadog Logs: 15-day retention included; export to S3 for longer retention
- S3 bucket: `/logs/{service}/{date}/` as Parquet files (compressed, queryable)
- Athena: Partitioned table for querying archived logs (pay $5/TB scanned)
- Compliance: Immutable S3 bucket (Object Lock) for audit logs; 7-year retention
- Rollup pipeline: Lambda scheduled job aggregates raw metrics into hourly summaries

## Tradeoffs
**When To Use:**
- Retention tiering: Any app generating >10GB/month of observability data
- Compliance: Financial, healthcare, or regulated apps needing multi-year retention
- CloudWatch export: Export logs to S3 before retention expiration for long-term archive
- S3 + Athena: Query archived data without paying for hot log storage
- Rollup: Aggregate detailed metrics into hourly/daily summaries for trend analysis
- Old data deletion: After compliance period, delete archived data to stop storage costs

**When NOT To Use:**
- Tiny apps (<1GB/month): Retention tiering complexity not justified; just keep 30 days and delete
- Only hot-tier needed: If compliance allows 7-day retention, don't tier; just delete older data
- Manual tiering: If you can't automate the tiering process, it won't be maintained
- Every data type tiered: Health check logs don't need warm tier; just delete after 7 days
- Real-time querying of cold data: Archived data in Glacier can't be queried instantly

## Performance Considerations
- S3 export time: 1GB/minute for CloudWatch Logs export to S3
- Athena query time: 5-30 seconds per query on multi-month data
- Rollup computation: Lambda with 1GB memory processes 1 month of data in 5 minutes
- Compression ratio: Parquet compresses logs 5-10x vs raw text; 50GB raw = 5-10GB Parquet
- Glacier restore: 5-12 hours retrieval time for Deep Archive data

## Production Considerations
- Archived data must retain access controls (IAM policies on S3 buckets)
- Encrypt archived data (S3 SSE-KMS or client-side encryption)
- Object Lock prevents deletion/modification during compliance period
- Archive access logging (CloudTrail) for compliance auditing
- Data deletion must be verifiable (generate deletion certificate for compliance)

## Common Mistakes
- **No data lifecycle management**: Keeping all observability data in hot storage indefinitely (Cause: "we might need it someday"; Consequence: $500-5000/month storing 1TB of old logs in CloudWatch; Better: 30-day retention in hot, archive to S3 with lifecycle, delete after compliance period)
- **Archiving without schema**: Exporting raw JSON logs to S3 without structure (Cause: simple export; Consequence: querying requires full scan of all files; $50-100/query at Athena pricing; Better: convert to Parquet with schema; partitioned by date for efficient querying)
- **Not deleting after compliance**: Keeping 7 years of data for "just in case" beyond compliance needs (Cause: "keep everything forever" policy; Consequence: storage costs grow unbounded; Better: set deletion date = compliance period + 30 days; automate deletion with lifecycle policy)

## Failure Modes
- **Single-tier retention**: All data treated same; overpaying for low-value logs
- **Manual archive pruning**: Engineers manually deleting old data; human error risk
- **No compliance expiration tracking**: Not knowing when data can be legally deleted
- **Archiving everything**: Archiving 100% of logs at same detail; rollup for non-critical data

## Ecosystem Usage
- **Standard retention**: CloudWatch Logs: 30 days -> S3 Parquet archive -> 90 days Standard -> 270 days Glacier -> 7 year delete
- **Compliance retention**: Audit logs: S3 Object Lock 7 years; immediate archive to Glacier; verify quarterly
- **Rollup pipeline**: Raw spans: 7 days Datadog -> hourly trace count/error rate by endpoint (30 days S3) -> daily summary (1 year S3)
- **Before tiering**: 500GB CloudWatch logs, 1 year retention = $15,000/year
- **After tiering**: 30 days CloudWatch (41GB) + S3 Parquet archive (50GB compressed) = $1,200/year (92% savings)

## Related Knowledge Units
- Log Cost Optimization (ku-01)
- Sampling Strategies (ku-04)
- Storage Tier Selection
- Cost-Aware Observability Architecture

## Research Notes
Derived from Monitoring & Observability Cost, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.