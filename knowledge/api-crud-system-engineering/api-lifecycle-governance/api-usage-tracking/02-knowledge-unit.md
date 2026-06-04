# API Usage Tracking

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Lifecycle & Governance
- **Last Updated:** 2026-06-02

## Executive Summary
API usage tracking captures, stores, and analyzes consumer request patterns for billing, capacity planning, abuse detection, and product analytics. A robust tracking pipeline provides real-time visibility into who is using the API, how they are using it, and whether usage patterns indicate emerging problems.

## Core Concepts
- **Usage Event:** A structured record of a single API request (consumer ID, endpoint, method, status, latency, timestamp).
- **Usage Pipeline:** The flow from request → event → enrichment → storage → aggregation → dashboard.
- **Consumer Tracking:** Attribution of each request to a specific API key or consumer account.
- **Billing Integration:** Aggregated usage metrics fed into the billing system for invoice generation.
- **Rate Monitoring:** Real-time tracking of request volume, error rates, and latency per consumer.
- **Usage Analytics:** Dashboards and reports showing usage trends, popular endpoints, and consumer behavior.

## Mental Models
- **Utility Meter:** Like electricity or water meters — every API call is metered, and consumers are billed based on their meter reading at the end of the billing period.
- **Traffic Camera System:** Each request is a car passing a camera. The system records license plate (API key), speed (latency), destination (endpoint), and whether it ran a red light (error).

## Internal Mechanics
1. **Event Generation:** Each API request generates a usage event at the gateway or middleware layer.
2. **Event Enrichment:** The raw event is enriched with consumer metadata (tier, company, billing info).
3. **Event Buffering:** Events are written to a fast buffer (Redis stream or Kafka) for durability.
4. **Async Processing:** A consumer reads events from the buffer and writes them to the analytics store.
5. **Aggregation:** Hourly/daily batch jobs aggregate raw events into rollups (counts, percentiles, error rates).
6. **Billing Feed:** Aggregated usage is sent to the billing system at the end of each billing period.
7. **Dashboard Refresh:** Consumer-facing and internal dashboards display current usage with sub-minute latency.

## Patterns
- **Async Event Pipeline:** Never block the request path for usage tracking — always use async event processing.
- **Sampling for High-Volume Endpoints:** Track 100% of writes but sample reads at 1% for analytics (if not billing-critical).
- **Consumer-Facing Usage Dashboard:** Allow consumers to see their own usage in real-time (reduces support tickets).
- **Anomaly Detection:** Automated alerts when a consumer's usage deviates from their baseline (potential abuse or bug).
- **Unified Event Schema:** A consistent schema for usage events across all services and endpoints.

## Architectural Decisions
| Decision | Option | Chosen | Rationale |
|---|---|---|---|
| Event transport | Redis Stream / Kafka / RabbitMQ | Redis Stream | Simple, fast, built into Laravel ecosystem |
| Storage backend | TimescaleDB / ClickHouse / Elasticsearch | TimescaleDB | Time-series optimized, SQL interface, good analytics |
| Aggregation schedule | Real-time / Hourly / Daily | Hourly + daily | Hourly for monitoring; daily for billing |
| Consumer dashboard | Embedded / Separate / Portal | Developer Portal (embedded) | Single location for all consumer tools |
| Data retention | 30d / 90d / 1yr | 90d raw events; 2yr aggregated | Balances storage cost with analytical value |

## Tradeoffs
| Tradeoff | Consideration |
|---|---|
| Synchronous vs async tracking | Sync is simpler but adds latency to request path; async is complex but non-blocking |
| Raw vs sampled data | Raw data is accurate but expensive to store; sampling is cheaper but may miss billing events |
| Rich vs minimal events | Rich events enable deep analysis but increase pipeline cost; minimal events are cheaper but limited |
| Real-time vs batch dashboards | Real-time is impressive but expensive; batch is cheaper and sufficient for most use cases |

## Performance Considerations
- Event generation at the middleware level adds < 1ms (just format + push to buffer).
- Redis Stream writes are sub-millisecond in the local datacenter.
- Hourly aggregation of 10M events takes ~5 minutes on TimescaleDB.
- Dashboard queries should use pre-aggregated rollups, not raw events.

## Production Considerations
- **Monitoring:** Track event pipeline lag (seconds between event creation and storage); alert if > 60s.
- **Logging:** Log pipeline errors (failed events, enrichment failures) for data quality monitoring.
- **Backup:** Raw events in Redis Stream have configurable retention; TimescaleDB has automated backups.
- **Rollback:** If a tracking change causes pipeline issues, revert the event schema change.
- **Testing:** Test event pipeline under load (10x expected volume) to ensure no backpressure on request path.

## Common Mistakes
- Tracking usage synchronously (blocking the request on event writing).
- Not enriching events with consumer metadata at ingestion time (requires joins later).
- Storing raw events indefinitely (exploding storage costs).
- Not sampling high-volume read endpoints (unnecessary cost for non-billing data).
- Building a usage dashboard that consumers cannot access (increases support tickets for "how much have I used?").

## Failure Modes
- **Pipeline Backpressure:** Events accumulate faster than they can be processed → Redis Stream fills up. Mitigation: auto-scaling consumers; dead-letter queue for failed events.
- **Data Loss:** Redis crash before events are consumed → lost usage data. Mitigation: Redis Stream with replication; combine with application-level logging as backup.
- **Billing Discrepancy:** Aggregated usage does not match consumer's own tracking. Mitigation: provide consumers access to raw event logs for reconciliation.
- **Enrichment Failure:** Consumer metadata unavailable → unclassified events. Mitigation: cache consumer metadata in Redis for enrichment.

## Ecosystem Usage
- **Stripe:** Usage-based billing with real-time dashboard; consumers can view request logs and usage summaries.
- **Twilio:** "Console Usage" page shows real-time and historical usage with cost breakdowns.
- **AWS:** Detailed billing reports with per-service, per-region, per-API-call granularity.

## Related Knowledge Units

### Prerequisites
- [Rate Limit Tier Design](ku-15-rate-limit-tier-design)
- [API Monitoring and Alerting](ku-18-api-monitoring-alerting)

### Related Topics
- [Bulk Operation Design](ku-09-bulk-operation-design)
- [API Audit Review Process](ku-08-api-audit-review-process)

### Advanced Follow-up Topics
- Real-time usage anomaly detection with ML
- Multi-dimensional usage analytics (by endpoint, geo, time of day)
- Usage forecasting for capacity planning

## Research Notes

### Source Analysis
Stripe's usage tracking pipeline is documented in their engineering blog. Their key insight is separating the "billing path" (100% accurate, synchronous confirmation) from the "analytics path" (sampled, async, high-dimensional).

### Key Insight
The most important architectural choice is **event enrichment at write time, not query time**. Enriching events with consumer metadata (tier, company name, billing plan) when the event is created eliminates expensive joins during query and aggregation.

### Version-Specific Notes
- Laravel 11.x: Redis Streams via `Illuminate\Support\Facades\Redis`; TimescaleDB integration via custom service provider.
- PHP 8.4: `ext-redis` with Stream support; `ext-pdo` for TimescaleDB queries.
