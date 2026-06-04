# 5-15 Noisy Neighbor Detection - Decision Trees

## Detection Signal Selection

---

## Decision Context

Choosing which resource metrics to monitor for detecting noisy tenants — balancing signal accuracy against monitoring overhead.

---

## Decision Criteria

* performance: per-tenant monitoring adds overhead proportional to tenant count
* architectural: signals must be measurable per tenant in shared infrastructure
* maintainability: automated detection reduces operational load
* security: unexpected usage spikes may indicate compromised tenant

---

## Decision Tree

Which signals to monitor for noisy neighbors?

↓

Shared-table/schema infrastructure?

YES → Monitor: query rate, slow queries, connection count, IOPS

    ↓
    Query rate (QPS per tenant): most direct signal
    Slow query count: indicates bad queries, not just high traffic
    Connection count: tenant leaking connections
    Response time deviation: tenant queries slowing down for everyone
    
    ↓
    Track per-tenant in application logs
    Aggregate by tenant ID in monitoring tool
    Alert: any metric > 3× platform median for 5+ minutes

NO → Database-per-tenant?

    YES → Monitor: database-level metrics per tenant instance
        
        ↓
        CPU utilization, IOPS, storage growth
        Each tenant has own database metrics
        Easier to isolate — dedicated instance = dedicated metrics
        
    NO → All isolation models?
    
        → Monitor: API rate, job queue depth, cache hit rate
        Application-level signals complement DB-level signals

---

## Recommended Default

**Default:** Monitor QPS, slow queries, connection count per tenant on shared infrastructure
**Reason:** These four signals catch the vast majority of noisy neighbor patterns. Adding more signals has diminishing returns.

---

## Mitigation Escalation Path

---

## Decision Context

Determining the appropriate response when a noisy tenant is detected — from soft rate limiting to full isolation escalation.

---

## Decision Criteria

* performance: rate limiting is instant; migration to dedicated resources takes hours
* architectural: escalation path should be automated
* maintainability: rate limiting requires no infrastructure changes
* security: rate limiting prevents DoS from compromised tenant accounts

---

## Decision Tree

Noisy tenant detected — what action?

↓

First offense or mild deviation?

YES → Rate limit at application level

    ↓
    RateLimiter::for('tenant', fn() => Limit::perMinute(1000)->by(tenant()->id))
    Reduce from default (e.g., 2000 → 1000 req/min)
    Log rate limit events for tracking

NO → Repeated offenses or > 5× median?

    YES → Add query timeout + reduce connection limit
        
        ↓
        Kill queries running > 10s per tenant
        Limit tenant to 50% of default connection pool
        Apply database-level resource quotas
        
    NO → Sustained > 10× median for 3+ days?
    
        → Escalate to dedicated resources
        Provision dedicated schema on higher-tier DB
        Migrate tenant during low-usage window
        Notify tenant of automatic upgrade

---

## Recommended Default

**Default:** Rate limiting first → query timeout → dedicated resources
**Reason:** Graduated response minimizes disruption. Rate limiting resolves most cases instantly. Full isolation is a last resort for extreme cases.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Noisy Neighbor Detection
* Implement Per-Tenant Scaling
