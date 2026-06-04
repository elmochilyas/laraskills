# Rules: Write Amplification in ClickHouse Materialized View Chains

## Rule WA-01: Measure Amplification Factor
Write amplification factor MUST be measured and tracked. Target: < 3x for production pipelines. Alert when amplification exceeds 5x.

## Rule WA-02: Limit MV Count
Source tables MUST have at most 3 materialized views. More MVs require consolidation or architectural review.

## Rule WA-03: Prefer WAL-Backed MVs
New materialized views on ClickHouse 24.8+ MUST use WAL-backed MVs. Trigger-based MVs are only justified for backward compatibility.

## Rule WA-04: Refreshable MVs for Non-Real-Time
Non-real-time aggregations MUST use refreshable MVs to avoid write-time amplification.

## Rule WA-05: Prefer Projections for Sort Alternatives
Alternative sort orders MUST use projections, not MVs. Projections have lower amplification for sort-only transformations.

## Rule WA-06: Monitor Merge Amplification
Background merge amplification MUST be monitored via `system.merges`. Excessive merge activity indicates amplification issues.

## Rule WA-07: Capacity Planning with Amplification
Storage and I/O capacity planning MUST account for write amplification. Multiply raw data volume by expected amplification factor.

## Rule WA-08: No Cascading MVs
Cascading MVs (MV → Table → MV) MUST NOT be created. Consolidate into a single transformation path.

## Rule WA-09: Document Amplification Budget
Each table's MV and projection design MUST document the expected amplification factor and budget.

## Rule WA-10: Test Insert Throughput with MVs
Insert throughput MUST be tested with the final MV configuration before production deployment. MVs can reduce insert throughput by 50%+.
