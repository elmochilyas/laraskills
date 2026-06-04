# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** Preloading Reduces Cold-Start Latency
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Whether to enable preloading | Performance | Evaluate |
| 2 | Which classes to preload | Configuration | Implement |

---

# Architecture-Level Decision Trees

---

## Decision: Whether to Enable Preloading

---

## Decision Context

Preloading compiles framework classes at startup, eliminating first-request autoloading. Tradeoff: faster first request vs slower startup and higher baseline memory.

---

## Decision Criteria

* **performance** — saves 10-16ms per request on autoloading
* **architectural** — preloaded classes consume OpCache memory permanently
* **maintainability** — preloading script changes require PHP-FPM restart

---

## Decision Tree

What is the average request latency?
↓
**<50ms (fast API)** → Preloading provides 5-15x benefit; strong candidate
**50-500ms** → Moderate benefit; measure bootstrap proportion first
**>500ms (slow)** → Minimal benefit (<10%); fix I/O bottlenecks first

---

What is bootstrap time as percentage of request time?
↓
**<20%** → Preloading benefit is minimal; focus elsewhere
**20-50%** → Preloading provides meaningful improvement
**>50%** → Consider Octane/memory-resident instead of preloading alone

---

Is this a containerized environment?
↓
**YES** → Preloading is more favorable (startup cost paid once per container)
**NO** → Standard evaluation applies

---

How often does PHP-FPM restart?
↓
**Frequently (>1/hour)** → Preloading overhead incurred often; benefit-diminished
**Rarely (per deploy)** → Preloading benefit fully realized

---

## Rationale

Preloading eliminates autoloading overhead for fast requests. For slow requests (>500ms), the 10-16ms savings is negligible. The memory cost is permanent — only preload frequently-used framework classes.

---

## Recommended Default

**Default:** Preload core framework classes for applications with <100ms average response time.
**Reason:** Fast APIs benefit most; memory cost is justified for significant latency reduction.

---

## Risks Of Wrong Choice

* Preloading for slow apps: wasted memory, no noticeable improvement
* Preloading rarely-used classes: wastes OpCache memory
* Not restarting PHP-FPM after preloading changes: mixed old/new class definitions

---

## Related Rules

* Preload Core Framework Classes Only
* Measure Benefit Before Committing
* Restart PHP-FPM for Preloading Changes

---

## Related Skills

* Preloading Reduces Cold-Start Latency
