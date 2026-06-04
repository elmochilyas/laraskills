# ECC Anti-Patterns — Rate Limit Avoidance

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 01-foundations |
| **Knowledge Unit** | Rate Limit Avoidance |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Global Rate Limiter Shared Across All Services
2. No Safety Margin (Limits at 100% of Upstream Capacity)
3. Proactive-Only Limiting Without Reactive 429 Handling
4. In-Memory Rate Limit State in Multi-Worker Deployments
5. No Rate Limit Headroom Monitoring

---

## Repository-Wide Anti-Patterns

- Shared Mutable State
- Premature Optimization

---

## Anti-Pattern 1: Global Rate Limiter Shared Across All Services

### Category
Architecture | Reliability

### Description
Using a single rate limiter instance for all upstream API services. Different APIs with different limits interfere with each other.

### Why It Happens
One limiter is simpler to configure. Developers don't consider that APIs have independent limits.

### Warning Signs
- Single rate limiter instance injected into all service classes
- One service's traffic affects another's rate limit availability
- Rate limit configuration can't be tuned per service

### Why It Is Harmful
A high-volume service (e.g., Stripe) consumes all tokens, starving a low-volume service (e.g., Mailgun). Or a low-limit service (e.g., GitHub API, 60/hr) blocks a high-limit service (e.g., internal API, 10000/hr).

### Real-World Consequences
Stripe processes 1000 requests/minute, exhausting the shared rate limiter tokens. Mailgun, which has its own separate upstream limit, can't send emails because the shared limiter is empty. Emails are delayed for 2 hours.

### Preferred Alternative
Create separate rate limiter instances per upstream service, each configured with that service's specific limits.

### Refactoring Strategy
1. Identify all distinct upstream services with rate limits
2. Create a per-service rate limiter factory
3. Configure each limiter with the service's specific limits
4. Inject the correct limiter into each service class
5. Remove the shared global limiter

### Detection Checklist
- [ ] Single rate limiter shared across services
- [ ] One service's traffic affects another's rate limits
- [ ] Per-service limit configuration not possible

### Related Rules
Use Per-Service Rate Limiters, Not Global (05-rules.md)

### Related Skills
Avoid External API Rate Limits with Proactive Throttling (06-skills.md)

### Related Decision Trees
Rate Limiting Algorithm Selection (07-decision-trees.md)

---

## Anti-Pattern 2: No Safety Margin (Limits at 100% of Upstream Capacity)

### Category
Reliability | Performance

### Description
Configuring local rate limiters to match the documented upstream limit exactly (e.g., 100 req/min for a 100 req/min limit). No headroom for traffic spikes.

### Why It Happens
Developers set the limit to the advertised value for mathematical correctness, not realizing traffic variability requires headroom.

### Warning Signs
- Limiter configured at exactly the documented upstream limit
- Frequent 429 errors at traffic peaks but never at low traffic
- Error spikes during deployment or cache refresh events

### Why It Is Harmful
Traffic variability (bursts, retries, cache misses) pushes local requests beyond the local limit, causing 429 errors. Retries amplify load, making the upstream situation worse.

### Real-World Consequences
Stripe has a 100 req/s limit. The limiter is configured at 100. A cache refresh event causes 110 concurrent requests. 10 get 429. Retries cause 10 more requests. 10 more 429s. Effective throughput drops below 100.

### Preferred Alternative
Set local limit to 80% of the upstream documented limit to provide headroom.

### Refactoring Strategy
1. Document upstream rate limits per service
2. Configure local limiters at `(int)(upstream_limit * 0.8)`
3. Monitor 429 rate; if >1%, reduce limit further
4. If headroom is consistently unused, increase limit gradually

### Detection Checklist
- [ ] Local limiter matches upstream limit exactly
- [ ] 429 errors during traffic peaks
- [ ] No headroom buffer configured

### Related Rules
Set Local Safety Margin at 80% of Upstream Limit (05-rules.md)

### Related Skills
Avoid External API Rates with Proactive Throttling (06-skills.md)

### Related Decision Trees
Rate Limiting Algorithm Selection (07-decision-trees.md)

---

## Anti-Pattern 3: Proactive-Only Limiting Without Reactive 429 Handling

### Category
Reliability

### Description
Relying solely on proactive rate limiting (pre-request check) without handling 429 responses reactively. Local counters drift from upstream state.

### Why It Happens
Proactive limiting seems sufficient. Developers assume their local limiter perfectly tracks upstream state.

### Warning Signs
- No Retry-After header parsing
- No 429 response handling in HTTP middleware
- Only pre-request rate limit checks exist

### Why It Is Harmful
Local rate limit counters drift from upstream actual state due to clock skew, request retries, shared infrastructure, or upstream limit changes. When drift occurs, proactive limiting fails silently and 429s are not handled, causing request failures.

