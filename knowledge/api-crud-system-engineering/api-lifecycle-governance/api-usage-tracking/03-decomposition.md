# API Usage Tracking — Decomposition

## Boundary Analysis
| Boundary Type | Description |
|---|---|
| In-Scope | Usage event schema, async event pipeline (Redis Stream → TimescaleDB), event enrichment, hourly/daily aggregation, billing feed, consumer-facing dashboard, anomaly detection, data retention policies |
| Out-of-Scope | Billing system internals, rate limit enforcement (covered by Rate Limit Tier Design), real-time monitoring (covered by API Monitoring) |
| External Interfaces | Redis Stream (event buffer), TimescaleDB (storage), Billing System (aggregated feed), Developer Portal (dashboard), Monitoring System (pipeline health) |
| Constraints | Events must be async (non-blocking); 90-day raw data retention; hourly aggregations for dashboard; daily aggregations for billing |

## Atomicity Assessment
| Aspect | Verdict | Rationale |
|---|---|---|
| Can this be split into smaller KUs? | No | Usage tracking is a single pipeline from event generation to dashboard — splitting would create artificial boundaries |
| Single-responsibility check | Pass | Focuses exclusively on capturing and processing API usage data |
| Overlap with adjacent KUs | Moderate | Shares event data with Rate Limit Tier Design (counters); shares dashboard with API Monitoring |

## Dependency Graph
```
Rate Limit Tier Design ─────────┐
                                  ├──→ API Usage Tracking ──→ API Monitoring and Alerting
API Monitoring and Alerting ─────┘
```

## Follow-up
| Question | Source | Resolution |
|---|---|---|
| Do we need real-time usage dashboards or hourly is sufficient? | Product review | Hourly is sufficient for most consumers; real-time for Enterprise tier only. |
| How do we handle usage tracking for internal (free) consumers? | Policy review | Track all usage for capacity planning; exclude from billing. |
| Should we expose raw event logs to consumers? | Security review | Yes — via API with appropriate authentication and no PII in event data. |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization