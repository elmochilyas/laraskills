# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Graviton Price-Performance
**Generated:** 2026-06-03

---

# Decision Inventory

1. Graviton Migration Decision
2. Graviton Service Coverage
3. Multi-Architecture Build Strategy

---

# Architecture-Level Decision Trees

---

## Decision Name: Graviton Migration Decision

---

## Decision Context

Decide whether to migrate x86 workloads to Graviton/ARM.

---

## Decision Criteria

cost, risk

---

## Decision Tree

New or existing?

NEW -> Use Graviton (20% cheaper, zero effort)
EXISTING -> Evaluate migration

PHP version?
PHP 8.0+ -> Full ARM support; migrate safely
PHP < 8.0 -> Upgrade PHP first

Native x86 dependencies?
None -> Migrate staging first, then production
Some -> Test each on ARM

CI/CD ready?
Produces ARM images -> Ready to migrate
x86 only -> Add multi-arch buildx first

---

## Rationale

Graviton offers 20-34% cost reduction at identical PHP performance. PHP 8.0+ has first-class ARM support. 90%+ of Laravel apps migrate with zero code changes.

---

## Recommended Default

**Default:** Use Graviton for all new deployments; migrate existing with staging validation first

---

## Risks Of Wrong Choice

Not migrating leaves 20-34% savings unclaimed. Migrating without testing native deps causes failures.

---

## Related Rules

Rule: Follow standardized Graviton Price-Performance practices

---

## Related Skills

Analyze and Optimize Graviton Price-Performance

---

---

## Decision Name: Graviton Service Coverage

---

## Decision Context

Identify which AWS services to migrate for maximum savings.

---

## Decision Criteria

cost

---

## Decision Tree

Compute services?

EC2 -> t4g/m7g/r7g/c7g (20% cheaper)
Fargate -> ARM Fargate (20% cheaper)
Lambda -> ARM (34% cheaper duration)

Database services?
RDS -> db.r7g (20% cheaper)
Aurora -> Graviton-compatible instances

Cache services?
ElastiCache -> cache.r7g (20% cheaper)

Migration order?
First -> Compute (EC2/Fargate/Lambda) for immediate savings
Second -> RDS for additional 20%
Third -> ElastiCache for remaining 20%

---

## Rationale

Graviton savings compound across all AWS compute services. Migrating EC2 + RDS + ElastiCache can reduce total infrastructure cost by 20-25%.

---

## Recommended Default

**Default:** Migrate compute first, then database, then cache; target uniform ARM architecture

---

## Risks Of Wrong Choice

Migrating compute but not RDS/ElastiCache misses 20% additional savings on each.

---

## Related Rules

Rule: Follow standardized Graviton Price-Performance practices

---

## Related Skills

Analyze and Optimize Graviton Price-Performance

---

---

## Decision Name: Multi-Architecture Build Strategy

---

## Decision Context

Implement multi-arch Docker builds for safe Graviton migration with rollback.

---

## Decision Criteria

reliability, operational_overhead

---

## Decision Tree

Docker images used?

YES -> Implement multi-arch buildx
NO -> Select ARM instance types in templates

CI/CD capability?
Multi-arch capable -> Add buildx, manifest lists
Limited -> Single-arch ARM with manual x86 fallback

Rollback needed?
Multi-arch images -> Instant by switching instance type
Single-arch -> Need pipeline rebuild

Production cutover?
Gradual (10%-50%-100%) -> Low risk
All-at-once -> Higher risk; have rollback plan

---

## Rationale

Multi-arch Docker images enable deployment to both ARM and x86, providing instant rollback safety.

---

## Recommended Default

**Default:** Multi-arch Docker builds via buildx + gradual traffic shift to Graviton

---

## Risks Of Wrong Choice

Single-arch ARM images without rollback = extended downtime if compatibility issues.

---

## Related Rules

Rule: Follow standardized Graviton Price-Performance practices

---

## Related Skills

Analyze and Optimize Graviton Price-Performance

---

