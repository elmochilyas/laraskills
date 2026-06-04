# Metadata

**Domain:** Data Engineering & Analytics
**Subdomain:** Read Models & CQRS for Analytics
**Knowledge Unit:** Event Sourcing Temporal Queries (Point-in-Time State Reconstruction)
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Snapshot-Based Temporal Queries vs Full Replay

---

## Decision Context

Choosing between periodic snapshots and full event replay for temporal (point-in-time) queries.

---

## Decision Criteria

* performance
* storage

---

## Decision Tree

How many events does the aggregate have on average?
↓
< 100 events per aggregate → Full replay from beginning is acceptable — query time < 10ms
        ↓
        Is the event store expected to stay small (< 10K events total)?
        YES → No snapshots needed — full replay is fast enough indefinitely
        NO → Add snapshots proactively — the aggregate will grow over time
100-1000 events per aggregate → Use periodic snapshots every 100 events — replay bounded to < 100 events
        ↓
        Are snapshots being created?
        YES → Verify snapshot interval: every 100 events guarantees < 100ms replay
        NO → Implement snapshot creation — temporal queries will slow down as events accumulate
> 1000 events per aggregate → Snapshots are mandatory; also pre-compute daily PIT snapshots for dashboard queries
        ↓
        Are daily PIT snapshots pre-computed?
        YES → Dashboard temporal queries are fast — simple SELECT from daily_state table
        NO → Each dashboard query triggers on-demand replay — 1M+ event aggregates take 10+ seconds

---

## Rationale

Replaying from the beginning of time gets linearly slower as the event store grows. Snapshots bound replay to the interval size. Pre-computed daily PIT snapshots eliminate on-demand replay for dashboard use cases entirely.

---

## Recommended Default

**Default:** Snapshots every 100 events per aggregate + pre-computed daily PIT table for dashboards
**Reason:** Bounds replay to < 10ms per query; dashboards never trigger on-demand replay

---

## Risks Of Wrong Choice

No snapshots: temporal queries take 30+ seconds after 6 months of events; on-demand replay for dashboards: 100 dashboard rows trigger 100 replays = 10+ seconds load time

---

## Related Rules

K029: Use Periodic Snapshots, K029: Pre-compute Daily PIT Snapshots

---

## Related Skills

Implement Temporal Queries

---

## Event Retention Period vs Snapshot Retention Period

---

## Decision Context

Determining retention policies for raw stored events vs pre-computed snapshots.

---

## Decision Criteria

* storage
* maintainability

---

## Decision Tree

Is the use case audit/compliance requiring full event history?
↓
YES → Keep full events for the compliance period (typically 1-7 years)
        ↓
        Does GDPR right-to-erasure apply?
        YES → Implement cascade delete for all events of a deleted user — deletion breaks replay capability for that aggregate
                ↓
                Is the deletion rate high?
                YES → Plan for snapshot re-creation after deletion — snapshot may reference deleted events
                NO → Manual handling per deletion request is acceptable
        NO → Full event retention is simpler — no deletion logic needed
NO → Is the use case analytics/dashboards with current-state focus?
        YES → Keep full events for 90 days, daily snapshots for 3 years, yearly snapshots beyond
                ↓
                Are weekly snapshot validations (compare to full replay) configured?
                YES → Confidence in snapshot correctness — pruned events can be safely removed
                NO → Do not prune until validation is in place — corrupted snapshots produce incorrect temporal queries silently
        NO → Define retention based on the longest-required temporal query window

---

## Rationale

Storing all events forever is expensive and unnecessary for most use cases. 90 days of events covers debugging and recent audits. Daily snapshots preserve the ability to answer "what was the state on any date" without raw events.

---

## Recommended Default

**Default:** Full events 90 days, daily snapshots 3 years, yearly snapshots beyond
**Reason:** Balances storage cost with temporal query capability for common analytics and audit use cases

---

## Risks Of Wrong Choice

No pruning: event store grows unbounded to terabytes; snapshot creation takes hours; premature pruning without validation: corrupted snapshots produce incorrect temporal queries

---

## Related Rules

K029: Retention Strategy for Events and Snapshots, K029: Validate Snapshots Periodically

---

## Related Skills

Implement Temporal Queries, Implement Event Sourcing Cleanup

---

## On-Demand Replay vs Pre-Computed Daily Tables for Dashboards

---

## Decision Context

Choosing between on-demand event replay and pre-computed daily aggregate tables for dashboard temporal queries.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Is this a dashboard query that loads multiple rows (10+ aggregates)?
↓
YES → Use pre-computed daily PIT tables — on-demand replay for each row is too slow
        ↓
        Does the dashboard need sub-second load time?
        YES → Pre-compute nightly — scheduled command generates daily_state table; dashboard queries simple indexed SELECT
                ↓
                Is the PIT table data current enough (< 24 hours stale)?
                YES → Nightly refresh is sufficient for most dashboard use cases
                NO → Add intra-day PIT snapshots (every hour) for freshness-critical aggregates
        NO → On-demand replay may be acceptable if aggregate count is low (< 3 rows)
NO → Is this an audit/debug query for a single aggregate?
        YES → On-demand replay with snapshot optimization is appropriate — single aggregate replay in < 50ms
                ↓
                Is snapshot available within the target time range?
                YES → Replay from snapshot — fast, targeted, no pre-computation needed
                NO → Replay from beginning — slower but acceptable for one-off audits
        NO → Use pre-computed tables for any query pattern repeated more than once per day

---

## Rationale

On-demand replay is powerful for one-off audits but does not scale to dashboards. A single dashboard page showing 100 aggregates × 10ms replay = 1 second. Pre-computed tables eliminate this entirely, reducing per-query cost to a simple indexed SELECT.

---

## Recommended Default

**Default:** Pre-computed daily PIT tables for dashboard queries; on-demand replay with snapshots for one-off audits
**Reason:** Dashboards need predictable sub-second performance; audits need flexibility

---

## Risks Of Wrong Choice

On-demand replay for dashboards: 10+ second load times for multi-row views; pre-computed tables that are never queried: wasted storage and compute for unused data

---

## Related Rules

K029: Pre-compute Daily PIT Snapshots for Dashboard Queries

---

## Related Skills

Implement Temporal Queries, Build Dashboard Data Providers
