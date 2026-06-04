# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** PHP Engine Performance
**Knowledge Unit:** Memory-Resident Architecture
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Whether to migrate from FPM to memory-resident | Architecture | Evaluate |
| 2 | Which memory-resident runtime to select | Technology | Architect |

---

# Architecture-Level Decision Trees

---

## Decision: Migrate from FPM to Memory-Resident

---

## Decision Context

Choosing between staying on PHP-FPM's shared-nothing model or migrating to a memory-resident architecture (Octane, Swoole, RoadRunner, FrankenPHP).

---

## Decision Criteria

* **performance** — 3-15x throughput gain for bootstrap-dominated workloads
* **architectural** — requires code audit for static properties and singletons
* **security** — state persistence across requests can leak user data
* **maintainability** — adds operational complexity and deployment differences

---

## Decision Tree

What is framework bootstrap as percentage of total request time?
↓
**<20%** → Stay on FPM; gain from migration is minimal
**20-50%** → Moderate gain (2-5x); proceed with evaluation
**>50%** → Significant gain (3-15x); strong candidate

---

Has the team audited all static properties and singletons?
↓
**YES** → Migration is feasible
**NO** → Audit first — state leaks are the #1 risk

---

Does the application use packages that rely on per-request state?
↓
**NO** → Safe to proceed
**YES** → Test each package individually; some may break

---

Is per-request process isolation a regulatory requirement?
↓
**YES** → Must stay on FPM
**NO** → Memory-resident is viable

---

## Rationale

Memory-resident architectures eliminate per-request bootstrap overhead — the dominant cost for fast API endpoints. The gain is proportional to bootstrap proportion. State management is the primary operational risk.

---

## Recommended Default

**Default:** Stay on FPM unless bootstrap >20% of request time and team has capacity for state audit.
**Reason:** FPM is simpler, universal, and safer; migration is only justified when bootstrap domination is confirmed.

---

## Risks Of Wrong Choice

* Migrating without profiling: disappointing results, wasted effort
* Migrating without state audit: user data leakage between requests
* Migrating for slow endpoints: minimal gain with added complexity

---

## Related Rules

* Profile Bootstrap Cost Before Migrating
* Audit All Static Properties and Singletons Before Migration
* Configure Worker Recycling with max_requests

---

## Related Skills

* Migrate from PHP-FPM to a Memory-Resident Architecture

---

---

## Decision: Which Memory-Resident Runtime to Select

---

## Decision Context

Choosing between Laravel Octane (RoadRunner, FrankenPHP, Swoole) based on workload profile and operational constraints.

---

## Decision Criteria

* **performance** — matches workload I/O profile
* **architectural** — extension requirements (ZTS, PHP extensions)
* **maintainability** — team expertise and operational simplicity

---

## Decision Tree

Is this a Laravel application?
↓
**YES** → Use Octane as migration path; RoadRunner is default
**NO** → Evaluate standalone runtimes based on workload

---

What is the I/O profile (average database/API latency)?
↓
**<10ms queries** → RoadRunner (goroutine scheduler) or FrankenPHP (simplicity)
**>50ms queries (high-latency I/O)** → Swoole (coroutine auto-hooking)
**Mixed** → RoadRunner (best all-around)

---

What is the priority: operational simplicity or max throughput?
↓
**Simplicity** → FrankenPHP (single binary, HTTP/3, auto HTTPS)
**Max throughput** → RoadRunner (efficient goroutine scheduler)

---

Does the team want to avoid PHP extension compilation?
↓
**YES** → RoadRunner or FrankenPHP (no extension needed)
**NO** → Swoole also viable (requires swoole extension)

---

## Rationale

Each runtime has strengths. RoadRunner is the best all-around option for Laravel Octane. Swoole excels with high-latency I/O. FrankenPHP simplifies containerization with a single binary.

---

## Recommended Default

**Default:** RoadRunner for Laravel Octane; FrankenPHP for container simplicity.
**Reason:** RoadRunner has best-documented Octane integration; FrankenPHP simplifies deployment.

---

## Risks Of Wrong Choice

* Swoole for low-latency I/O: overhead > benefit, slower than FPM
* FrankenPHP without ZTS: segfaults under concurrent load
* Wrong runtime: significant migration cost to switch later

---

## Related Rules

* Profile Bootstrap Cost Before Migrating
* Run 24-Hour Soak Tests Before Production

---

## Related Skills

* Migrate from PHP-FPM to a Memory-Resident Architecture
* Select the Appropriate Concurrency Model for a PHP Workload
