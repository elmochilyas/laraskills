# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Profiling and Observability
**Knowledge Unit:** eBPF PHP Profiling
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | eBPF profiling adoption | Operations | Evaluate |

---

# Architecture-Level Decision Trees

---

## Decision: eBPF Profiling

---

## Decision Context

eBPF (extended Berkeley Packet Filter) profiles kernel and user-space stack traces with near-zero overhead. Tools like Pixie, Parca, BCC profile PHP without instrumentation.

---

## Decision Criteria

* **performance** — near-zero overhead (sampling-based)
* **operations** — requires Linux 5.4+ with eBPF support
* **usability** — profiles PHP frames when debug symbols configured

---

## Decision Tree

Is the Linux kernel 5.4+ with eBPF support?
↓
**YES** — eBPF profiling is available.
**NO** — Cannot use eBPF. Use conventional profiler.

---

Is the goal to profile production with near-zero overhead?
↓
**YES** — eBPF is the best option. Sub-1% overhead.
**NO** — Traditional profilers (Tideways, Blackfire) provide more PHP-specific detail.

---

Are PHP debug symbols installed for frame resolution?
↓
**YES** — PHP function names appear in eBPF flame graphs.
**NO** — Only kernel and C frames visible. PHP frames are unresolved.

---

Is there existing eBPF infrastructure (Pixie, Parca)?
↓
**YES** — Leverage existing setup.
**NO** — May need new infrastructure. Consider Tideways for simpler setup.

---

## Recommended Default

**Default:** eBPF profiling for low-overhead production CPU profiling. Tideways for PHP-specific detail.
**Reason:** eBPF is complementary to traditional profilers — use both for full picture.

---

## Risks Of Wrong Choice

* No debug symbols: eBPF shows only kernel frames, no PHP context
* Old kernel: eBPF not available

---

## Related Skills

* eBPF PHP Profiling
