# Data Retention Tiering

## Metadata
- **ID**: KU-05-DATA-RETENTION-TIERING
- **Subdomain**: monitoring-observability-cost
- **Domain**: cost-resource-optimization
- **Topic**: Data Retention Tiering
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Observability data retention tiering moves data through storage classes based on age and access frequency. Hot data (last 7 days) needs fast, indexed access for debugging. Warm data (7-30 days) needs queryable access but can use slower, cheaper storage. Cold data (30+ days) can be archived to S3 Glacier for compliance. Without tiering, all data is stored in expensive hot storage forever, making monitoring costs dominate the infrastructure budget.

## Core Concepts
- **Hot tier**: Fast query/indexed; CloudWatch Logs, Datadog, New Relic live search (7-15 days retention)
- **Warm tier**: Queryable but slower; S3 + Athena, Elasticsearch cold nodes, BigQuery (15-90 days)
- **Cold tier**: Archived; S3 Glacier, S3 Standard-IA, parquet export (90 days - 7 years)
- **Retention period**: How long data is kept before deletion; varies by data type and compliance
- **Compliance retention**: Regulatory requirement (PCI/HIPAA: 1-7 years); cannot be deleted
- **Rollup/aggregation**: Store detailed data for 7 days, aggregated hourly for 30 days, daily for 1 year
- **Log archive to S3**: Export logs to S3/Parquet/CSV for long-term storage at $0.023/GB/month

## When To Use
- Retention tiering: Any app generating >10GB/month of observability data
- Compliance: Financial, healthcare, or regulated apps needing multi-year retention
- CloudWatch export: Export logs to S3 before retention expiration for long-term archive
- S3 + Athena: Query archived data without paying for hot log storage
- Rollup: Aggregate detailed metrics into hourly/daily summaries for trend analysis
- Old data deletion: After compliance period, delete archived data to stop storage costs

## When NOT To Use
- Tiny apps (<1GB/month): Retention tiering complexity not justified; just keep 30 days and delete
- Only hot-tier needed: If compliance allows 7-day retention, don't tier; just delete older data
- Manual tiering: If you can't automate the tiering process, it won't be maintained
- Every data type tiered: Health check logs don't need warm tier; just delete after 7 days
- Real-time querying of cold data: Archived data in Glacier can't be queried instantly

