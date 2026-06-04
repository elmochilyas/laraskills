# Rules: dbt Project Structure for Medallion Architecture with Tests

## Rule DBTP-01: One Staging Model Per Source Table
Every upstream source table MUST have exactly one staging model. The staging model is the single entry point for that source in the dbt project.

## Rule DBTP-02: Staging Has No Business Logic
Staging models MUST NOT contain business logic (WHERE filters, JOINs, CASE statements, aggregations). Staging only renames, casts, and applies light cleaning.

## Rule DBTP-03: Marts Are Independently Queryable
Mart models MUST be independently queryable without JOINs to other marts. Analysts should not need to understand mart relationships.

## Rule DBTP-04: View Materialization for Staging
Staging models MUST use `view` or `ephemeral` materialization. Staging data must not be stored as tables.

## Rule DBTP-05: Layer-Based Naming Convention
Models MUST follow layer-based naming: `stg_<source>__<entity>`, `int_<entity>_<description>`, `<business_concept>`.

## Rule DBTP-06: Source Freshness Alerts
All production sources MUST have `freshness` alerts configured in `sources.yml`. Stale data must be detected automatically.

## Rule DBTP-07: Schema YAML Per Directory
Model tests, descriptions, and configurations MUST be split into separate `_models.yml` files per directory, not consolidated into one file.

## Rule DBTP-08: Test All Unique Keys
Every model that materializes as a table MUST have a `unique` test on its primary key in the schema YAML.

## Rule DBTP-09: Document Model Dependencies
Each model's description SHOULD document upstream source dependencies and downstream consumers.

## Rule DBTP-10: Directory Structure by Domain
Intermediate and mart models SHOULD be organized by business domain (finance, marketing, product), not by technical concerns.
