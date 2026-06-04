# Decomposition: OTel Auto-Instrumentation

## Topic Overview
OpenTelemetry auto-instrumentation for PHP enables zero-code observability â€” install the PHP extension, add Composer instrumentation packages, set environment variables, and get traces, metrics, and logs without modifying application code. The PHP extension hooks into internal function calls; instrumentation libraries decode framework-specific semantics. This is the most significant advantage of OTel over vendor-specific SDKs, which require per-installation configuration.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
opentelemetry-ecosystem/otel-auto-instrumentation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### OTel Auto-Instrumentation
- **Purpose:** OpenTelemetry auto-instrumentation for PHP enables zero-code observability â€” install the PHP extension, add Composer instrumentation packages, set environment variables, and get traces, metrics, and logs without modifying application code. The PHP extension hooks into internal function calls; instrumentation libraries decode framework-specific semantics. This is the most significant advantage of OTel over vendor-specific SDKs, which require per-installation configuration.
- **Difficulty:** Advanced
- **Dependencies:
  - OpenTelemetry PHP SDK (SDK configuration for auto-instrumented traces)
  - W3C Trace Context Propagation (auto-injection of traceparent by PSR-18 instrumentation)
  - Community Packages (Laravel-specific convenience wrappers)
  - OTel Collector Production Hardening (Collector receives auto-instrumented data)

## Dependency Graph
**Depends on:**
  - OpenTelemetry PHP SDK (SDK configuration for auto-instrumented traces)
  - W3C Trace Context Propagation (auto-injection of traceparent by PSR-18 instrumentation)
  - Community Packages (Laravel-specific convenience wrappers)
  - OTel Collector Production Hardening (Collector receives auto-instrumented data)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - PHP extension
  - Hook registration
  - Instrumentation library
  - Zero-code vs code-based
  - OTel PHP Distro
  - PHP auto-instrumentation vs eBPF

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization