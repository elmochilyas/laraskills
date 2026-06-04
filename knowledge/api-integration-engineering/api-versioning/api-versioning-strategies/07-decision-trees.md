# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 05-api-versioning
**Knowledge Unit:** api-versioning-strategies
**Generated:** 2026-06-03

---

# Decision Inventory

1. Versioning Strategy Selection (URI vs Header vs Query)
2. Version Lifecycle Management Strategy
3. Migration and Deprecation Strategy

---

# Architecture-Level Decision Trees

---

## Versioning Strategy Selection

---

## Decision Context

Choosing the API versioning strategy for the application.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Is the API public-facing with external developers?
↓
YES → Use URI path versioning (/v1/, /v2/) — most visible, simplest
  ↓
  Do consumers prefer clean URLs without version prefixes?
  ↓
  YES → Use Accept header versioning (Content-Type negotiation)
  NO → URI path versioning is the clearest and most testable
NO → Is the API internal with a small number of consumers?
  ↓
  YES → Header-based or query parameter versioning are acceptable
  NO → URI versioning recommended regardless of consumer count
  ↓
  Need to cache responses by version?
  ↓
  YES → URI versioning is cache-friendly (different URLs = different cache keys)
  NO → Header versioning works but complicates caching
  ↓
  Default version when none specified?
  ↓
  YES → Route to latest stable version; add Deprecation header if old
  NO → Require explicit version; return 400 if missing

---

## Rationale

URI versioning is the most visible and testable strategy. Header versioning provides cleaner URLs but complicates caching and testing. Query parameter versioning is simplest but least standard.

---

## Recommended Default

**Default:** URI path versioning (/v1/resource, /v2/resource)
**Reason:** Most visible; simplest to route and test; cache-friendly

---

## Risks Of Wrong Choice

Header versioning makes manual testing (curl/browser) harder. Query versioning pollutes analytics and cache keys. Mixed strategies confuse consumers and complicate tooling.

---

## Related Rules

Prefer URI Versioning for Most APIs, Version from Day One

---

## Related Skills

Exclude Webhook Routes from CSRF Protection

---

## Version Lifecycle Management Strategy

---

## Decision Context

Managing the lifecycle of API versions from creation to retirement.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Is the version in active development?
↓
YES → Active state; no deprecation headers; full support
  ↓
  Has a newer version been released?
  ↓
  YES → Deprecate old version (Deprecation: true header)
  NO → Stay active; no deprecation needed
NO → Is the version past the migration window (6 months)?
  ↓
  YES → Check usage analytics for remaining traffic
  ↓
  Traffic below threshold (<1% of total)?
  ↓
  YES → Schedule Sunset date; add Sunset header
  NO → Extend migration window; communicate with remaining consumers
  NO → Add Deprecation header with 6-month Sunset
  ↓
  Need to return 410 Gone after removal?
  ↓
  YES → 410 with migration instructions and successor version link
  NO → 404 Not Found (less helpful for migrating consumers)

---

## Rationale

Clear lifecycle states (Active → Deprecated → Sunset → Removed) with documented timelines give consumers predictable migration paths. Analytics-driven sunset timing ensures decisions are data-based.

---

## Recommended Default

**Default:** Active → 6-month Deprecated → Sunset header → 410 Gone
**Reason:** Industry standard lifecycle; predictable consumer migration path

---

## Risks Of Wrong Choice

No deprecation phase blindsides consumers with removal. No sunset enforcement means old versions are supported forever. No analytics means sunset timing is guesswork.

---

## Related Rules
Communicate Deprecation via Standard Headers, Support Minimum 6-Month Migration Window

---

## Related Skills
Exclude Webhook Routes from CSRF Protection

---

## Migration and Deprecation Strategy

---

## Decision Context

Managing consumer migration from old to new API versions.

---

## Decision Criteria

* maintainability
* user experience

---

## Decision Tree

Is a newer API version available?
↓
YES → Add Deprecation + Sunset + Link headers to old version responses
  ↓
  Are there known consumers of the old version?
  ↓
  YES → Direct communication (email, dashboard notice) + headers
  NO → Headers are the sole communication channel
NO → Is the current version still the latest?
  ↓
  YES → No migration needed; no deprecation headers
  NO → Deprecation is overdue; add headers immediately
  ↓
  Need to support parallel version operation?
  ↓
  YES → Deploy v1 and v2 simultaneously; shared service layer
  NO → Canary deploy: migrate consumers incrementally
  ↓
  Monitor migration progress?
  ↓
  YES → Track version usage analytics; alert if migration stalls
  NO → No monitoring; consumers migrate at unknown pace

---

## Rationale

Parallel version deployment enables consumers to migrate at their own pace. Deprecation headers provide automated signaling. Direct communication supplements headers for known consumers.

---

## Recommended Default

**Default:** Parallel deployment with 6-month overlap; Deprecation + Sunset + Link headers
**Reason:** Maximum consumer flexibility; automated + direct communication

---

## Risks Of Wrong Choice

Immediate v1 removal when v2 ships breaks production integrations. No headers make consumers unaware of deprecation. No analytics hide stalled migration from ops.

---

## Related Rules
Support Minimum 6-Month Migration Window, Use Parallel Version Deployment

---

## Related Skills
Exclude Webhook Routes from CSRF Protection
