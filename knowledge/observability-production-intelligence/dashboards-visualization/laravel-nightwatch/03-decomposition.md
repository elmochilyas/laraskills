# Decomposition: Laravel Nightwatch

## Topic Overview
Laravel Nightwatch (released 2025) is the first first-party hosted production observability platform for Laravel. Built on Amazon MSK (Kafka) and ClickHouse, it processes billions of events per day with sub-second queries. It provides deep Laravel integration â€” automatic instrumentation of requests, queries, queue jobs, cache operations, and exceptions â€” without configuration. Nightwatch is SOC 2 certified and offers a free tier (300k events/month). However, it creates vendor lo...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
dashboards-visualization/laravel-nightwatch/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Laravel Nightwatch
- **Purpose:** Laravel Nightwatch (released 2025) is the first first-party hosted production observability platform for Laravel. Built on Amazon MSK (Kafka) and ClickHouse, it processes billions of events per day with sub-second queries. It provides deep Laravel integration â€” automatic instrumentation of requests, queries, queue jobs, cache operations, and exceptions â€” without configuration. Nightwatch is SOC 2 certified and offers a free tier (300k events/month). However, it creates vendor lo...
- **Difficulty:** Intermediate
- **Dependencies:
  - Laravel Pulse (first-party alternative, self-hosted)
  - Laravel Telescope (development counterpart)
  - OpenTelemetry PHP Ecosystem (vendor-neutral alternative)

## Dependency Graph
**Depends on:**
  - Laravel Pulse (first-party alternative, self-hosted)
  - Laravel Telescope (development counterpart)
  - OpenTelemetry PHP Ecosystem (vendor-neutral alternative)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Agent
  - Event
  - Ingestion
  - Dashboard
  - Token-based authentication

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