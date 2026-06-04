# Anti-Patterns: Medallion Architecture (Bronze → Silver → Gold)

## Silver as a Copy of Bronze
Silver tables are exact copies of Bronze with the same schema and no deduplication. The Silver layer adds no value and doubles storage costs without providing any data quality benefit.

**Solution:** Silver must transform data: type casting, deduplication, validation, enrichment. If no transformation is needed, query Bronze directly.

## Gold Layer with Too Few Dimensions
Gold marts include only a date column and a metric value. Every dashboard query requires JOINing to other tables for filtering by country, browser, or campaign. The JOINs are slow and analysts must know the schema.

**Solution:** Include all commonly used dimensions in each Gold mart. Denormalize to eliminate dashboard-time JOINs.

## Manual Data Promotion
Engineers run manual SQL scripts to move data from Bronze to Silver to Gold. The process is undocumented, untested, and only one person knows how to run it.

**Solution:** Automate all layer promotions. Use dbt, scheduled jobs, or materialized views. Document the promotion process.

## No Bronze Layer at All
Raw data is loaded directly into cleaned Silver tables. When a transformation bug is discovered, the raw data is already gone. The pipeline cannot be replayed from scratch.

**Solution:** Always maintain a Bronze layer with raw, immutable data. Even if Silver transformations are perfect, Bronze provides insurance against bugs and schema changes.

## Cross-Layer Direct Queries
Dashboards query Bronze or Silver directly instead of Gold. Query performance is poor because Bronze/Silver are optimized for write throughput, not read performance.

**Solution:** Dashboard queries should target Gold layer only. If a metric is missing from Gold, add it to the appropriate Gold mart rather than querying Silver.
