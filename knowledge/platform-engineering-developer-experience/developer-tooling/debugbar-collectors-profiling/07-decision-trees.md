# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Developer Tooling
**Knowledge Unit:** Debugbar Collectors and Profiling
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Which collectors to enable? | Environment, debugging need | All in dev; selective in staging; none in production |
| 2 | Enable stack traces on queries? | Debugging depth vs overhead | 3-5 levels in dev; none in staging |

---

# Architecture-Level Decision Trees

---

## Decision 1: Which Collectors to Enable?

---

## Decision Context

Debugbar has ~20 collectors. Enabling all adds 50-200ms overhead and exposes sensitive data. Selection depends on environment and what you're debugging.

---

## Decision Criteria

* performance
* security

---

## Decision Tree

What environment?
↓
**Production** → Disable all (`DEBUGBAR_ENABLED=false`)
**Staging** → ↓
What are you debugging?
- Queries → Enable QueryCollector only
- Mail → Enable MailCollector
- General → Enable 3-5 minimum needed
**Development** → Enable all collectors for comprehensive debugging
Regardless:
- Disable for API routes
- Use IP whitelisting on staging
- Limit stack trace depth to 3-5 levels

---

## Recommended Default

**Default:** All collectors in development; selective (queries, mail, log) in staging; disabled in production
**Reason:** Balances debugging capability with security and performance

---

## Risks Of Wrong Choice

- **All collectors in production:** Critical security breach; exposes queries with values, session data
- **No collectors when debugging:** Can't identify N+1 queries, slow operations, view data issues

---

## Related Rules

- BACKSTAGE-RULE-005: Self-host vs managed
- BACKSTAGE-RULE-008: Weekly upgrade cadence

---

## Related Skills

- Integrate Backstage as a Developer Portal for Laravel

---

## Decision 2: Enable Stack Traces on Queries?

---

## Decision Context

Query stack traces show where queries originate but `debug_backtrace()` is expensive. Depth must balance debugging utility with overhead.

---

## Decision Criteria

* performance

---

## Decision Tree

What is the environment?
↓
**Production** → No stack traces (security + performance)
**Staging** → 2-3 levels (enough to identify source query)
**Development** → ↓
Are you investigating N+1 or slow queries?
↓
YES → 3-5 levels; disable after investigation
NO → 1-2 levels or disabled (lower overhead)
Regardless:
- Stack traces add 0.1-0.5ms per query
- 100 queries with full traces = 50ms+ overhead
- Profile with traces ON, remove when done

---

## Recommended Default

**Default:** 3-5 levels in development; 2-3 in staging; none in production
**Reason:** Identifies query source without excessive overhead

---

## Risks Of Wrong Choice

- **Full traces on all queries:** 50-200ms overhead; slower page loads during development
- **No traces when debugging N+1:** Can't identify where queries originate; guessing game

---

## Related Rules

- BACKSTAGE-RULE-006: Plugin architecture
- BACKSTAGE-RULE-014: Vet third-party plugins

---

## Related Skills

- Integrate Backstage as a Developer Portal for Laravel

