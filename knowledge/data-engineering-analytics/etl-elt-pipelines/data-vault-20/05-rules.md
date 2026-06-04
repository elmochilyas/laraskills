# Rules: Data Vault 2.0 Modeling

## Rule DV-01: Business Key Uniqueness in Hubs
Hubs MUST enforce uniqueness on the business key column. Duplicate business keys in a Hub represent a data quality issue that must be resolved before loading.

## Rule DV-02: Load Date and Record Source Required
Every Hub, Link, and Satellite MUST include a load date and record source column. These are required for lineage tracking and point-in-time reconstruction.

## Rule DV-03: Group Satellites by Source and Change Rate
Attributes MUST be grouped into Satellites by source system and rate of change. Rapidly changing and stable attributes must be in separate Satellites.

## Rule DV-04: No Overlapping Satellite Dates
Satellite effective dates for the same Hub MUST NOT overlap. Use Type 1 (overwrite) or Type 2 (version) designators consistently within a Satellite.

## Rule DV-05: Use PIT Tables for Temporal Queries
Point-in-time queries MUST use PIT tables, not direct Data Vault JOINs. PIT tables reduce JOIN complexity and ensure correct temporal resolution.

## Rule DV-06: Gold Layer for Consumption
BI tools and dashboards MUST query Gold marts, not Data Vault tables directly. Data Vault is a loading-optimized model, not a query-optimized presentation layer.

## Rule DV-07: Parallel Loading Allowed
Hubs, Links, and Satellites MAY be loaded in parallel because they have no insert-time interdependencies. Use this capability to maximize batch throughput.

## Rule DV-08: Hub Key Immutability
Hub business keys MUST be treated as immutable. If a business key changes, it defines a new entity with a new surrogate key. The old surrogate key is retained for historical fact references.

## Rule DV-09: Satellite Design by Domain
Satellite groupings SHOULD follow domain boundaries. Customer demographics, customer contact, and customer preferences should be separate Satellites.

## Rule DV-10: Bridge for Complex Relationships
Hubs connected through multiple Links SHOULD use Bridge tables for query performance. Bridges pre-join complex relationship paths.
