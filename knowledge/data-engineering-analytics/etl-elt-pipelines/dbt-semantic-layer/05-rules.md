# Rules: dbt Semantic Layer + MetricFlow for Consistent Metrics

## Rule SL-01: Define Metrics on Gold Marts
All Semantic Layer metrics MUST reference Gold layer marts, not intermediate or staging models. Metrics add business semantics over pre-processed data.

## Rule SL-02: One Source of Truth
All metric definitions MUST live in the Semantic Layer. The same metric MUST NOT be defined in multiple BI tools or application code.

## Rule SL-03: Document Every Metric
Every metric definition MUST include a description explaining the business context, calculation methodology, and owner.

## Rule SL-04: Test Metric Values
Metrics MUST have automated tests that verify values against a known baseline for a fixed date range.

## Rule SL-05: Version Breaking Changes
Metric definition changes that alter values MUST create a new metric version rather than modifying in-place. Old versions must remain queryable.

## Rule SL-06: Simple Metrics, Not Complex Logic
Metric definitions MUST be simple aggregations over clean mart data. Complex computation belongs in dbt models, not metric definitions.

## Rule SL-07: No Direct Warehouse Access for Metrics
All metric consumption MUST route through the Semantic Layer. Direct warehouse queries for the same metric bypass consistency controls.

## Rule SL-08: Cache Common Queries
Frequently accessed metric queries MUST be cached. The Semantic Layer cache reduces warehouse load and query response time.

## Rule SL-09: Authentication for Layer API
The Semantic Layer API MUST be behind authentication. Anonymous metric access exposes business-sensitive data.

## Rule SL-10: Per-Metric Access Control
Metrics SHOULD have role-based access control. Sensitive metrics (revenue, margins) should be restricted to authorized roles.
