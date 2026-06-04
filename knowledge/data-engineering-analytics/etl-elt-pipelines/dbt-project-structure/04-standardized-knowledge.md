# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 03-etl-elt-pipelines
**Knowledge Unit:** dbt-project-structure
**Difficulty:** Advanced
**Category:** Data Project Organization
**Last Updated:** 2026-06-03

---

# Overview

A well-structured dbt project organizes models, tests, documentation, and configurations into a maintainable hierarchy that mirrors the medallion architecture. The standard pattern — **staging → intermediate → marts** — maps directly to Bronze → Silver → Gold, with each layer having specific conventions for naming, testing, and materialization.

Beyond directory structure, a dbt project includes YAML property files that define sources, models, tests, and documentation in one place. This declarative approach keeps configuration co-located with the models it describes, reducing context switching and making the project self-documenting.

Engineers must care because dbt project structure directly determines maintainability, onboarding speed, and pipeline reliability. A poorly organized dbt project with inconsistent naming, missing tests, and undocumented sources becomes unmanageable as it grows. A well-structured project enables multiple engineers to work independently across layers.

---

# Core Concepts

## Staging Models

Staging models are the first transformation layer, corresponding to Bronze. Each source table gets a staging model that renames columns, casts types, and applies light cleaning. Staging models are views (not tables) and are always `ephemeral` or `view` materialized.

## Intermediate Models

Intermediate models sit between staging and marts (Silver layer). They contain business logic: deduplication, joins across staging models, filtering, and enrichment. Intermediate models are typically tables or incremental tables.

## Mart Models

Mart models are the gold layer — denormalized, aggregated, business-specific data marts. Each mart answers a specific business question. Marts are tables or incremental tables optimized for BI tool consumption.

## Sources YAML

The `sources.yml` file defines upstream database tables that dbt reads. It specifies the source name, table names, freshness requirements, and loading information. Sources are the contract between dbt and the data ingestion layer.

## Schema YAML

Schema YAML files (one per model directory) define model configurations, column descriptions, tests, and relationships. They are the single source of truth for model metadata.

---

# When To Use

- Any dbt project with more than 5 models
- Teams with multiple data engineers working on the same project
- Projects that need to enforce consistent naming and testing conventions
- Data pipelines that evolve over time (most do)
- Organizations that need self-documenting data models

---

# When NOT To Use

- Single-user dbt projects with fewer than 5 models
- Prototype projects where structure is overhead
- Projects that are entirely managed by automation tools
- Very simple pipelines that don't need layer separation

---

# Best Practices

## One Staging Model Per Source Table

Every source table gets exactly one staging model in `models/staging/<source>/*.sql`. The staging model is the single point of entry for that source in the dbt project.

## Marts Are Queryable Without Joins

Each mart model should be independently queryable. Analysts should not need to join mart models together. If analysts are joining marts, the marts are not denormalized enough.

## Name Models by Entity, Not by Action

Models should be named after the entity they represent (`orders`, `customers`, `daily_revenue`), not the action that creates them (`clean_orders`, `transform_customers`). The action is implicit from the layer.

## Use Source Freshness Alerts

Configure `freshness` in `sources.yml` for all production sources. dbt will alert when data stops arriving, enabling rapid response to ingestion failures.

---

# Architecture Guidelines

## Directory Layout

```
models/
├── staging/
│   ├── postgres/
│   │   ├── stg_postgres__users.sql
│   │   ├── stg_postgres__orders.sql
│   │   └── sources.yml
│   └── api/
│       ├── stg_api__customers.sql
│       └── sources.yml
├── intermediate/
│   ├── finance/
│   │   ├── int_orders_pivoted.sql
│   │   └── _int_models.yml
│   └── product/
│       └── int_user_sessions.sql
└── marts/
    ├── finance/
    │   └── monthly_revenue.sql
    ├── marketing/
    │   └── campaign_performance.sql
    └── _marts_models.yml
```

## Naming Conventions

- Staging: `stg_<source>__<entity>.sql`
- Intermediate: `int_<entity>_<description>.sql`
- Marts: `<entity>_<aggregation>.sql` or `<business_concept>.sql`
- Schema YAML: `_<directory>_models.yml` (underscore prefix for order)

## Materialization Strategy

- Staging: `view` or `ephemeral` (never store staging data)
- Intermediate: `table` or `incremental` (store for downstream queries)
- Marts: `table` or `incremental` (optimized for BI consumption)

---

# Performance Considerations

- Staging models as views have no storage cost but add query compile time.
- Intermediate model materialization choice depends on downstream query frequency: table if queried by multiple marts, ephemeral if used only once.
- Marts should use incremental materialization if refresh cost exceeds storage benefit.
- Use the `+` config syntax to set materialization per directory in `dbt_project.yml`.

---

# Security Considerations

- Sources YAML defines upstream connections. Ensure these connections have read-only permissions.
- Mart models may expose aggregated data. Review column-level access for sensitive metrics.
- Documentation in schema YAML may contain business logic descriptions considered sensitive.

---

# Common Mistakes

## Mistake: Staging Models with Business Logic

Staging models apply WHERE clauses, JOINs, and aggregations. Staging should only rename and cast. Business logic belongs in intermediate models.

**Better approach:** Keep staging models as thin wrappers over source tables. Move all business logic to intermediate models.

## Mistake: Inconsistent Naming

Models follow no naming convention. Finding the right model requires reading every SQL file. New engineers cannot navigate the project.

**Better approach:** Define and enforce naming conventions in a CONTRIBUTING.md file. Add CI checks for naming compliance.

## Mistake: Marts That Need Joins

Analysts must join `daily_sales` with `store_locations` and `product_hierarchy` to answer "Which stores had the highest sales last month?"

**Better approach:** Create a `store_sales_summary` mart that includes all dimensions needed for store performance analysis.

---

# Anti-Patterns

## Flat Directory Structure
All 50 models are in a single `models/` directory. There is no staging/intermediate/marts separation. Models reference each other in ways that are impossible to trace.

**Solution:** Organize models by layer and domain. Each layer has clear input/output boundaries.

## Staging Models as Tables
Staging models are materialized as tables instead of views. Every source refresh triggers a full staging rebuild, doubling warehouse compute cost.

**Solution:** Use `view` materialization for staging models. Staging data is never stored independently.

## Schema YAML in a Single File
All model tests, descriptions, and configurations are in one 2000-line `schema.yml` file. Finding a specific model's configuration is a manual search.

**Solution:** Split schema YAML by directory. Each model directory has its own `_models.yml` file.

---

# Examples

## Staging Model

```sql
-- models/staging/postgres/stg_postgres__orders.sql
SELECT
    id AS order_id,
    customer_id,
    order_date::date AS order_date,
    total::decimal(10,2) AS total,
    status,
    created_at,
    updated_at
FROM {{ source('postgres', 'orders') }}
```

## Source Freshness Config

```yaml
# models/staging/postgres/sources.yml
sources:
  - name: postgres
    database: production
    schema: public
    freshness:
      warn_after: { count: 1, period: hour }
      error_after: { count: 6, period: hour }
    tables:
      - name: orders
        loaded_at_field: updated_at
      - name: customers
        loaded_at_field: updated_at
```

---

# Related Topics

**Prerequisites:**
- Medallion Architecture — The structural pattern dbt models implement

**Closely Related:**
- dbt Incremental Models — Implementation details for incremental strategies
- dbt Semantic Layer — Building metrics on top of dbt marts

**Advanced Follow-Up:**
- Star Schema — Gold layer mart design for dimension modeling
- Data Vault 2.0 — Alternative architecture for staging layer design
