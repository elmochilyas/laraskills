# OTel Auto-Instrumentation — Decomposition

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 09-advanced-topics
- **Knowledge Unit:** otel-auto-instrumentation
- **Last Updated:** 2026-06-04

---

## Topic Overview

OpenTelemetry auto-instrumentation for PHP enables zero-code observability — install the PHP extension, add Composer instrumentation packages, set environment variables, and get traces, metrics, and logs without modifying application code. The PHP extension hooks into internal function calls; instrumentation libraries decode framework-specific semantics.

---

## Decomposition Strategy

This KU is atomic — it covers a single well-bounded concept (auto-instrumentation via PHP extension and instrumentation packages) with independent decisions, tradeoffs, and architecture guidance. Sub-topics (extension installation, package selection, environment configuration, performance profiling) are integral to the single concept and do not warrant separate KUs.

---

## Proposed Folder Structure

```
otel-auto-instrumentation/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
  05-rules.md
  06-skills.md
  07-decision-trees.md
  08-anti-patterns.md
  09-checklists.md
```

---

## Knowledge Unit Inventory

### OTel Auto-Instrumentation (single unit)
- **Purpose:** Providing comprehensive guidance on zero-code observability for PHP/Laravel via the OTel PHP extension and instrumentation packages
- **Difficulty:** Advanced
- **Dependencies:** OpenTelemetry PHP SDK, OpenTelemetry Ecosystem

---

## Dependency Graph

**Depends on:**
- OpenTelemetry PHP SDK (SDK configuration for auto-instrumented traces)
- OpenTelemetry Ecosystem (auto-instrumentation fits within broader OTel architecture)
- Community Packages (Laravel-specific convenience wrappers)

**Depended by:**
- OTel Collector Production (Collector receives auto-instrumented data)
- Distributed Tracing (auto-instrumentation provides span data)

---

## Boundary Analysis

**In scope:**
- PHP extension installation via PECL, OS packages, Docker
- Instrumentation packages for Laravel, PDO, Guzzle, Redis
- Environment variable configuration (OTEL_PHP_AUTOLOAD_ENABLED, OTEL_PHP_EXCLUDED_URLS)
- Zero-code vs code-based instrumentation patterns
- OTel PHP Distro for production deployments
- Performance profiling and overhead measurement

**Out of scope:**
- Vendor-specific agents (New Relic, Datadog)
- Manual instrumentation for business logic
- Community package convenience layers (covered in Community Packages KU)
- Collector configuration (covered in OTel Collector Production KU)

---

## Future Expansion Opportunities

- eBPF-based auto-instrumentation for PHP (emerging)
- Custom instrumentation package development guide
- Octane fiber compatibility patterns
