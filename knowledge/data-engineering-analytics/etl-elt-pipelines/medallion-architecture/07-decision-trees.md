# Decision Trees: Medallion Architecture (Bronze → Silver → Gold)

## Decision: Layer Granularity

**Q: How many data sources?**
- 1-3 → Single Bronze layer (all sources), separate Silver per source
- 4-10 → Separate Bronze per source type, unified Silver
- 10+ → Separate Bronze per source, Silver per domain

**Q: Is data reprocessing required?**
- Yes (regulatory, debugging) → Full Bronze with retention policy
- No → Consider minimal Bronze; focus on Silver and Gold

## Decision: Transformation Tool Selection

**Q: Who owns the transformation?**
- Laravel team (PHP) → Eloquent jobs or ETL Manifesto
- Data engineering team (SQL) → dbt
- Both → Bronze/Silver in dbt, Gold in Laravel or vice versa

## Decision: Refresh Strategy for Gold

**Q: How fresh does Gold data need to be?**
- Real-time (seconds) → ClickHouse materialized views
- Near-real-time (minutes) → Triggered incremental refresh
- Batch (hourly/daily) → Scheduled dbt runs or cron jobs

## Decision: Data Quality Gate

**Q: What quality checks are needed?**
- Schema validation only → Bronze → Silver without stalling
- Full quality (nulls, uniqueness, referential integrity) → Bronze → Silver with quarantine
- Manual approval → Bronze → staging → human review → Silver
