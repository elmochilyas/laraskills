# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** K001 — Queue Connections vs. Queues Distinction
**Generated:** 2026-06-03

---

# Decision Inventory

* Single Connection vs Multiple Connections
* Queue Naming Strategy: Workload vs Job Class
* Worker Queue Subscription Priority Strategy

---

# Architecture-Level Decision Trees

---

## Single Connection vs Multiple Connections

---

### Decision Context

Whether to use a single queue connection for all queues or create separate connections for different workloads. This choice impacts infrastructure complexity, resource isolation, and failure domain boundaries.

---

### Decision Criteria

* Infrastructure cost and operational overhead
* Isolation requirements between workloads
* Driver type requirements per workload
* Environment separation needs

---

### Decision Tree

Same driver for all queues?
YES → Same Redis instance for cache and queues?
    YES → Separate connections (Redis instance per use case)
    NO → Single connection sufficient?
        YES → One connection, multiple queue names
        NO → Separate connections
NO → Different drivers needed (Redis + SQS)?
    YES → One connection per driver type
    NO → Same driver, different Redis instances?
        YES → One connection per instance
        NO → One connection

---

### Rationale

A single Redis connection can host dozens of named queue lists. Creating separate connections per queue name multiplies infrastructure without benefit. Separate connections are only needed when using different drivers (Redis vs SQS), isolating queue Redis from cache Redis, or separating environments (dev vs production).

---

### Recommended Default

**Default:** One connection per driver type with multiple named queues
**Reason:** Minimizes infrastructure complexity while supporting workload separation via queue names. Add connections only when driver type or isolation requirements demand it.

---

### Risks Of Wrong Choice

- Multiple connections per queue: unnecessary Redis instances, doubled costs, config complexity
- Single connection for cache+queue: cache eviction (allkeys-lru) deletes queue keys silently
- Shared dev/prod connection: cross-contamination of jobs

---

### Related Rules

- define-topology-before-deploying
- no-separate-connections-per-queue
- separate-queue-redis-from-cache

---

### Related Skills

- Design Queue Topology with Connections and Queues
- Select and Configure the Right Queue Driver

---

## Queue Naming Strategy: Workload vs Job Class

---

### Decision Context

How to name queues within a connection. The naming convention determines operational clarity, worker configuration flexibility, and long-term maintainability.

---

### Decision Criteria

* Operational clarity for monitoring and alerting
* Worker configuration flexibility per workload type
* Scalability as job types proliferate
* Team understanding and consistency

---

### Decision Tree

Job types share similar workload characteristics (latency, resource intensity)?
YES → Name by workload characteristic
    Example queues: critical, default, bulk, media, webhooks
NO → Very few job types (<5)?
    YES → Job class naming may be acceptable
    NO → Refactor by workload characteristic

---

### Rationale

Queue names describe processing requirements. Multiple job classes with similar latency profiles should share the same queue — this allows unified worker configuration, monitoring, and scaling. Job-class-per-queue creates operational overhead as the application grows.

---

### Recommended Default

**Default:** Name queues by workload characteristic (critical, default, bulk)
**Reason:** Supports unified worker configuration per latency tier, scales cleanly as job types grow, and aligns with monitoring/alerting practices.

---

### Risks Of Wrong Choice

- Job-class naming: proliferation of single-job-type queues with identical requirements
- Worker configuration explosion — each queue needs separate worker config
- Harder to tune concurrency per workload type

---

### Related Rules

- name-queues-by-workload-characteristic
- define-topology-before-deploying

---

### Related Skills

- Design Queue Topology with Connections and Queues
- Configure Queue Priority via Multiple Queue Names

---

## Worker Queue Subscription Priority Strategy

---

### Decision Context

How to configure worker queue subscription order for priority processing. Workers subscribe to multiple queues with priority ordering via `--queue=`.

---

### Decision Criteria

* User-facing latency requirements per job type
* Worker pool allocation per priority tier
* SQS vs Redis queue driver limitations
* Number of priority tiers needed

---

### Decision Tree

Using Redis?
YES → 2-3 priority tiers needed?
    YES → Use comma-separated subscription: --queue=critical,default,bulk
    NO → Single queue sufficient
NO → Using SQS?
    YES → Separate SQS queue URLs + separate workers per tier
NO → Using Redis Cluster?
    YES → Separate supervisors per tier (BRPOP cluster limitations)

---

### Rationale

Laravel implements priority through worker subscription order, not backend features. Redis handles multiple queues per connection cleanly. SQS requires separate URLs — comma-separated `--queue=` only uses the first. More than 3 tiers adds operational complexity with diminishing returns.

---

### Recommended Default

**Default:** 3 priority tiers (critical, default, bulk) with dedicated Horizon supervisors per tier
**Reason:** Balances operational complexity with workload isolation. Separate supervisors prevent high-priority job floods from starving low-priority processing.

---

### Risks Of Wrong Choice

- SQS with comma-separated `--queue=`: only first queue is processed
- Shared workers across tiers: CPU-heavy jobs block latency-sensitive ones
- Too many tiers (>3): operational complexity exceeds benefit

---

### Related Rules

- name-queues-by-workload-characteristic
- define-topology-before-deploying

---

### Related Skills

- Configure Queue Priority via Multiple Queue Names
- Design Queue Topology with Connections and Queues
