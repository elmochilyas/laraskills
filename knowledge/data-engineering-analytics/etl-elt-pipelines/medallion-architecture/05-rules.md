# Rules: Medallion Architecture (Bronze → Silver → Gold)

## Rule MA-01: Bronze Is Immutable
Bronze layer records MUST NOT be updated or deleted. Data corrections are appended as new records with correction flags. Immutability is required for reprocessing and audit.

## Rule MA-02: Quality Gates Between Layers
Automated data quality gates MUST exist between Bronze and Silver. Null rate, schema conformity, uniqueness, and referential integrity checks prevent bad data from propagating.

## Rule MA-03: One-Way Promotion
Data promotion MUST be forward-only: Bronze → Silver → Gold. Never promote data backward. Downstream layers must not influence upstream data.

## Rule MA-04: Gold Is Denormalized
Gold layer marts MUST be denormalized for query performance. JOINs between Gold marts in dashboard queries indicate poorly designed marts.

## Rule MA-05: No Direct Application Queries on Bronze
The Laravel application MUST NOT query Bronze layer tables directly. Bronze serves as the raw landing zone and immutable store, not as a queryable data source.

## Rule MA-06: PII Removal at Silver
Personally identifiable information MUST be removed or anonymized during the Bronze → Silver transition. Silver and Gold layers must not contain raw PII.

## Rule MA-07: Incremental Gold Refresh
Gold layer MUST use incremental refresh strategies, not full rebuilds. Full refreshes become unsustainable as data volume grows.

## Rule MA-08: Data Lineage Tracking
Each layer MUST carry lineage metadata: source batch ID, promotion timestamp, and transformation version. Lineage is essential for debugging data quality issues.

## Rule MA-09: Schema Evolution Compatibility
Bronze schema changes MUST NOT break existing Silver or Gold transformations. Schema changes in upstream layers must be additive or handled via schema-on-read.

## Rule MA-10: Per-Layer Access Control
Access control MUST be configured per medallion layer. Bronze access for data engineers, Silver for analysts, Gold for dashboard consumers.
