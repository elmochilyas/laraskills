# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Developer Tooling
**Knowledge Unit:** Laravel Debugbar
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Debugbar vs Telescope for development debugging? | Debugging context, UI preference | Debugbar for in-page; Telescope for historical |
| 2 | Enable Debugbar in staging? | Security, debugging need | Yes — with IP whitelist and selective collectors |

---

# Architecture-Level Decision Trees

---

## Decision 1: Debugbar vs Telescope for Development?

---

## Decision Context

Both tools provide debugging data but differ in presentation: Debugbar is an in-browser toolbar; Telescope is a web dashboard with historical entries.

---

## Decision Criteria

* architectural

---

## Decision Tree

Do you need real-time, in-page debugging on every request?
↓
YES → **Debugbar** — toolbar on every page, instant feedback
NO → ↓
Do you need historical debugging (review past requests)?
↓
YES → **Telescope** — stored entries, searchable, filterable
NO → ↓
Are you debugging API/JSON responses (Debugbar can't inject toolbar)?
↓
YES → **Telescope** — works with any response type
NO → Debugbar for most cases; Telescope supplements
Best practice: **Use both** — Debugbar for daily dev, Telescope for complex debugging

---

## Recommended Default

**Default:** Both Debugbar (for in-page) and Telescope (for historical/API debugging)
**Reason:** They complement each other; Debugbar for speed, Telescope for depth

---

## Risks Of Wrong Choice

- **Debugbar only:** Can't debug API/JSON responses; no historical review
- **Telescope only:** Slower feedback loop; no in-page query/route counts

---

## Related Skills

- Integrate Backstage as a Developer Portal for Laravel

---

## Decision 2: Enable Debugbar in Staging?

---

## Decision Context

Staging environments benefit from Debugbar for pre-production validation but risk data exposure if not properly secured.

---

## Decision Criteria

* security

---

## Decision Tree

Is the staging environment accessible to external users?
↓
YES → **Do NOT enable** — too risky; use Telescope with selective watchers instead
NO (internal-only staging) → ↓
Can you implement IP whitelisting?
↓
NO → **Do NOT enable** — risk outweighs benefit
YES → Enable with IP whitelist + selective collectors (queries, mail only)

---

## Recommended Default

**Default:** Enable in staging only with IP whitelisting and selective collectors
**Reason:** Useful for pre-production validation; security controls mitigate risk

---

## Risks Of Wrong Choice

- **Debugbar on public staging:** Anyone can view DB queries, session data, env config
- **No Debugbar on staging:** Miss pre-production debugging opportunities

---

## Related Rules

- TEMPLATE-RULE-016: Template rendering under 2 seconds

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

