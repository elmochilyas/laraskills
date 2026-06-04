# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Profiling and Observability
**Knowledge Unit:** Production Guardrails and Profiling Cost
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Profiling in production safely | Operations | Configure |

---

# Architecture-Level Decision Trees

---

## Decision: Production Profiling Guardrails

---

## Decision Context

Profiling in production risks performance degradation (overhead), data exposure (stack traces), and resource exhaustion (profile files). Guardrails mitigate these risks.

---

## Decision Criteria

* **performance** — max acceptable overhead: <5% for always-on, temporary only for higher
* **security** — stack traces may leak internal code paths
* **operations** — profile data must be stored securely

---

## Decision Tree

Is the profiling tool production-safe (overhead <5%)?
↓
**YES** — Tideways (1-3%), eBPF (<1%), Blackfire (3-5% triggered).
**NO** — Xdebug (2-10x), SPX (moderate). Use in staging only.

---

Is the profiling triggered (not always-on)?
↓
**YES** — Set rate limiting: max 1% of requests, or specific endpoints only.
**NO** — Always-on tools must have minimal overhead.

---

Are stack traces redacted for sensitive data?
↓
**YES** — Ensure profiler doesn't expose data in arguments or local variables.
**NO** — Enable redaction or restrict profiling to non-sensitive endpoints.

---

Is there a circuit breaker (stop profiling if overhead exceeds threshold)?
↓
**YES** — Tool auto-disables if server load increases.
**NO** — Monitor server load during profiling. Disable if CPU rises >10%.

---

## Recommended Default

**Default:** Tideways (always-on, <3%) for continuous production profiling. Rate-limit trigger-based profilers to 1% of requests.
**Reason:** Continuous coverage with safe overhead profile.

---

## Risks Of Wrong Choice

* Xdebug in production: 2-10x latency, crashes
* No rate limiting: triggered profiler on all requests overwhelms server
* Stack traces in logs: sensitive data exposure

---

## Related Skills

* Production Guardrails and Profiling Cost
