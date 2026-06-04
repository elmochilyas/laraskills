# ECC Standardized Knowledge — Bulkhead Pattern

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | resilience-reliability-patterns |
| Knowledge Unit ID | ku-02 |
| Knowledge Unit | Bulkhead Pattern |
| Difficulty | Advanced |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K002, K017, K007 |

## Overview (Engineering Value)
The bulkhead pattern isolates resources (connections, threads, queues) per external service so that a failure or latency spike in one service doesn't exhaust resources needed by others. Named after ship bulkheads that prevent flooding from spreading across compartments, this pattern ensures that a degraded Stripe API doesn't prevent your app from calling Mailgun. In Laravel, bulkheads are implemented via separate connection pools per service, dedicated queue workers per integration, and isolated Guzzle client instances.

## Core Concepts
- **Resource Isolation**: Separate connection pools, thread pools, or queue workers per service
- **Connection Pool Limits**: Maximum concurrent connections per upstream service
- **Queue Isolation**: Dedicated queue workers per integration, not shared
- **Thread/Process Isolation**: Separate worker processes for critical vs non-critical integrations
- **Failure Containment**: One service's degradation doesn't affect others' resource availability
- **Pool Exhaustion Protection**: When one pool is exhausted, only that service is affected

## When To Use
- Multiple external API integrations in the same application
- Critical and non-critical integrations mixed together
- Services with different latency profiles (fast internal API + slow external API)
- High-traffic integrations that could exhaust connection pools

## When NOT To Use
- Single external API integration (no sharing to isolate)
- Very low traffic where resource exhaustion is unlikely
- Shared caching or logging integrations (different use case)

## Best Practices
- Use separate Guzzle client instances per service (each has its own connection pool)
- Configure per-service queue workers with dedicated Horizon pools
- Set connection pool limits based on upstream API capacity and expected concurrency
- Isolate critical integrations (payment) from non-critical (analytics) in separate workers
- Monitor per-service pool utilization and exhaustion rates

## Architecture Guidelines
- Separate Saloon connector instances per service (each has own Guzzle client)
- Horizon: dedicated queue per integration service
- Connection pool size: 2-10 per service, depending on concurrency needs
- Worker allocation: more workers for critical, latency-sensitive integrations
- Timeout configuration per pool based on service SLA

## Performance Considerations
- Dedicated connection pools increase total connection count but prevent cross-service contention
- Queue isolation ensures one service's backlog doesn't delay others
- Pool limits prevent runaway concurrency from exhausting system resources (file descriptors, memory)
- Per-pool monitoring enables capacity planning per service

## Common Mistakes
- Sharing a single Guzzle client across all services (one service's latency spike exhausts the shared pool)
- Using a single queue for all integrations (webhook processing backlog delays payment jobs)
- Not configuring pool limits (unbounded connections cause socket exhaustion)
- Over-isolation (separate worker per integration for low-traffic services wastes resources)

## Related Topics
- **Prerequisites**: Circuit breaker basics, connection pooling, queue workers
- **Closely Related**: Circuit breaker (ku-01), timeout handling (ku-03), degraded mode (ku-05)
- **Advanced**: Resource contention analysis, dynamic pool sizing
- **Cross-Domain**: Resilience engineering, capacity planning

## Verification
- [ ] Separate Guzzle client/connector per service
- [ ] Dedicated queue workers per critical integration
- [ ] Connection pool limits configured per service
- [ ] Pool exhaustion in one service doesn't affect others
- [ ] Per-service pool utilization monitored
