# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Developer Tooling
**Knowledge Unit:** Log Viewer and Debugging Patterns
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Log level for production? | Environment, noise tolerance | WARNING — prevents DEBUG/INFO noise |
| 2 | Structured vs line format? | Machine parsing needs | JSON in production; line format in dev |

---

# Architecture-Level Decision Trees

---

## Decision 1: Log Level for Production?

---

## Decision Context

Production log level determines which severity messages are written. Too low fills disks; too high may miss issues.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

What environment?
↓
**Production** → **WARNING** (or higher) — DEBUG and INFO create noise and fill disks
**Staging** → **INFO** — more visibility for pre-production validation
**Development** → **DEBUG** — maximum verbosity for debugging
Regardless:
- Use channel-specific levels for high-traffic subsystems
- Configure daily rotation with 30-day retention
- Monitor disk usage; alert on > 80% disk

---

## Recommended Default

**Default:** WARNING in production, DEBUG in development
**Reason:** Prevents disk exhaustion from DEBUG/INFO noise in production

---

## Risks Of Wrong Choice

- **DEBUG in production:** Disk fills within hours on busy apps; log rotation can't keep up
- **ERROR only in production:** Miss WARNING-level issues that indicate growing problems

---

## Related Skills

- Integrate Backstage as a Developer Portal for Laravel

---

## Decision 2: Structured vs Line Format?

---

## Decision Context

Laravel supports line format (human-readable) and JSON format (structured for machine parsing). The choice depends on log aggregation.

---

## Decision Criteria

* architectural

---

## Decision Tree

Do you use a log aggregation service (Logtail, Papertrail, DataDog, ELK)?
↓
YES → **JSON/structured format** — aggregation tools parse JSON natively
NO → ↓
Do you manually read logs via CLI or log viewer?
↓
YES → **Line format** — human-readable without additional tools
NO → ↓
Future plans for aggregation?
↓
YES → Use JSON now; easier to add aggregation later
NO → Line format is simpler

---

## Recommended Default

**Default:** JSON in production (for future aggregation); line format in development
**Reason:** JSON enables machine parsing; line format is more readable for manual inspection

---

## Risks Of Wrong Choice

- **Line format with aggregation:** Aggregation tool must parse unstructured text; brittle
- **JSON without aggregation:** Harder to read manually; unnecessary for small apps

---

## Related Rules

- TEMPLATE-RULE-009: Test all templates in CI

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

