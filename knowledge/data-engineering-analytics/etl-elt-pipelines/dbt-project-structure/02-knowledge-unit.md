# dbt Project Structure

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 03-etl-elt-pipelines
- **Knowledge Unit:** dbt-project-structure
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

A well-structured dbt project organizes models, tests, documentation, and configurations into a maintainable hierarchy mirroring the medallion architecture — staging (Bronze), intermediate (Silver), and marts (Gold) — with specific conventions for naming, testing, and materialization. This structure directly determines maintainability, onboarding speed, and pipeline reliability, enabling multiple engineers to work independently across layers.

---

## Core Concepts

- **Staging Models:** First transformation layer (Bronze) — one per source table, renames columns, casts types, light cleaning — materialized as views or ephemeral
- **Intermediate Models:** Silver layer — business logic, deduplication, joins across staging models, filtering, enrichment — materialized as tables or incremental tables
- **Mart Models:** Gold layer — denormalized, aggregated, business-specific data marts optimized for BI tool consumption — each mart answers a specific business question
- **Sources YAML:** Defines upstream database tables that dbt reads — specifies source name, table names, freshness requirements, loading information
- **Schema YAML:** One per model directory — defines model configurations, column descriptions, tests, and relationships — single source of truth for model metadata

---

## Mental Models

- **Layered Kitchen:** Staging is the ingredient prep station (wash, chop, measure). Intermediate is the cooking station (combine, season, cook). Marts are the plating station (present for consumption). Each station has specific tools and quality checks.
- **Naming Convention as Filing System:** Consistent naming (stg_source__entity) is like a well-organized filing cabinet — any engineer can find any file without asking. Inconsistent naming is a pile of papers on a desk.

---

## Internal Mechanics

dbt reads the directory structure to build its model graph. Models in `models/staging/` are processed first (no dependencies on other layers), then `models/intermediate/`, then `models/marts/`. The `+` config syntax in `dbt_project.yml` sets materialization per directory. Schema YAML files are read by dbt's test framework — each model's tests are defined alongside its schema. Source freshness is checked by running `dbt source freshness` which compares `loaded_at_field` values to the freshness thresholds.

---

## Patterns

- **One Staging Model Per Source Table:** Every source table gets exactly one staging model — the single point of entry for that source in the dbt project
- **Marts Are Queryable Without Joins:** Each mart model should be independently queryable — analysts should not need to join mart models together
- **Naming by Entity, Not by Action:** Models named after the entity (`orders`, `daily_revenue`) not the action (`clean_orders`, `transform_customers`) — action is implicit from the layer

---

## Architectural Decisions

Choose view/ephemeral materialization for staging models — staging data is never stored independently. Use table or incremental for intermediate and mart models — store for downstream queries and BI consumption. Use `+` config syntax to set materialization per directory in `dbt_project.yml` rather than per-model. Split schema YAML by directory rather than one large file.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Clear separation of concerns | More directories and files | More navigation overhead but better maintainability |
| Consistent naming conventions | Requires enforcement (CI checks) | Improves onboarding speed |
| Self-documenting (co-located YAML) | YAML files can be verbose | Tests and docs live with the model |
| Source freshness alerts | Requires configuration per source | Detects ingestion failures early |

---

## Performance Considerations

Staging models as views have no storage cost but add query compile time. Intermediate model materialization depends on downstream query frequency — table if queried by multiple marts, ephemeral if used once. Marts should use incremental materialization if refresh cost exceeds storage benefit. Use `+` config syntax to set materialization per directory.

---

## Production Considerations

Sources YAML defines upstream connections — ensure these connections have read-only permissions. Mart models may expose aggregated data — review column-level access for sensitive metrics. Documentation in schema YAML may contain business logic descriptions considered sensitive. Configure `freshness` in `sources.yml` for all production sources.

---

## Common Mistakes

- **Staging Models with Business Logic:** Staging models apply WHERE clauses, JOINs, and aggregations — staging should only rename and cast. Better: keep staging as thin wrappers, move business logic to intermediate models.
- **Inconsistent Naming:** Models follow no naming convention — finding the right model requires reading every SQL file. Better: define and enforce naming conventions with CI checks.
- **Marts That Need Joins:** Analysts must join multiple marts to answer business questions — marts not denormalized enough. Better: create combined marts for common analysis patterns.

---

## Failure Modes

- **Flat Directory Structure:** All 50 models in a single `models/` directory — no staging/intermediate/marts separation, impossible to trace dependencies. Mitigation: organize by layer and domain with clear input/output boundaries.
- **Staging Models as Tables:** Staging materialized as tables instead of views — every source refresh triggers full staging rebuild, doubling compute cost. Mitigation: use view materialization for staging.
- **Schema YAML in a Single File:** All model tests, descriptions, configurations in one 2000-line file — impossible to find specific model configuration. Mitigation: split by directory, each with its own `_models.yml`.

---

## Ecosystem Usage

dbt projects typically run outside the Laravel application in the data warehouse layer. However, the project structure patterns influence how ETL Manifesto files are organized in Laravel analytics pipelines. The staging → intermediate → marts pattern maps to the medallion architecture that Laravel ingest and export pipelines feed into.

---

## Related Knowledge Units

### Prerequisites
- Medallion Architecture — The structural pattern dbt models implement

### Related Topics
- dbt Incremental Models — Implementation details for incremental strategies
- dbt Semantic Layer — Building metrics on top of dbt marts

### Advanced Follow-up Topics
- Star Schema — Gold layer mart design for dimension modeling
- Data Vault 2.0 — Alternative architecture for staging layer design

---

## Research Notes

The staging → intermediate → marts directory structure has become the universal standard for dbt projects. It was popularized by the dbt Labs' best practices guide and has been adopted across the industry. The `stg_<source>__<entity>` naming convention ensures uniqueness and discoverability. Source freshness configuration is one of the most valued features for production pipelines.
