# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** PHP Engine Performance
**Knowledge Unit:** Profiling vs Monitoring
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Profiling vs monitoring for a performance question | Diagnosis | Diagnose |
| 2 | Which profiling tool to use in production | Tool Selection | Observe |

---

# Architecture-Level Decision Trees

---

## Decision: Profiling vs Monitoring Approach

---

## Decision Context

Performance questions require either monitoring (ongoing health tracking) or profiling (deep dive investigation). Using the wrong approach wastes time or misses critical data.

---

## Decision Criteria

* **performance** — profiling overhead varies by tool (1-200%)
* **architectural** — Xdebug cannot be used in production
* **security** — profiling data reveals internal code paths
* **maintainability** — monitoring requires less expertise to interpret

---

## Decision Tree

What is the question being asked?
↓
**"Is the system healthy?"** → Monitoring (latency, error rate, CPU, memory dashboards)
**"Why is it slow?"** → Profiling (call graph, flame graph, function-level timing)
**"Has it changed from last week?"** → Monitoring (trend comparison)
**"What is the bottleneck?"** → Profiling (root cause analysis)

---

Is the issue actively occurring in production?
↓
**YES** → Use triggered profiling (Blackfire header, SPX cookie) — <5% overhead
**NO** → Profile in staging with production-representative traffic

---

Do you need continuous insight or one-time diagnosis?
↓
**Continuous (always-on observability)** → Monitoring + sampled profiling (1% of traffic)
**One-time diagnosis** → Triggered profiling on specific endpoint

---

## Rationale

Monitoring tells you WHAT is slow (symptoms). Profiling tells you WHY (root cause). Both are essential and serve different purposes. Monitoring should always be in place; profiling is used when monitoring detects a problem.

---

## Recommended Default

**Default:** Maintain monitoring always-on; use triggered profiling for investigations triggered by alerts.
**Reason:** Monitoring without profiling leaves you unable to fix problems. Profiling without monitoring leaves you unaware of problems.

---

## Risks Of Wrong Choice

* Only monitoring: know something is slow but not why
* Only profiling: expensive to run always-on, misses regressions between sessions
* Xdebug in production: 50-200% overhead, performance collapse

---

## Related Rules

* Never Use Xdebug Profiling in Production
* Profile First, Then Monitor — Never Guess at Bottlenecks
* Always Pair Monitoring Alerts with Profiling Capability

---

## Related Skills

* Distinguish Between Profiling and Monitoring for Performance Analysis

---

---

## Decision: Which Profiling Tool to Use in Production

---

## Decision Context

Selecting a profiling tool for production use based on overhead, features, and deployment constraints.

---

## Decision Criteria

* **performance** — overhead budget: <5% for production
* **architectural** — extension installation requirements
* **security** — data sensitivity of profiling output
* **maintainability** — setup complexity and learning curve

---

## Decision Tree

Is this production or development/staging?
↓
**Production** → Use sampling profiler (<5% overhead): Blackfire, Tideways, SPX, or eBPF
**Development/Staging** → Xdebug acceptable (50-200% overhead)

---

What is the acceptable overhead budget?
↓
**<1%** → eBPF (kernel-level, <1% overhead, requires CAP_BPF)
**<3%** → Tideways (1-3%, sampled, continuous monitoring)
**<5%** → Blackfire (2-5%) or SPX (<5%, on-demand triggered)

---

Is this for continuous monitoring or on-demand profiling?
↓
**Continuous** → Tideways or eBPF (always-on sampling, low overhead)
**On-demand** → Blackfire or SPX (triggered via header/cookie)

---

Does the profiling need to capture memory allocation data?
↓
**YES** → Blackfire or Xdebug (development only)
**NO** → Any sampling profiler works

---

## Rationale

Profiling overhead varies from <1% (eBPF) to 200% (Xdebug). Production profiling must use sampling or triggered mode with <5% overhead. Development allows heavy instrumentation.

---

## Recommended Default

**Default:** Blackfire for on-demand production profiling; Tideways for continuous sampled profiling.
**Reason:** Both have <5% overhead and are production-safe. Blackfire excels at triggered deep dives; Tideways excels at continuous monitoring.

---

## Risks Of Wrong Choice

* Xdebug in production: 50-200% overhead, potential outage
* Always-on heavy profiler: unnecessary overhead for low-traffic periods
* No production profiling capability: cannot diagnose production issues

---

## Related Rules

* Never Use Xdebug Profiling in Production
* Restrict Profiling Data Access to Authorized Personnel

---

## Related Skills

* Distinguish Between Profiling and Monitoring for Performance Analysis