### Real-World Consequences
Local counter shows 80 requests used (limit 100). Upstream has actually processed 105 due to a burst from another service. The 81st request gets 429. No Retry-After handling exists. The request fails immediately instead of backing off.

### Preferred Alternative
Implement both proactive limiting (pre-request) and reactive handling (parse Retry-After on 429).

### Refactoring Strategy
1. Add 429 detection to HTTP middleware or service class
2. Parse `Retry-After` header on 429 responses
3. Sync local rate limiter state from upstream response headers
4. Implement backoff that respects Retry-After
5. Log 429 occurrences for monitoring

### Detection Checklist
- [ ] No 429 response handling
- [ ] No Retry-After header parsing
- [ ] Only pre-request rate limit checks exist
- [ ] Silent drift between local and upstream state

### Related Rules
Combine Proactive Limiting with Reactive 429 Handling (05-rules.md)

### Related Skills
Avoid External API Rate Limits with Proactive Throttling (06-skills.md)

### Related Decision Trees
429 Handling Strategy (07-decision-trees.md)

---

## Anti-Pattern 4: In-Memory Rate Limit State in Multi-Worker Deployments

### Category
Scalability | Reliability

### Description
Using in-memory rate limiters (e.g., `TokenBucketLimiter` without Redis) when multiple workers or servers process requests. Each worker independently believes it has capacity.

### Why It Happens
Development and single-server testing use in-memory limiters. The deployment grows to multiple workers but the rate limiter implementation is not updated.

### Warning Signs
- Rate limiter instantiated without Redis/store dependency
- 429 rate from upstream is N × worker count times expected
- Each worker shows different remaining capacity

### Why It Is Harmful
N workers each send requests up to their local limit. The upstream sees N × limit traffic. For 10 workers with a 100 req/min limit, the upstream gets 1000 req/min. 900 requests/min get 429.

### Real-World Consequences
10 queue workers each think they can send 100 requests/minute to Stripe. Stripe receives 1000 req/min. 900 requests get 429. Effective throughput is 100 req/min — the same as a single worker. All workers waste resources on retries.

### Preferred Alternative
Use Redis-backed rate limiters for distributed state across all workers.

### Refactoring Strategy
1. Replace in-memory limiters with Redis-backed implementations
2. Use Saloon's Redis rate limit plugin if using Saloon
3. Ensure limit key includes service identifier
4. Configure Redis connection for rate limit operations
5. Remove in-memory limiter fallback

### Detection Checklist
- [ ] Rate limiter without Redis dependency
- [ ] 429 rate exceeds expected by worker count multiplier
- [ ] Workers show different remaining capacity

### Related Rules
Use Redis for Distributed Rate Limit State (05-rules.md)

### Related Skills
Avoid External API Rate Limits with Proactive Throttling (06-skills.md)

### Related Decision Trees
Rate Limit Store Selection (07-decision-trees.md)

---

## Anti-Pattern 5: No Rate Limit Headroom Monitoring

### Category
Observability | Reliability

### Description
Only monitoring rate limit errors (429) and not tracking remaining capacity (`X-RateLimit-Remaining`). No early warning before limits are exhausted.

### Why It Happens
429 errors are visible in application monitoring. Remaining capacity tracking seems like unnecessary granularity.

### Warning Signs
- No monitoring of `X-RateLimit-Remaining` headers
- First notification of rate limit issues is a 429 error
- No headroom dashboard or alert

### Why It Is Harmful
The first sign of rate limit problems is a service degradation (429 errors). There is no time to request limit increases, reduce request volume, or implement caching before the limit is hit.

### Real-World Consequences
Traffic spikes from a marketing campaign push Stripe requests to 95% of the limit. No headroom alert fires. When traffic increases another 10%, the limit is exceeded. All payment requests fail for 15 minutes. $500,000 in lost revenue.

### Preferred Alternative
Track `X-RateLimit-Remaining` on every response. Alert when headroom drops below 20%.

### Refactoring Strategy
1. Parse `X-RateLimit-Remaining` from all API responses
2. Log remaining capacity with each API call
3. Create a dashboard showing headroom per service
4. Set alerts when headroom drops below 20% of limit
5. Use historical data for capacity planning

### Detection Checklist
- [ ] No tracking of remaining rate limit capacity
- [ ] First notification is a 429 error
- [ ] No headroom dashboard or alert

### Related Rules
Monitor Rate Limit Headroom (05-rules.md)

### Related Skills
Avoid External API Rate Limits with Proactive Throttling (06-skills.md)

### Related Decision Trees
429 Handling Strategy (07-decision-trees.md)
