# Data Engineering & Analytics: Folder Architecture

## Directory Structure

```
data-engineering-analytics/
├── domain-analysis.md
├── folder-architecture.md
│
├── 01-event-tracking/
│   ├── middleware-tracking.md
│   ├── api-event-ingestion.md
│   ├── queue-dispatching.md
│   ├── multi-tenancy.md
│   ├── gdpr-compliance.md
│   ├── bot-filtering.md
│   └── packages/
│       ├── wappomic-analytics.md
│       ├── orimyth-analytics.md
│       ├── artisanpack-analytics.md
│       ├── pixel-manager.md
│       └── oleant-visit-analytics.md
│
├── 02-self-hosted-analytics/
│   ├── plausible/
│   │   ├── deployment-docker.md
│   │   ├── api-integration.md
│   │   ├── laravel-integration.md
│   │   └── comparison.md
│   ├── matomo/
│   │   ├── deployment-lamp.md
│   │   ├── plugin-ecosystem.md
│   │   ├── ga4-migration.md
│   │   └── enterprise-compliance.md
│   ├── posthog/
│   │   ├── deployment-hobby.md
│   │   ├── product-analytics.md
│   │   ├── feature-flags.md
│   │   ├── laravel-sdk.md
│   │   └── self-hosted-vs-cloud.md
│   ├── umami/
│   └── fathom/
│
├── 03-etl-elt-pipelines/
│   ├── laravel-native/
│   │   ├── etl-manifesto.md
│   │   ├── laravel-ingest.md
│   │   ├── laravel-pipe.md
│   │   ├── import-pipeline-engine.md
│   │   └── db-to-db-migration.md
│   ├── medallion-architecture/
│   │   ├── bronze-layer.md
│   │   ├── silver-layer.md
│   │   └── gold-layer.md
│   ├── dbt-patterns/
│   │   ├── dbt-project-structure.md
│   │   ├── incremental-models.md
│   │   ├── surrogate-keys.md
│   │   ├── scd-type-1-2.md
│   │   └── late-arriving-dimensions.md
│   └── orchestration/
│       ├── scheduled-reports.md
│       └── incremental-upsert.md
│
├── 04-data-warehousing/
│   ├── clickhouse/
│   │   ├── laravel-driver.md
│   │   ├── mergertree-engine.md
│   │   ├── aggregatingmergetree.md
│   │   ├── materialized-views.md
│   │   ├── projections-vs-mvs.md
│   │   ├── parallel-queries.md
│   │   ├── codec-selection.md
│   │   ├── cdc-integration.md
│   │   └── kafka-table-engine.md
│   ├── snowflake/
│   │   ├── laravel-driver.md
│   │   ├── eloqent-integration.md
│   │   ├── cluster-keys.md
│   │   ├── warehouse-switching.md
│   │   └── cost-optimization.md
│   ├── bigquery/
│   │   ├── laravel-driver.md
│   │   ├── query-patterns.md
│   │   └── cost-management.md
│   ├── duckdb/
│   │   ├── laravel-driver.md
│   │   ├── file-querying.md
│   │   └── embedded-analytics.md
│   └── redshift/
│       └── pgsql-compatibility.md
│
├── 05-olap-modeling/
│   ├── star-schema/
│   │   ├── fact-tables.md
│   │   ├── dimension-tables.md
│   │   ├── date-dimension.md
│   │   ├── laravel-star-schema-package.md
│   │   └── snapshot-aggregation.md
│   ├── materialized-views/
│   │   ├── postgresql-views.md
│   │   ├── generated-columns.md
│   │   └── refresh-strategies.md
│   └── read-models/
│       ├── cqrs-projectors.md
│       ├── analytics-schema-separation.md
│       ├── business-metrics-package.md
│       └── denormalization-patterns.md
│
├── 06-real-time-analytics/
│   ├── websocket-broadcasting/
│   │   ├── laravel-reverb.md
│   │   ├── echo-client.md
│   │   ├── broadcast-events.md
│   │   ├── horizontal-scaling.md
│   │   └── livewire-integration.md
│   ├── kafka-streaming/
│   │   ├── laravel-kafka-integration.md
│   │   ├── cdc-with-debezium.md
│   │   ├── saga-pattern.md
│   │   └── event-sourcing-store.md
│   ├── clickhouse-realtime/
│   │   ├── clickpipes-ingestion.md
│   │   ├── incremental-mvs.md
│   │   └── ohlcv-patterns.md
│   └── performance-optimization/
│       ├── broadcast-when-gate.md
│       ├── batch-aggregation.md
│       └── backpressure-handling.md
│
├── 07-data-exports/
│   ├── csv-excel/
│   │   ├── maatwebsite-excel.md
│   │   ├── turbo-excel.md
│   │   ├── exporter-packages.md
│   │   └── import-patterns.md
│   ├── parquet/
│   │   ├── parqbridge.md
│   │   ├── duckdb-parquet.md
│   │   └── columnar-formatting.md
│   ├── dynamic-reports/
│   │   ├── visual-report-builder.md
│   │   └── dynamic-query-package.md
│   └── queue-based-exports/
│       ├── batch-processing.md
│       └── storage-integration.md
│
├── 08-dashboards-reporting/
│   ├── livewire-dashboards/
│   │   ├── widget-architecture.md
│   │   ├── real-time-widgets.md
│   │   ├── caching-strategies.md
│   │   └── export-from-widgets.md
│   ├── external-bi/
│   │   ├── grafana-integration.md
│   │   ├── metabase-integration.md
│   │   └── superset-integration.md
│   └── reporting-patterns/
│       ├── scheduled-reports.md
│       ├── email-delivery.md
│       └── aggregated-snapshots.md
│
├── 09-analytical-queries/
│   ├── eloquent-aggregates/
│   │   ├── withSum-withAvg.md
│   │   ├── joinSub-patterns.md
│   │   └── addSelect-subqueries.md
│   ├── json-aggregation/
│   │   ├── aggregated-queries.md
│   │   └── optimized-queries.md
│   ├── dynamic-stats/
│   │   ├── dynamic-query-stats.md
│   │   └── period-comparison.md
│   └── optimization/
│       ├── composite-indexes.md
│       ├── query-profiling.md
│       ├── chunk-vs-cursor-vs-lazy.md
│       └── generated-columns.md
│
├── 10-observability/
│   ├── laravel-nightwatch.md
│   ├── application-metrics/
│   │   ├── request-profiling.md
│   │   ├── queue-monitoring.md
│   │   └── custom-metrics.md
│   └── alerting/
│       ├── thresholds-and-rules.md
│       └── notification-channels.md
│
├── 11-case-studies/
│   ├── laravel-nightwatch.md
│   ├── funnel-analytics-engine.md
│   ├── precious-metals-feed.md
│   ├── ecommerce-star-schema.md
│   ├── cannabis-data-warehouse.md
│   ├── distributed-order-processing.md
│   └── earthquake-monitoring.md
│
├── 12-reference-architectures/
│   ├── small-scale/
│   │   ├── single-postgres-analytics.md
│   │   └── middleware-tracking-stack.md
│   ├── medium-scale/
│   │   ├── postgres-clickhouse-dual.md
│   │   ├── reverb-dashboard.md
│   │   └── kafka-event-pipeline.md
│   ├── large-scale/
│   │   ├── snowflake-elt-stack.md
│   │   ├── multi-warehouse-federation.md
│   │   └── real-time-cdc-platform.md
│   └── migration-paths/
│       ├── from-postgres-to-clickhouse.md
│       ├── from-ga4-to-self-hosted.md
│       └── from-batch-to-streaming.md
│
├── 13-reference-data/
│   ├── analytics-platform-comparison.md
│   ├── olap-driver-comparison.md
│   ├── etl-tool-comparison.md
│   ├── export-format-comparison.md
│   ├── query-optimization-cheatsheet.md
│   ├── warehousing-cost-matrix.md
│   └── gdpr-compliance-matrix.md
│
└── _templates/
    ├── star-schema-fact.md.template
    ├── star-schema-dimension.md.template
    ├── business-report.md.template
    ├── kafka-event.md.template
    ├── broadcast-event.md.template
    ├── projector.md.template
    ├── dashboard-widget.md.template
    ├── export-class.md.template
    └── etl-manifest.md.template
```

