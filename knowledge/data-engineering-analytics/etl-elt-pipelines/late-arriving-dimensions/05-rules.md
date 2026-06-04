# Rules: Late-Arriving Dimension Handling in Fact Table Loading

## Rule LA-01: Placeholder Row Required
Every dimension table MUST have a placeholder/unknown row before fact loading begins. This prevents foreign key violations when facts reference non-existent dimensions.

## Rule LA-02: Store Natural Keys in Facts
Fact tables MUST store the natural key alongside the surrogate key. Natural keys enable deferred resolution without re-joining to the dimension table.

## Rule LA-03: Idempotent Resolution
The late-arriving dimension resolution process MUST be idempotent. Running it multiple times must produce the same result to enable safe retries and scheduled execution.

## Rule LA-04: Log Resolution Events
Every late-arriving dimension resolution MUST be logged with fact ID, dimension type, natural key, and previous/current dimension values.

## Rule LA-05: Don't Block Fact Loading
Facts MUST be loaded immediately regardless of dimension availability. Use placeholder keys for unresolved dimensions. Never block fact loading while waiting for dimensions.

## Rule LA-06: Scheduled Resolution
The late-arriving dimension resolution process MUST run on a regular schedule, not just once. Dimensions may arrive at any time and facts must be updated when they do.

## Rule LA-07: Monitor Unresolved Facts
Unresolved fact count MUST be monitored and alerted. A growing backlog of unresolved facts indicates a pipeline issue with dimension loading.

## Rule LA-08: Handle SCD Overlap
When late-arriving dimensions combine with SCD, the resolution logic MUST handle effective date overlaps between placeholder and real dimension records.

## Rule LA-09: Chunked Updates for Resolution
Fact table updates during resolution MUST be chunked to avoid long-running transactions and table locks.

## Rule LA-10: Null Foreign Keys Acceptable
Nullable foreign key columns in fact tables are acceptable for late-arriving dimensions. NOT NULL constraints on fact-to-dimension foreign keys prevent late-arriving handling.