## Best Practices
- **Export logs to S3 after 7 days**: Use CloudWatch Logs export or Lambda to send logs to S3 (WHY: CloudWatch logs cost $0.03/GB/month storage; S3 Standard costs $0.023/GB/month; S3 Glacier costs $0.004/GB/month; exporting after 7 days and deleting from CloudWatch saves 50-80% on storage)
- **Set retention at data type level**: Errors: 30 days hot + 1 year warm; Debug logs: 7 days max; Audit logs: 1 year + 6 years cold (WHY: different data types have different value and compliance needs; applying same retention to all data overpays for low-value data and under-retains compliance data)
- **Use S3 Lifecycle Policies for automatic tiering**: Hot (S3 Standard, 30d) -> Warm (S3 IA, 90d) -> Cold (S3 Glacier, 365d) -> Delete (7yr) (WHY: lifecycle policies are fully automated; once configured, no human intervention needed for data retention)
- **Rollup metrics before archiving**: Store raw data for 7 days, then hourly aggregates for 90 days, daily for 1 year (WHY: raw data at 1-sec granularity is 86400x more data than daily rollup; trends and capacity planning don't need sub-second accuracy for data older than 7 days)
- **Test data restoration from archive quarterly**: Verify you can query 1-year-old data from S3/Athena (WHY: archival format or schema changes may break queryability; quarterly test ensures compliance data is actually accessible)
- **Set compliance-driven deletion**: After legal retention period, permanently delete archived data (WHY: holding data beyond legal requirement increases liability and storage cost; automated deletion reduces both)

## Architecture Guidelines
- CloudWatch Logs; retention = 30 days; export to S3 on Day 7
- Datadog Logs: 15-day retention included; export to S3 for longer retention
- S3 bucket: `/logs/{service}/{date}/` as Parquet files (compressed, queryable)
- Athena: Partitioned table for querying archived logs (pay $5/TB scanned)
- Compliance: Immutable S3 bucket (Object Lock) for audit logs; 7-year retention
- Rollup pipeline: Lambda scheduled job aggregates raw metrics into hourly summaries

## Performance Considerations
- S3 export time: 1GB/minute for CloudWatch Logs export to S3
- Athena query time: 5-30 seconds per query on multi-month data
- Rollup computation: Lambda with 1GB memory processes 1 month of data in 5 minutes
- Compression ratio: Parquet compresses logs 5-10x vs raw text; 50GB raw = 5-10GB Parquet
- Glacier restore: 5-12 hours retrieval time for Deep Archive data

## Security Considerations
- Archived data must retain access controls (IAM policies on S3 buckets)
- Encrypt archived data (S3 SSE-KMS or client-side encryption)
- Object Lock prevents deletion/modification during compliance period
- Archive access logging (CloudTrail) for compliance auditing
- Data deletion must be verifiable (generate deletion certificate for compliance)

## Common Mistakes
1. **No data lifecycle management**: Keeping all observability data in hot storage indefinitely (Cause: "we might need it someday"; Consequence: $500-5000/month storing 1TB of old logs in CloudWatch; Better: 30-day retention in hot, archive to S3 with lifecycle, delete after compliance period)
2. **Archiving without schema**: Exporting raw JSON logs to S3 without structure (Cause: simple export; Consequence: querying requires full scan of all files; $50-100/query at Athena pricing; Better: convert to Parquet with schema; partitioned by date for efficient querying)
3. **Not deleting after compliance**: Keeping 7 years of data for "just in case" beyond compliance needs (Cause: "keep everything forever" policy; Consequence: storage costs grow unbounded; Better: set deletion date = compliance period + 30 days; automate deletion with lifecycle policy)

## Anti-Patterns
- **Single-tier retention**: All data treated same; overpaying for low-value logs
- **Manual archive pruning**: Engineers manually deleting old data; human error risk
- **No compliance expiration tracking**: Not knowing when data can be legally deleted
- **Archiving everything**: Archiving 100% of logs at same detail; rollup for non-critical data

## Examples
- **Standard retention**: CloudWatch Logs: 30 days -> S3 Parquet archive -> 90 days Standard -> 270 days Glacier -> 7 year delete
- **Compliance retention**: Audit logs: S3 Object Lock 7 years; immediate archive to Glacier; verify quarterly
- **Rollup pipeline**: Raw spans: 7 days Datadog -> hourly trace count/error rate by endpoint (30 days S3) -> daily summary (1 year S3)
- **Before tiering**: 500GB CloudWatch logs, 1 year retention = $15,000/year
- **After tiering**: 30 days CloudWatch (41GB) + S3 Parquet archive (50GB compressed) = $1,200/year (92% savings)

## Related Topics
- Log Cost Optimization (ku-01)
- Sampling Strategies (ku-04)
- Storage Tier Selection
- Cost-Aware Observability Architecture

## AI Agent Notes
- Default: 7-30 days hot, archive to S3 with lifecycle, delete after compliance
- Default: export logs to Parquet format (compressed, queryable)
- Set automated deletion date = compliance period + 30 days

## Verification
- [ ] Data retention policy documented per data type
- [ ] Hot retention: 7-30 days (logs), 30-90 days (traces), 90 days (errors)
- [ ] S3 lifecycle policy for automatic tiering
- [ ] Logs archived as Parquet (compressed, partitioned)
- [ ] Archive restoration tested quarterly
- [ ] Compliance deletion date set and automated
- [ ] Retention tiering reduced storage cost by 50%+
