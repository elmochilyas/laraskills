# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Observability
**Knowledge Unit:** pulse-slow-jobs-recorder
**Generated:** 2026-06-03

---

# Decision Inventory

* Slow Job Threshold Definition
* Pulse Slow Jobs vs Custom Monitoring

---

# Architecture-Level Decision Trees

---

## Slow Job Threshold Definition

---

### Decision Context

Setting the threshold for what constitutes a "slow job" in Pulse monitoring.

---

### Decision Criteria

* Job type baseline execution time
* Latency SLO requirements
* Performance regression detection

---

### Decision Tree

Job has known baseline execution time?
YES → Set threshold at 2x baseline — any job taking twice as long is slow
NO → Job type has latency SLO?
    YES → Set threshold at 80% of SLO — alert before SLO violation
NO → Various job types with different baselines?
    YES → Set multiple recorders with per-job-type thresholds
NO → Default?
    YES → Set threshold at 10 seconds — catches most problematic slow jobs

---

### Rationale

Pulse's slow jobs recorder tracks jobs exceeding a configurable execution time threshold. The threshold should be tight enough to catch performance regressions but loose enough to avoid noise from naturally variable jobs.

---

### Recommended Default

**Default:** Set slow job threshold at 10 seconds or 2x baseline (whichever is lower)
**Reason:** 10 seconds catches most problematic jobs. 2x baseline catches regressions in normally-fast jobs even if they're under 10 seconds.

---

### Risks Of Wrong Choice

- Threshold too tight: excessive alerts for normal execution time variance
- Threshold too loose: slow jobs go unnoticed, performance regressions undetected
- Single threshold for all jobs: slow baseline jobs trigger constant alerts

---

### Related Rules

- monitor-queue-depth-as-leading-indicator

---

### Related Skills

- Configure Pulse Slow Jobs Monitoring
- Monitor Queue Health and Performance
