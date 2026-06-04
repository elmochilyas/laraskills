# Decomposition: Laravel Pulse

## Topic Overview
Laravel Pulse (released 2024) is a first-party, lightweight production dashboard that provides aggregated metrics on slow requests, slow queries, exceptions, queue throughput, cache performance, and server health. It uses the application's database for storage with optional Redis ingest for high-traffic apps. Pulse is designed for low overhead â€” it aggregates data in the database and provides a Livewire-powered dashboard with configurable cards.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
dashboards-visualization/laravel-pulse/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Laravel Pulse
- **Purpose:** Laravel Pulse (released 2024) is a first-party, lightweight production dashboard that provides aggregated metrics on slow requests, slow queries, exceptions, queue throughput, cache performance, and server health. It uses the application's database for storage with optional Redis ingest for high-traffic apps. Pulse is designed for low overhead â€” it aggregates data in the database and provides a Livewire-powered dashboard with configurable cards.
- **Difficulty:** Intermediate
- **Dependencies:
  - Laravel Telescope (development counterpart)
  - Laravel Nightwatch (hosted production alternative)
  - Custom Pulse Cards (business-specific metrics)
  - OpenTelemetry Metrics API (complementary metrics for advanced use cases)

## Dependency Graph
**Depends on:**
  - Laravel Telescope (development counterpart)
  - Laravel Nightwatch (hosted production alternative)
  - Custom Pulse Cards (business-specific metrics)
  - OpenTelemetry Metrics API (complementary metrics for advanced use cases)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Recorder
  - Ingest driver
  - Sampling
  - Entry
  - Aggregation
  - Card

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization