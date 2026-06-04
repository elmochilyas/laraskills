# Skills: Medallion Architecture (Bronze → Silver → Gold)

## Skill: Implementing Medallion Layers in ClickHouse
**Purpose:** Design and implement Bronze/Silver/Gold layers using ClickHouse for a Laravel analytics pipeline.
**When to use:** Setting up a medallion-architected analytics pipeline with ClickHouse storage.
**Steps:**
1. Design Bronze layer tables: append-only, full fidelity, partition by ingestion date
2. Implement Silver layer tables: deduplicated, typed, partitioned by event date
3. Implement Gold layer tables: aggregated, denormalized, using AggregatingMergeTree
4. Create materialized views for Bronze → Silver transformation
5. Create dbt models or Laravel jobs for Silver → Gold aggregation
6. Configure data quality monitoring between layers
7. Implement TTL policies for each layer
8. Set up per-layer access control

## Skill: Data Promotion with dbt
**Purpose:** Use dbt to implement Bronze → Silver → Gold data promotion in a medallion architecture.
**When to use:** Managing data transformations across medallion layers in a dbt-powered data warehouse.
**Steps:**
1. Organize dbt project with staging (Bronze), intermediate (Silver), and marts (Gold) directories
2. Create staging models for raw source → Bronze
3. Implement Silver models with deduplication, typing, and enrichment
4. Create Gold marts as denormalized, aggregated models
5. Configure incremental materialization for Silver and Gold
6. Add generic and singular tests as quality gates
7. Document data lineage in dbt docs
8. Schedule layer promotion with dbt Cloud or Airflow
