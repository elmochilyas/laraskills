# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 10-observability-monitoring
**Knowledge Unit:** infrastructure-monitoring-tools
**Difficulty:** Intermediate
**Category:** Observability
**Last Updated:** 2026-06-03

# Overview

Infrastructure monitoring tools for Laravel encompass the three observability pillars: structured logging, metrics collection, and distributed tracing. The ecosystem includes first-party tools (Nightwatch, Pulse, Telescope) and third-party services (Sentry, Datadog, Flare). This KU covers tool selection, configuration best practices, health check patterns, and production monitoring strategies.

Observability exists because production applications are complex systems that fail in unpredictable ways. The engineering value is knowing what's happening inside your application at all times, so you can detect, diagnose, and resolve issues before users are affected.

# When To Use

- All production Laravel applications
- Applications with SLAs or uptime requirements
- Team-based development where shared insight matters

# When NOT To Use

- Personal projects with zero users
- Prototypes before launch

# Core Concepts

- **Logging** — Structured event records for debugging and audit
- **Metrics** — Numerical measurements (request rate, error rate, latency)
- **Tracing** — Request-level visibility across service boundaries
- **Nightwatch** — First-party Laravel production monitoring (Forge-integrated)
- **Pulse** — Real-time application health dashboard
- **Telescope** — Development debug assistant (not for production)
- **Health Checks** — Endpoint that validates application stack

# Best Practices

**Monitor Before Launch.** Configure monitoring before going live, not after. You need baseline data from day one.

**Set Alert Thresholds.** Define paged-alert thresholds based on historical data, not theoretical values.

**Use Structured Logging.** Log in JSON format for machine parsing. Include request ID, user ID, and duration.

**Implement Health Checks.** Create an endpoint that validates database, Redis, queue, and critical dependencies.

# Related Topics

**Prerequisites:** Laravel basics, server management
**Closely Related:** Observability Monitoring, Nightwatch, Pulse, Telescope
**Advanced Follow-Ups:** OpenTelemetry, APM, Distributed Tracing
