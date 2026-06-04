# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 10-observability-monitoring
**Knowledge Unit:** observability-monitoring
**Difficulty:** Intermediate
**Category:** Observability
**Last Updated:** 2026-06-03

# Overview

Laravel's observability stack spans first-party tools (Nightwatch for production, Pulse for health dashboards, Telescope for debug assistance), third-party APM (Datadog, New Relic with OpenTelemetry), and error tracking (Sentry, Flare). The three-pillar model (logging, metrics, tracing) guides production monitoring strategy.

Observability monitoring exists because Laravel applications are complex systems where traditional "is the server up" monitoring is insufficient. The engineering value is understanding application behavior at the request level — detecting, diagnosing, and resolving issues proactively.

# When To Use

- All production Laravel deployments
- Applications with SLAs or SLOs
- Team-based development requiring shared operational insight

# When NOT To Use

- Development-only environments
- Prototypes before go-live

# Core Concepts

- **Observability Pillars** — Logs, metrics, traces
- **Nightwatch** — Forge-native production monitoring with request sampling
- **Pulse** — Real-time application health metrics dashboard
- **Telescope** — Development request debugging (not production)
- **Sentry/Flare** — Error tracking with stack traces and context
- **Datadog/New Relic** — Full APM with distributed tracing

# Best Practices

**Log Structured Data.** Use JSON logging with consistent schemas. Include request IDs for trace correlation.

**Monitor SLOs.** Define Service Level Objectives and monitor compliance. Alert when approaching SLO violation.

**Sample in High Traffic.** For high-throughput applications, sample requests rather than logging everything.

**Correlate Logs and Traces.** Use unique request IDs across logs, metrics, and traces.

# Related Topics

**Prerequisites:** Laravel basics, server management
**Closely Related:** Infrastructure Monitoring Tools, Nightwatch, Pulse
**Advanced Follow-Ups:** OpenTelemetry, SLO-Based Alerting, Error Budgets
