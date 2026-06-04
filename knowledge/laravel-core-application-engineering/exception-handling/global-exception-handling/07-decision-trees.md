# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Exception Handling
**Knowledge Unit:** Production vs Debug Display
**Generated:** 2026-06-03

---

# Decision Inventory

* Debug Mode vs Production Mode Display Strategy
* `shouldReport()` Gate for Environment-Specific Filtering
* Environment-Specific Log Level Configuration

---

# Architecture-Level Decision Trees

---

## Decision 1: Debug Mode vs Production Mode Display Strategy

---

## Decision Context

How to configure error display to show maximum debugging information in development while protecting production users from information leakage.

---

## Decision Criteria

* Whether the environment is local, staging, or production
* Whether the environment is accessible to external users
* Whether the team needs enhanced debugging for staging environments
* Whether the application uses Ignition (Laravel 10) or the default error page (Laravel 11+)

---

## Decision Tree

Is the environment accessible to external users or customers?
↓
YES → Is this a staging environment that requires enhanced debugging for QA?
    YES → Enable debug mode but restrict access (IP whitelist, HTTP basic auth, VPN) — never publicly accessible
    NO → Set `APP_DEBUG=false` — generic error pages, no stack traces, no environment variable exposure
NO → Is this a local development environment?
    YES → Set `APP_DEBUG=true` — full stack traces, Ignition debug pages, environment variable display
    NO → Is this a CI/testing environment?
        ↓
        YES → Set `APP_DEBUG=true` — test failures show full stack traces in CI output
        NO → Set `APP_DEBUG=false` — default to safe behavior

---

## Rationale

APP_DEBUG=true exposes environment variables, file paths, database queries, and framework internals that attackers can exploit. This is valuable for development but dangerous in any environment accessible to external users, including staging.

---

## Recommended Default

**Default:** `APP_DEBUG=true` in local development. `APP_DEBUG=false` in all other environments. For staging, enhance debugging via IP-restricted error pages or dedicated debugging tools, not APP_DEBUG.
**Reason:** Restricting APP_DEBUG to local only is the safest default. Staging debugging should use targeted mechanisms that don't expose internals to unauthorized users.

---

## Risks Of Wrong Choice

* APP_DEBUG=true in production: Full stack traces, environment variables (including DB passwords, API keys), and file paths exposed to any user who triggers an error
* APP_DEBUG=false in local: Developers can't see stack traces — debugging is significantly harder
* APP_DEBUG in staging without IP restriction: External users can access sensitive debugging information
* Ignition in production (Laravel 10): Environment variables, query logs, and request data exposed — major security vulnerability

---

## Related Rules

* Production vs Debug Error Display
* APP_DEBUG Environment Configuration

---

## Related Skills

* Production vs Debug Display Configuration
* Exception Handler Configuration

---

---

## Decision 2: `shouldReport()` Gate for Environment-Specific Filtering

---

## Decision Context

Whether to use the `shouldReport()` method on the exception handler to suppress or modify reporting behavior based on the current environment.

---

## Decision Criteria

* Whether certain exceptions should only be reported in production
* Whether the application has different exception reporting needs per environment
* Whether staging environments should suppress notifications for expected test errors
* Whether the team needs to log additional detail in staging that would be noise in production

---

## Decision Tree

Does the application have exceptions that are expected in non-production environments (test alerts, simulated failures)?
↓
YES → Override `shouldReport()` to suppress these in staging/development — `app()->environment('production')`
NO → Are there exceptions that should only trigger alerts in production?
    YES → Use `shouldReport()` to gate alerting integrations — only report to PagerDuty/Sentry in production
    NO → Does the team need different log levels per environment?
        ↓
        YES → Configure `LOG_LEVEL` per environment — `debug` in local, `warning` in production
        NO → Default `shouldReport()` behavior is sufficient — no override needed

---

## Rationale

`shouldReport()` is checked before any `reportable()` callbacks run. It's the correct place for environment-level gating. Individual `reportable()` callbacks can also check `app()->environment()` for more granular control.

---

## Recommended Default

**Default:** Do NOT override `shouldReport()` unless specific exceptions need environment-specific filtering. Use `LOG_LEVEL` env variable for broad log level control per environment.
**Reason:** Default behavior is correct for most applications. Overriding `shouldReport()` adds complexity that's only justified when environment-specific filtering is genuinely needed.

---

## Risks Of Wrong Choice

* Overriding `shouldReport()` to suppress everything: Silent production failures — no logs, no alerts
* No environment gating on alerting: Staging test errors trigger production alerts — alert fatigue
* LOG_LEVEL=debug in production: Every DEBUG message is logged — massive log volume, expensive storage
* `shouldReport()` returning false incorrectly: Critical exceptions are silently suppressed

---

## Related Rules

* Environment-Specific Exception Reporting
* Log Level Configuration per Environment

---

## Related Skills

* Production vs Debug Display Configuration
* Exception Handler Configuration

---

---

## Decision 3: Environment-Specific Log Level Configuration

---

## Decision Context

What log level to set per environment to balance debugging information in development with log volume and signal quality in production.

---

## Decision Criteria

* Whether the environment needs full debug-level logging (development, CI failure investigation)
* Whether the environment has log aggregation with cost per volume (production)
* Whether the team needs WARNING-level visibility for specific environments (staging)
* Whether compliance requires specific log retention and levels

---

## Decision Tree

Is this a local development environment?
↓
YES → Set `LOG_LEVEL=debug` — maximum information, no cost concern, developers filter as needed
NO → Is this a production environment?
    YES → Set `LOG_LEVEL=warning` — ERROR and CRITICAL only, reduces volume and cost
    NO → Is this a staging environment?
        ↓
        YES → Set `LOG_LEVEL=info` — more detail than production but less noise than debug
        NO → Set `LOG_LEVEL=warning` — default safe level for non-development environments

---

## Rationale

Log level controls the verbosity of the application's log output. In development, `debug` provides maximum information. In production, `warning` ensures only actionable errors are logged, reducing volume and cost. Staging at `info` provides more visibility for QA without debug-level noise.

---

## Recommended Default

**Default:** `LOG_LEVEL=debug` for local, `LOG_LEVEL=warning` for production, `LOG_LEVEL=info` for staging.
**Reason:** This balances debugging needs with log volume and cost. Production should only log what needs attention. Staging needs more detail for QA.

---

## Risks Of Wrong Choice

* LOG_LEVEL=debug in production: Every SQL query, HTTP request, and DEBUG log entry is written — massive volume, high cost, buries real errors
* LOG_LEVEL=error in production: WARNING-level issues are invisible — degraded states go unnoticed until they become errors
* LOG_LEVEL=warning in local: Developers can't see DEBUG and INFO messages — harder to trace request flow
* LOG_LEVEL not set: Defaults to `debug` — accidentally verbose in production

---

## Related Rules

* Environment-Specific Log Level
* LOG_LEVEL Configuration

---

## Related Skills

* Production vs Debug Display Configuration
* Log Channel Configuration
