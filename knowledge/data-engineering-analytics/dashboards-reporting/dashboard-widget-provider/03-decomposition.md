# Decomposition: Dashboard Widget Data Provider Pattern

## Topic Overview
The Dashboard Widget Data Provider pattern decouples widget rendering from data retrieval by defining dedicated provider classes that encapsulate query logic, caching, and formatting for individual dashboard widgets. This is the standard architectural pattern for Laravel dashboards: each widget has a single responsibility (showing a metric, chart, or table) and a corresponding provider that knows how to fetch and transform its data. The pattern enables testable, cacheable, and reusable widget components across dashboards.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k011-dashboard-widget-provider/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Dashboard Widget Data Provider Pattern
- **Purpose:** The Dashboard Widget Data Provider pattern decouples widget rendering from data retrieval by defining dedicated provider classes that encapsulate query logic, caching, and formatting for individual dashboard widgets.
- **Difficulty:** Foundation
- **Dependencies:** K023 (Grafana/Metabase): Alternative to in-app dashboards using external BI tools, K008 (CQRS Read Model): Providers often query read models/projections for widget data, K010 (Reverb WebSocket): Real-time widget updates via WebSocket broadcasting, K007 (Eloquent Aggregates): Core query patterns used inside providers

## Dependency Graph
**Depends on:**
- K023 (Grafana/Metabase): Alternative to in-app dashboards using external BI tools
- K008 (CQRS Read Model): Providers often query read models/projections for widget data
- K010 (Reverb WebSocket): Real-time widget updates via WebSocket broadcasting
- K007 (Eloquent Aggregates): Core query patterns used inside providers

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Widget as component:
- Provider class:
- Caching layer:
- Filter propagation:
- Data transformations:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K023 (Grafana/Metabase): Alternative to in-app dashboards using external BI tools, K008 (CQRS Read Model): Providers often query read models/projections for widget data, K010 (Reverb WebSocket): Real-time widget updates via WebSocket broadcasting, K007 (Eloquent Aggregates): Core query patterns used inside providers

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