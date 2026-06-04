# ECC Standardized Knowledge — API Usage Tracking

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Lifecycle & Governance |
| Knowledge Unit | API Usage Tracking |
| Difficulty | Advanced |
| Category | Governance |
| Last Updated | 2026-06-02 |

## Overview

API usage tracking captures, stores, and analyzes consumer request patterns for billing, capacity planning, abuse detection, and product analytics. Events flow through an async pipeline: request -> middleware (event generation) -> Redis Stream (buffer) -> consumer (enrichment) -> TimescaleDB (storage) -> hourly/daily aggregation -> billing system and dashboards.

## Core Concepts

- **Usage event**: Structured record of single API request (consumer ID, endpoint, method, status, latency, timestamp).
- **Async event pipeline**: Events never block the request path. Generated at middleware, buffered in Redis Stream.
- **Event enrichment**: Raw events enriched with consumer metadata (tier, company, billing plan) at ingestion time.
- **Billing integration**: Aggregated usage metrics fed to billing system for invoice generation.
- **Aggregation schedule**: Hourly for dashboards and monitoring; daily for billing.
- **Data retention**: 90 days raw events; 2 years aggregated rollups.

## When To Use

- Public APIs with billing/usage-based pricing
- APIs needing consumer behavior analytics
- Capacity planning and resource allocation
- Abuse detection and anomaly monitoring

## When NOT To Use

- Internal-only APIs with single consumer team
- APIs with no billing or usage analytics requirements
- Prototype APIs not yet in production

## Best Practices

- **Async event pipeline**: Never block request path for usage tracking. Push to buffer and return immediately.
- **Enrich at write time**: Add consumer metadata when event is created, not at query time — eliminates expensive joins.
- **100% tracking for writes, sample reads**: Track all mutation operations; sample read-only endpoints at 1-10% for analytics.
- **Consumer-facing dashboard**: Allow consumers to see their own real-time usage (reduces support tickets).
- **Unified event schema**: Consistent schema across all services and endpoints.
- **Anomaly detection**: Automated alerts when consumer usage deviates from baseline.

## Architecture Guidelines

- Event transport: Redis Stream (simple, fast, native to Laravel ecosystem).
- Storage: TimescaleDB (time-series optimized, SQL interface).
- Aggregation: Hourly for dashboards, daily for billing, both as async batch jobs.
- Consumer dashboard embedded in developer portal.
- Pipeline monitoring: track event lag (event creation to storage); alert if > 60 seconds.

## Performance Considerations

- Event generation at middleware: < 1ms (format + buffer push).
- Redis Stream writes: sub-millisecond in local datacenter.
- Hourly aggregation of 10M events: ~5 minutes on TimescaleDB.
- Dashboard queries use pre-aggregated rollups, not raw events.

## Security Considerations

- Usage events may contain consumer-identifying information (IP, API key prefix). Apply data retention limits.
- Do not log request/response payloads in usage events (PII risk).
- Aggregate data for analytics; expose only summary metrics externally.
- Consumer dashboards show only that consumer's data.

## Common Mistakes

- Tracking usage synchronously (blocking request on event writing).
- Not enriching events at ingestion time (requires expensive joins at query time).
- Storing raw events indefinitely (exploding storage costs).
- Not sampling high-volume read endpoints (unnecessary cost for non-billing data).
- No consumer-accessible usage dashboard (increased support tickets).

## Anti-Patterns

- **Synchronous tracking on request path**: Adds latency to every request for every consumer.
- **No event buffering**: Direct database writes on every request — database becomes bottleneck.
- **Storing everything raw forever**: Storage costs grow unbounded with no analytical benefit.

## Examples

- Event schema: `{ consumer_id, api_key_prefix, endpoint, method, status, latency_ms, timestamp, tier, company_id }`.
- Pipeline: `Request -> Middleware -> Redis Stream -> Enrichment Worker -> TimescaleDB -> Hourly Aggregation -> Dashboard`.
- Data retention: Raw events = 90d, hourly aggregations = 1yr, daily aggregations = 2yr.

## Related Topics

- **Prerequisites**: Rate Limit Tier Design, API Monitoring and Alerting
- **Closely Related**: Bulk Operation Design, API Audit Review Process
- **Advanced**: Real-time usage anomaly detection with ML, Multi-dimensional usage analytics, Usage forecasting for capacity planning

## AI Agent Notes

When implementing usage tracking: use async pipeline (never block request path), enrich events at write time, track 100% of writes and sample reads, set 90d raw retention + 2yr aggregated, provide consumer-facing dashboard, detect anomalies from baseline, monitor pipeline lag.

## Verification

Sources: Stripe usage tracking pipeline, Twilio Console Usage, AWS detailed billing reports, domain-analysis.md.
