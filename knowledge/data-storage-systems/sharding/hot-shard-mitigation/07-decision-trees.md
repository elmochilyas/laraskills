# 6-24 Hot Shard Mitigation - Decision Trees

## Hot Shard Response

---

## Decision Context

Choosing the appropriate mitigation strategy when a hot shard is detected — balancing response speed against disruption: caching, splitting, rebalancing, or moving specific keys.

---

## Decision Criteria

* performance: caching is fastest but only helps reads; splitting distributes both read and write load
* architectural: caching is temporary; splitting/rebalancing are permanent fixes
* maintainability: caching is low-risk; splitting requires data migration

---

## Decision Tree

Hot shard detected (metric > 80% for 10 minutes)

↓

Is the hot shard caused by high READ load?

YES → Read-hot

    ↓
    Caching is first-line mitigation
    
    ↓
    Are the hot keys cacheable (read-frequently, update-infrequently)?
    
    YES → Apply caching
        
        ↓
        Cache::remember("hot_key", 3600, fn() => ...)
        1 hour TTL, invalidate on write
        
        ↓
        Monitor: hit ratio > 90% = cache working
        If hit ratio < 50% → data changes too fast, caching ineffective

NO → Not cacheable or write-hot

    ↓
    Is the hot shard caused by a single key/viral tenant?
    
    YES → Move specific hot keys to dedicated shard
        
        ↓
        Identify the hot key(s) consuming disproportionate resources
        Move them to a dedicated (empty) shard
        Double-write + backfill + cutover
        
        ↓
        Pro: Isolates the hot tenant — doesn't affect others
        Pro: Dedicated shard can be sized for this tenant's needs

NO → General uneven distribution across all keys

    ↓
    Split the hot shard (divide into two)
    
    ↓
    For range-based: split the hot range at median
    For hash-based: redistribute via consistent hashing
    
    ↓
    If split is not sufficient:
    → Full cluster rebalance (all shards)

---

## Recommended Default

**Default:** Cache first for read-hot; move specific keys for viral tenants; split shard for general load
**Reason:** Caching is quick and low-risk. Moving keys isolates the problem. Splitting is the most disruptive but necessary for general imbalance.

---

## Detection and Automation Thresholds

---

## Decision Context

Setting thresholds for automated hot shard detection and response — determining when to alert, when to auto-mitigate, and when to require manual intervention.

---

## Decision Criteria

* performance: too-sensitive thresholds cause unnecessary splits; too-lenient allows degradation
* architectural: automated response reduces MTTR; manual approval prevents incorrect auto-fixes
* maintainability: automation adds complexity but is essential at scale

---

## Decision Tree

Shard utilization level:

↓

< 60% → Normal

    No action needed
    Monitor: continue periodic checks

60-70% → Watch

    Alert: ops team notified (non-urgent)
    Investigate root cause
    Plan mitigation if trend is upward

70-85% → Plan

    Alert: ops team (urgent)
    Evaluate mitigation options:
    - Can caching help? → implement immediately
    - Is this a viral tenant? → prepare dedicated shard
    - Is distribution uneven? → plan split

85-95% → Auto-mitigate

    ↓
    Automated response (if configured):
    
    ↓
    Read-hot? → auto-scale cache TTL, add read replicas
    Write-hot? → schedule split within 1 hour
    Viral tenant? → initiate key move to dedicated shard

> 95% → Emergency

    ↓
    Critical alert — immediate action required
    
    ↓
    If read-hot: route reads to primary (bypass replicas)
    If write-hot: rate-limit writes to the hot shard
    App degraded mode: slower but functional
    
    ↓
    Post-mitigation: analyze root cause, adjust thresholds

---

## Recommended Default

**Default:** Alert at 60%, plan at 70%, evaluate auto-mitigation at 85%, emergency at 95%
**Reason:** Early alerts give time for planned mitigation. Auto-mitigation at 85% prevents emergency. The split itself adds load — need headroom.

---

## Related Rules

* Rule 6-24-1: Always Monitor For Hot Shards
* Rule 6-24-2: Never Ignore Hot Shard Patterns

---

## Related Skills

* Detect and Mitigate Hot Shards
* Implement Caching for Hot Shard Relief
