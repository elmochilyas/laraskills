# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Server Provisioning
**Generated:** 2026-06-03

---

# Decision Inventory

1. EBS Volume Type Selection
2. EBS Volume Right-Sizing
3. Swap Configuration for PHP Workloads

---

# Architecture-Level Decision Trees

---

## Decision Name: EBS Volume Type Selection

---

## Decision Context

Choose between gp3, gp2, io2, and instance store for Laravel server storage.

---

## Decision Criteria

cost, performance

---

## Decision Tree

Workload type?

Web server -> gp3 (3000 IOPS baseline sufficient)
Database server -> gp3 or io2 (if >16000 IOPS needed)
Cache/temp data -> Instance store (ephemeral, high perf)

IOPS requirement?
< 16000 IOPS -> gp3 (same price as gp2, 30x better baseline)
> 16000 IOPS -> io2 (provisioned IOPS, higher cost)

Currently using gp2?
YES -> Migrate to gp3 immediately (free upgrade, higher performance)
NO -> Stay with gp3

---

## Rationale

gp3 provides 3000 IOPS baseline at the same price as gp2's 100 IOPS/GB. For a 30GB volume, gp3 delivers 30x more IOPS at the same price.

---

## Recommended Default

**Default:** gp3 for all volumes; io2 only for high-performance databases needing >16000 IOPS

---

## Risks Of Wrong Choice

Using gp2 instead of gp3 leaves 30x IOPS at same price. Using io2 for web servers adds unnecessary cost.

---

## Related Rules

Rule: Follow standardized Server Provisioning practices

---

## Related Skills

Analyze and Optimize Server Provisioning

---

---

## Decision Name: EBS Volume Right-Sizing

---

## Decision Context

Determine optimal EBS volume size from actual usage data.

---

## Decision Criteria

cost

---

## Decision Tree

Current root volume usage?

< 10GB -> 20GB root volume sufficient
10-20GB -> Right-size during next maintenance
> 20GB -> Investigate what consumes space

Data volume monitored for 30 days?
YES -> Size at P95 usage + 20% headroom
NO -> Start with 30GB, set CloudWatch alarm at 80%

Log volume separate?
YES -> 10-30GB for logs, alarm at 80%
NO -> Split root and data volumes for isolation

---

## Rationale

EBS costs .08/GB/month. 100GB unused costs /year per instance. Across 30 instances, that's ,880/year in completely wasted storage spend.

---

## Recommended Default

**Default:** Root: 20GB gp3; Data: 30GB starting, size based on 30-day monitoring; Logs: 10-30GB gp3

---

## Risks Of Wrong Choice

Over-provisioning every instance by 100GB costs thousands annually without any performance benefit.

---

## Related Rules

Rule: Follow standardized Server Provisioning practices

---

## Related Skills

Analyze and Optimize Server Provisioning

---

---

## Decision Name: Swap Configuration for PHP Workloads

---

## Decision Context

Determine whether and how much swap to configure on Laravel servers.

---

## Decision Criteria

performance, reliability

---

## Decision Tree

Application type?

PHP-FPM web server -> 2GB or 2x RAM (whichever higher)
Octane server -> 2GB minimum
Queue worker -> 2GB minimum
Database server -> Follow DB engine swap guidelines

Available RAM?
< 2GB -> 2x RAM swap (critical for PHP memory safety)
2-4GB -> 2GB swap
> 4GB -> 2GB swap (RAM sufficient for most workloads)

Using instance store?
YES -> Use instance store for swap (faster than EBS)
NO -> Use EBS swap partition or swap file

---

## Rationale

PHP memory leaks can OOM servers without swap. Swap provides buffer for graceful degradation instead of immediate OOM kills dropping all active requests.

---

## Recommended Default

**Default:** 2GB swap on all application servers; instance store if available; monitor swap usage for memory leak detection

---

## Risks Of Wrong Choice

No swap = OOM killer terminates PHP processes under memory pressure, causing 50x errors.

---

## Related Rules

Rule: Follow standardized Server Provisioning practices

---

## Related Skills

Analyze and Optimize Server Provisioning

---

