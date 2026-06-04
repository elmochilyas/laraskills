# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 07-observability
**Knowledge Unit:** integration-health-checks
**Generated:** 2026-06-03

---

# Decision Inventory

1. Health Check Scope (Ping vs Comprehensive vs Synthetic)
2. Check Execution Strategy (Sync vs Async, Caching)
3. Alerting and Escalation Strategy

---

# Architecture-Level Decision Trees

---

## Health Check Scope

---

## Decision Context

Determining the depth of health checking for each integration.

---

## Decision Criteria

* service criticality
* upstream API cost/complexity
* operational maturity
* monitoring budget

---

## Decision Tree

Is the integration business-critical (payments, auth, core data)?
↓
YES → Implement multi-layer health checks (connectivity + auth + data freshness)
  ↓
  Does the integration have SLA requirements?
  ↓
  YES → Add synthetic transaction check (create+delete test resource)
    ↓
    Synthetic transaction every 5 minutes?
    ↓
    YES → Full confidence in integration health (costs API resources)
    NO → Reduce to every 15 minutes with connectivity check between
  NO → Connectivity + auth check only (no synthetic transactions)
NO → Implement basic ping check only
  ↓
  Is the integration read-only (no side effects)?
  ↓
  YES → Simple GET to a lightweight endpoint (e.g., GET /v1/charges?limit=1)
  NO → Use status endpoint if available; otherwise skip health checks
↓
  Multi-region deployment?
  ↓
  YES → Run health checks from each region; aggregate for dashboard
  NO → Single-region health check sufficient
↓
  Degraded but functional state detectable?
  ↓
  YES → Report degraded status (e.g., slow response but working, circuit breaker half-open)
  NO → Binary healthy/unhealthy only

---

## Rationale

Multi-layer checks catch different failure modes: DNS/network issues (connectivity), expired credentials (auth), stale data (freshness), and silent failures (synthetic). Graduated checks minimize upstream API load while maintaining confidence.

---

## Recommended Default

**Default:** Connectivity + auth check every 60s for all critical services; synthetic transaction every 5min for SLA-bound services
**Reason:** Catches most failure modes without excessive upstream API load

---

## Risks Of Wrong Choice

Ping-only misses expired auth tokens and stale data. Synthetic transactions on every check increase API costs. No data freshness check allows silent data sync failures.

---

## Related Rules/Skills

* ku-aie-005: Package Landscape (Pulse cards for health dashboard)
* 04-resilience: circuit-breaker (correlating circuit breaker state with health)

---

---

## Check Execution Strategy

---

## Decision Context

Determining how health checks are executed to balance freshness with performance.

---

## Decision Criteria

* check frequency
* upstream API rate limits
* dashboard load
* cost optimization

---

## Decision Tree

Will the health endpoint be polled frequently (dashboard, load balancer)?
↓
YES → Cache health check results (recommended TTL: 30-60s)
  ↓
  Multiple consumers requesting health simultaneously?
  ↓
  YES → Cache with stampede protection (Cache::lock + stale-on-error)
  NO → Simple Cache::remember with TTL expiry
  ↓
  Upstream API rate limit concern?
  ↓
  YES → Stagger check schedules across services (not all at :00)
  NO → Check all services simultaneously on schedule
NO → Execute checks on-demand without caching (poll less frequently)
  ↓
  Check execution: sync vs async?
  ↓
  Sync → Simple, but health endpoint response time = slowest check
  Async → Queue check jobs, health endpoint reads cached results
↓
  Which pattern for async?
  ↓
  Dispatch all check jobs simultaneously → Wait for all via Bus::chain
  Check individually → Longer aggregate time, simpler failure isolation
  ↓
  Single health endpoint returning all services?
  ↓
  YES → Return aggregate status (healthy/degraded/unhealthy) per service
  NO → Separate `/health/{service}` per endpoint; aggregated via load balancer

---

## Rationale

Caching prevents thundering herd on both dashboard and upstream API. Async execution keeps the health endpoint responsive. Stale-on-error ensures the dashboard shows status even when one check fails.

---

## Recommended Default

**Default:** Cache 60s with stale-on-error; async check execution via queue; aggregate `/health` endpoint
**Reason:** Dashboard loads instantly, upstream API gets at most 1 req/min/service, stale data shown when check fails

---

## Risks Of Wrong Choice

No caching causes dashboard load to hammer upstream APIs. Sync execution blocks health endpoint response. Long TTL masks integration failures between check intervals.

---

## Related Rules/Skills

* ku-aie-005: Package Landscape (Laravel Pulse caching patterns)
* 04-resilience: degraded-mode (graceful degradation during health check failure)

---

---

## Alerting and Escalation Strategy

---

## Decision Context

Configuring alert thresholds and escalation policies for health check failures.

---

## Decision Criteria

* transient failure tolerance
* recovery time objectives
* team size
* service criticality

---

## Decision Tree

Has the integration been stable (no failures in 7 days)?
↓
YES → Configure consecutive failure threshold (e.g., 3 consecutive failures before alert)
  ↓
  Critical payment/auth integration?
  ↓
  YES → Alert on 2 consecutive failures (transient fails happen, but act fast)
  NO → Alert on 5 consecutive failures (higher tolerance for transient blips)
NO → Higher threshold during stabilization period (e.g., 10 consecutive failures)
  ↓
  Track consecutive success for recovery notification?
  ↓
  YES → Auto-resolve when 3 consecutive checks pass after failure
  NO → Manual resolution only (risk of lingering acknowledged alerts)
↓
  Escalation tiers?
  ↓
  Tier 1 (0-5 min) → Slack/Teams notification to integration team
  Tier 2 (5-15 min) → Pager duty / SMS to on-call engineer
  Tier 3 (15+ min) → Engineering manager notification + incident declared
↓
  Time-of-day escalation adjustment?
  ↓
  YES → Business hours: message channel; after-hours: page immediately
  NO → Same escalation regardless of time (consistent but more pages)

---

## Rationale

Consecutive failure thresholds filter transient network blips from genuine failures. Multi-tier escalation ensures appropriate urgency. Auto-resolve reduces alert fatigue from manual acknowledgment.

---

## Recommended Default

**Default:** 3 consecutive failures → Slack alert; 5 consecutive → Pager duty; auto-resolve on 3 consecutive successes
**Reason:** Filters most transient failures while catching genuine issues within 3-5 minutes

---

## Risks Of Wrong Choice

Single-failure alerts cause noise from transient blips. Too-high threshold delays detection of real failures. No auto-resolve requires manual cleanup of resolved issues.

---

## Related Rules/Skills

* ku-aie-005: Package Landscape (Pulse card alerting)
* 07-observability: integration-metrics (correlating metrics with health check state)
