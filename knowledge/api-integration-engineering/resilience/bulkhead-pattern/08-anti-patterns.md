# ECC Anti-Patterns — Bulkhead Pattern

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 04-resilience |
| **Knowledge Unit** | Bulkhead Pattern |
| **Generated** | 2026-06-03 |

## Anti-Pattern Inventory

1. Shared Guzzle Client Across All Services (No Connection Pool Isolation)
2. Unbounded Connection Pool (File Descriptor Exhaustion)
3. Shared Queue for All Integrations (Backlog Cross-Contamination)
4. No Per-Service Pool Utilization Monitoring

## Repository-Wide Anti-Patterns

- God Services
- Hidden Configuration

---

## Anti-Pattern 1: Shared Guzzle Client Across All Services (No Connection Pool Isolation)

### Category
Reliability | Performance

### Description
Using a single Guzzle client instance for all external API calls. A latency spike in one service exhausts the shared connection pool, starving all other services.

### Why It Happens
A single `Client` instance in a service container is convenient. Dependency injection makes it available everywhere. Developers add new integrations to the same client.

### Warning Signs
- Single `Client` instance injected across multiple service classes
- Stripe latency spike causes Mailgun calls to fail
- Connection pool exhaustion during partial upstream degradation

### Why It Is Harmful
Stripe's API becomes slow (5s response). The shared connection pool has 25 connections. After 25 concurrent Stripe requests, the pool is exhausted. Mailgun requests are queued waiting for a connection. Email delivery is delayed because Stripe is slow. One service's degradation cascades to all services.

### Preferred Alternative
Create separate Guzzle client (Saloon connector) instances per service.

### Refactoring Strategy
1. Identify each external service integration
2. Create separate Saloon connectors with individual connection pools
3. Configure pool size based on service concurrency needs (2-10)
4. Remove shared client from container

### Related Rules
Use Separate Guzzle Client/Connector Per Service (05-rules.md)

### Related Skills
Implement Bulkhead Pattern for Isolated Resource Pools (06-skills.md)

### Related Decision Trees
Connection Pool Isolation Strategy (07-decision-trees.md)

---

## Anti-Pattern 2: Unbounded Connection Pool (File Descriptor Exhaustion)

### Category
Reliability | Performance

### Description
Not setting `max_handles` on Guzzle's `CurlMultiHandler`. The connection pool is unbounded, risking OS file descriptor exhaustion.

### Why It Happens
Default Guzzle configuration creates a handler with no pool limit. It works fine under normal load.

### Warning Signs
- `EMFILE` errors in production logs
- No `max_handles` configured on `CurlMultiHandler`
- Random "Too many open files" errors under load

### Why It Is Harmful
Under high concurrency, each parallel request opens a new connection. Without pool limits, the number of open connections grows unboundedly. The OS file descriptor limit (typically 1024 per process) is exceeded. The application crashes with `EMFILE`. All HTTP calls fail, including to services that are healthy.

### Preferred Alternative
Set `max_handles` to 5-10 per service pool.

### Refactoring Strategy
1. Configure `CurlMultiHandler::create(['max_handles' => 5])` per connector
2. Tune based on observed concurrency needs
3. Monitor file descriptor usage in production

### Related Rules
Configure Connection Pool Limits Per Service (05-rules.md)

---

## Anti-Pattern 3: Shared Queue for All Integrations (Backlog Cross-Contamination)

### Category
Architecture | Reliability

### Description
Routing all integration processing jobs (Stripe, Mailgun, Slack) to the same queue. A backlog in one integration blocks others.

### Why It Happens
Default queue is used for everything. Adding `->onQueue('integrations')` seems like enough isolation.

### Warning Signs
- All integration jobs on `default` or single `integrations` queue
- Stripe webhook backlog delays Mailgun email processing
- No per-integration queue monitoring

### Why It Is Harmful
Stripe sends a burst of 10,000 webhooks. The shared queue fills with Stripe jobs. Mailgun email jobs are queued behind them. Order confirmation emails are delayed by 10,000 Stripe webhook processing times. Time-sensitive alerts (password resets) are delayed.

### Preferred Alternative
Dedicated queues per integration with separate Horizon worker pools.

### Refactoring Strategy
1. Map each integration to a dedicated queue name
2. Configure Horizon pools per queue
3. Allocate more workers to critical integrations

### Related Rules
Assign Dedicated Queue Workers Per Critical Integration (05-rules.md)

### Related Decision Trees
Queue Isolation Strategy (07-decision-trees.md)

---

## Anti-Pattern 4: No Per-Service Pool Utilization Monitoring

### Category
Observability | Maintainability

### Description
Not tracking connection pool utilization per service. Pool exhaustion surprises in production with no lead data.

### Why It Happens
Pools are configured but not instrumented. Developers don't know when they're near exhaustion.

### Warning Signs
- No metrics on active connections per service pool
- Pool exhaustion discovered only during incidents
- No capacity planning data for pool sizing

### Why It Is Harmful
Pool limits were set at 5 based on an estimate. Actual concurrency grows to 4.8 average. One traffic spike to 6 concurrent requests causes pool exhaustion and request queuing. No metrics show the trend. The first sign of a problem is the outage.

### Preferred Alternative
Track per-service pool utilization, availability, and exhaustion rates.

### Refactoring Strategy
1. Add metrics gauges for active and available connections per pool
2. Alert on pool utilization >80%
3. Use metrics for capacity planning during pool size reviews

### Related Rules
Monitor Per-Service Pool Utilization (05-rules.md)
