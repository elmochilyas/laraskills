# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 09-advanced-topics
**Knowledge Unit:** community-packages
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Community OTel packages evaluated (`keepsuit/laravel-opentelemetry`, `overtrue/laravel-open-telemetry`)
- [ ] Package chosen based on Laravel version compatibility and feature requirements
- [ ] Convenience layer confirmed to reduce boilerplate versus raw OTel SDK usage
- [ ] Service provider registration and configuration approach validated

---

# Architecture Checklist

- [ ] Package's abstraction layer assessed for leakiness or limitations vs raw SDK
- [ ] Auto-configuration approach reviewed for compatibility with existing OTel pipeline
- [ ] Decision documented on when to use convenience layer vs raw SDK for specific use cases

---

# Implementation Checklist

- [ ] Package installed via Composer with version constraint pinned
- [ ] `config/opentelemetry.php` configuration file published and reviewed
- [ ] Tracer setup verified through package facade or dependency injection
- [ ] Laravel lifecycle hooks (requests, queue jobs, commands) wired to OTel spans
- [ ] Custom instrumentation added where package defaults are insufficient

---

# Performance Checklist

- [ ] Package overhead benchmarked against raw SDK for high-throughput endpoints
- [ ] Span export batch size and interval tuned via package configuration
- [ ] Memory impact of package's default processors reviewed

---

# Security Checklist

- [ ] Package dependencies audited for known vulnerabilities
- [ ] OTel exporter credentials stored in environment configuration, not committed
- [ ] Package version pinned to avoid breaking changes from upstream updates

---

# Reliability Checklist

- [ ] Fallback plan documented for migrating from package to raw SDK if package is abandoned
- [ ] Package's error handling reviewed for silent failures in span export
- [ ] Graceful degradation confirmed when OTel backend is unreachable

---

# Testing Checklist

- [ ] Smoke test confirms traces reach the OTel backend after package installation
- [ ] Tests verify package works across all configured channels (HTTP, queue, CLI)
- [ ] Upgrade path tested by running test suite against package minor version bumps

---

# Maintainability Checklist

- [ ] Package version and upgrade cadence documented in project README
- [ ] Custom configuration overrides isolated from package defaults for easy upgrades
- [ ] Abandonment plan documented in case package is no longer maintained

---

# Anti-Pattern Prevention Checklist

- [ ] No vendor lock-in created through package-specific APIs not available in raw SDK
- [ ] No unused package features enabled, causing unnecessary overhead
- [ ] No package customization that prevents clean upgrades

---

# Production Readiness Checklist

- [ ] Package load-tested at expected production traffic levels
- [ ] Monitoring configured for the package itself (tracer initialization failures)
- [ ] Rollback procedure documented for reverting to raw SDK if needed

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related References

- OpenTelemetry PHP SDK (raw SDK usage underlying these packages)
- OTel Auto-Instrumentation (complementary zero-code instrumentation)
- OTLP Exporter & Collector Configuration (exporter configuration via packages)
