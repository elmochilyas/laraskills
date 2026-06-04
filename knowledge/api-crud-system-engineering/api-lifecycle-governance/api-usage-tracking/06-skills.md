# Skill: Track API Usage

## Purpose
Implement async API usage tracking pipeline with Redis Stream buffering, event enrichment at write time, 100% mutation sampling, consumer-facing dashboards, anomaly detection, clear data retention policies, and pipeline lag monitoring.

## When To Use
- Public APIs with billing/usage-based pricing
- APIs needing consumer behavior analytics
- Capacity planning and resource allocation
- Abuse detection and anomaly monitoring

## When NOT To Use
- Internal-only APIs with single consumer team
- APIs with no billing or usage analytics requirements
- Prototype APIs not yet in production

## Prerequisites
- Rate limit tier design
- Redis or equivalent event buffer
- Time-series storage (TimescaleDB or equivalent)

## Inputs
- Event schema definition
- Consumer metadata for enrichment
- Sampling rates per endpoint type
- Data retention policy durations

## Workflow
1. Emit usage events asynchronously via Redis Stream — never block request path for event writing
2. Enrich events with consumer metadata (tier, company ID, billing plan) at event creation time, not query time
3. Track 100% of mutation requests (POST, PATCH, PUT, DELETE) for billing accuracy; sample reads at 1-10%
4. Set data retention: 90 days raw events, 1 year hourly aggregations, 2 years daily aggregations
5. Provide consumer-facing usage dashboard showing request counts, rate limit status, and quota consumption
6. Monitor pipeline lag (event creation to storage) — alert if exceeds 60 seconds
7. Implement automated anomaly detection — alert when consumer usage deviates significantly from baseline

## Validation Checklist
- [ ] Async event pipeline (Redis Stream, never synchronous DB writes)
- [ ] Events enriched with consumer metadata at write time
- [ ] 100% mutation tracking; sampled reads (1-10%)
- [ ] Data retention policies defined and enforced (90d/1yr/2yr)
- [ ] Consumer-facing usage dashboard available
- [ ] Pipeline lag monitoring with 60s alert threshold
- [ ] Anomaly detection against consumer baseline

## Common Failures
- Tracking usage synchronously (blocking request on event writing)
- Not enriching events at ingestion time (expensive joins at query time)
- Storing raw events indefinitely (exploding storage costs)
- Not sampling high-volume read endpoints (unnecessary cost)
- No consumer-accessible usage dashboard (increased support tickets)

## Decision Points
- Event buffer: Redis Stream vs Kafka vs RabbitMQ
- Storage: TimescaleDB vs ClickHouse vs BigQuery
- Read sampling rate: 1% (high volume) vs 10% (low volume) vs 100% (analytics API)

## Performance Considerations
- Event generation at middleware: < 1ms (format + buffer push)
- Redis Stream writes: sub-millisecond in local datacenter
- Hourly aggregation of 10M events: ~5 minutes
- Dashboard queries use pre-aggregated rollups, not raw events

## Security Considerations
- Usage events may contain consumer-identifying information — apply data retention limits
- Do not log request/response payloads in usage events (PII risk)
- Aggregate data for analytics; expose only summary metrics externally
- Consumer dashboards show only that consumer's data

## Related Rules
- Never Block the Request Path for Usage Tracking
- Enrich Events at Write Time
- Track 100% of Writes, Sample Reads
- Set Clear Data Retention Policies
- Provide Consumer-Facing Usage Dashboard
- Monitor Pipeline Lag
- Detect Anomalies from Consumer Baseline

## Related Skills
- Design Rate Limit Tiers
- Monitor API Health
- Conduct API Audit Reviews

## Success Criteria
- Usage tracking adds zero latency to API request path
- Aggregation queries use enriched events (no runtime joins)
- Billing is accurate with 100% mutation tracking
- Storage costs are bounded by retention policies
- Consumers can self-serve usage data via dashboard
- Pipeline lag is monitored and alerted on
- Usage anomalies trigger security investigation
