# 7-9 Load Balancing Replicas - Decision Trees

## Random vs Round-Robin vs Weighted Balancing

---

## Decision Context

Choosing the replica load balancing strategy — Laravel's default random, round-robin, or weighted — based on replica sizing and workload characteristics.

---

## Decision Criteria

* performance: random can skew; round-robin is uniform; weighted accommodates heterogenous replicas
* architectural: Laravel default is random; round-robin and weighted need custom connector or proxy
* maintainability: random is zero setup; proxy adds complexity

---

## Decision Tree

All replicas are identical (same CPU, memory, IOPS)?

YES → Use round-robin or Laravel random

    ↓
    Round-robin: uniform distribution, predictable
    Laravel random: built-in, zero setup, slight skew
    
    ↓
    Round-robin preferred for:
    - Equal-sized replicas
    - Predictable per-replica load

NO → Replicas have different sizes (heterogeneous)?

    YES → Weighted balancing (via ProxySQL or custom connector)
        
        ↓
        Example: one 2xlarge (weight=100), two xlarge (weight=50 each)
        
        ↓
        Traffic distribution: 50% to 2xlarge, 25% per xlarge
        Matches capacity proportionally
        
        ↓
        Implementation options:
        - ProxySQL: mysql_servers weight column
        - Custom Laravel DB connector

NO → Query response times vary significantly?

    → Least-connections routing
    Routes to replica with fewest active queries
    Best for variable query costs
    Requires ProxySQL or custom implementation

---

## Recommended Default

**Default:** Round-robin for equal replicas; weighted for heterogenous; least-connections for variable query costs
**Reason:** Match the balancing strategy to replica capacity. Random is acceptable for very small deployments but round-robin or weighted provides better control.

---

## Health Check Configuration

---

## Decision Context

Configuring health checks to automatically remove failed replicas from the load balancing pool.

---

## Decision Criteria

* performance: health check adds load to replicas (check interval matters)
* architectural: failed replicas must be removed from rotation immediately
* maintainability: frequency and timeout must balance between fast detection and low overhead

---

## Decision Tree

Replica health check interval?

↓

User-facing traffic (consistency-critical)?

YES → Check every 1-2 seconds

    ↓
    Fast detection: replica failure detected < 2s
    Auto-remove from rotation
    
    ↓
    ProxySQL: `mysql_servers.max_connections = 0` on failure
    Redis: health check via setnx with TTL

NO → Analytics/batch replicas (not user-facing)?

    YES → Check every 10-30 seconds
        
        ↓
    Slower detection acceptable for non-critical workloads
    
    ↓
    Less monitoring overhead
    Redundant replicas mean brief outage is tolerable

NO → Single replica?

    → Check every 5 seconds
    No failover available — check serves awareness only
    Alert on failure, no replica to redirect to

---

## Recommended Default

**Default:** 2-second health check for user-facing replicas; 30-second for analytics
**Reason:** User-facing needs fast failover. Analytics can tolerate brief interruptions. Health check frequency should match the criticality of the workload.

---

## Related Rules

* Rule 7-9-1: Always Match Balancer Strategy to Replica Capacity
* Rule 7-9-2: Always Health-Check Replicas Before Routing

---

## Related Skills

* Configure Replica Load Balancing Strategy
* Implement Weighted Replica Routing with ProxySQL
