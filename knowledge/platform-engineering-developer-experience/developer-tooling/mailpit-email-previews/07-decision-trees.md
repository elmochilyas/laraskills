# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Developer Tooling
**Knowledge Unit:** Mailpit Email Previews
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Mailpit vs MailHog vs real delivery? | Project age, compatibility | Mailpit (default in Sail, replaces MailHog) |

---

# Architecture-Level Decision Trees

---

## Decision 1: Mailpit vs Alternatives for Email Testing?

---

## Decision Context

Mailpit is the default email testing tool in Laravel Sail, replacing the discontinued MailHog. Alternatives include MailHog (unmaintained), real delivery (risk), or logging.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Is the project using Laravel Sail?
↓
YES → **Use Mailpit** — pre-configured in `docker-compose.yml`
NO → ↓
Is the project Docker-based?
↓
YES → Add Mailpit as Docker service (Go binary, lightweight)
NO → ↓
Is there a need for email verification in automated tests?
↓
YES → **Use Mailpit** — REST API for test assertions
NO → ↓
Is email functionality simple (single template, low volume)?
↓
YES → Log to file (less setup); preview in logs
NO → **Use Mailpit** for UI previews and testing

---

## Recommended Default

**Default:** Mailpit for any project with email functionality
**Reason:** Lightweight, pre-configured in Sail, REST API for tests, web UI for previews

---

## Risks Of Wrong Choice

- **Real delivery in development:** Accidentally sends test emails to real recipients
- **MailHog (unmaintained):** Security issues, no updates, missing features
- **Log only:** Can't preview HTML rendering; time-consuming

---

## Related Rules

- TEMPLATE-RULE-006: Distribution method

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