---

## Architecture Philosophy

### Separation of Concerns

```
Transactional (OLTP)             Analytical (OLAP)
─────────────────────             ────────────────────
public schema                     analytics.* schema
Eloquent Models                   Read Models / Views
Normalized (3NF)                  Denormalized (Star)
Row-oriented                      Column-oriented (CH)
Small writes                      Bulk reads
ACID transactions                 Eventual consistency
```

### Growth Path

```
Phase 1: PostgreSQL + analytics.* schema + scheduled reports
Phase 2: Read replica for dashboards + incremental upsert patterns
Phase 3: ClickHouse/Snowflake for OLAP + dbt transformations
Phase 4: Kafka/CDC for real-time streaming + Reverb WebSocket dashboards
```

### Folder Principles

1. **Numbered subdomains** — roughly ordered by implementation sequence
2. **Package-specific docs** — one file per major package with config examples
3. **Case studies** — real production architectures with architecture diagrams
4. **Reference architectures** — blueprints at small/medium/large scale
5. **Templates** — copy-paste starting points for common patterns
6. **Reference data** — comparison tables, pricing matrices, compliance checklists

---

## File Naming Convention

- `kebab-case.md` for all files
- Package references use short names (`turbo-excel.md`, not `filipefernandes9747-laravel-turbo-excel.md`)
- Templates use `.md.template` extension (for easy syntax highlighting)
- Architecture patterns use descriptive names (`postgres-clickhouse-dual.md`)

---

## Content Pattern for Each File

```
# Title

## Overview
Brief description of the concept/package/pattern.

## Key Concepts
Core ideas and terminology.

## Implementation
Code examples, configuration, patterns.

## Trade-offs
Pros, cons, when to use, when to avoid.

## Integration with Laravel
Specific Laravel patterns (facades, service providers, traits).

## References
Links to packages, docs, articles.
```
