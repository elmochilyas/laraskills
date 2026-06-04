# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 05-api-versioning
**Knowledge Unit:** deprecation-headers
**Generated:** 2026-06-03

---

# Decision Inventory

1. Deprecation Communication Strategy (Headers vs Direct)
2. Sunset Date Setting Strategy
3. Usage Analytics Strategy

---

# Architecture-Level Decision Trees

---

## Deprecation Communication Strategy

---

## Decision Context

Choosing how to communicate API version deprecation to consumers.

---

## Decision Criteria

* maintainability
* user experience

---

## Decision Tree

Are the consumers external (third-party developers)?
↓
YES → Use standard RFC 8594 Deprecation + RFC 7231 Sunset headers
  ↓
  Do you have direct contact with consumers?
  ↓
  YES → Headers + direct email/notification for known consumers
  NO → Headers are the sole communication channel
NO → Are the consumers internal (same organization)?
  ↓
  YES → Headers + internal Slack/email + dashboard notices
  NO → Headers alone may suffice for automated consumers
  ↓
  Need to include successor version link?
  ↓
  YES → Add Link: </v2/users>; rel="successor-version" header
  NO → Consumers must discover new version independently

---

## Rationale

Standard headers enable automated tooling to detect deprecation. Direct communication supplements headers for known consumers. Successor version links provide clear migration direction.

---

## Recommended Default

**Default:** RFC 8594 Deprecation + RFC 7231 Sunset + Link successor-version headers
**Reason:** Full automated signaling; clear migration direction; standard-compliant

---

## Risks Of Wrong Choice

No deprecation headers leave consumers unaware until removal. No successor link requires consumers to search for the replacement. No direct communication for known consumers risks missed migrations.

---

## Related Rules

Add Deprecation Header Immediately When Deprecating, Include Link Header Pointing to Replacement

---

## Related Skills

Implement SaloonPHP Pagination Plugin

---

## Sunset Date Setting Strategy

---

## Decision Context

Determining the removal date for deprecated API versions.

---

## Decision Criteria

* maintainability
* user experience

---

## Decision Tree

Are there active consumers on the deprecated version?
↓
YES → Set Sunset based on usage analytics
  ↓
  Is usage declining?
  ↓
  YES → Set Sunset 6 months from now (standard migration window)
  NO → Extend migration support; investigate migration blockers
NO → No known usage? Remove sooner (3 months) with short notice
  ↓
  Need to coordinate with contractual SLAs?
  ↓
  YES → Sunset date must satisfy minimum support commitment
  NO → 6-month window from deprecation announcement is standard
  ↓
  Monitor usage decline after deprecation?
  ↓
  YES → Extend Sunset if migration isn't progressing
  NO → Fixed date regardless of migration pace

---

## Rationale

Sunset dates should be based on actual usage data, not arbitrary timelines. 6 months is the standard migration window for public APIs. Analytics-driven extensions prevent forced migrations.

---

## Recommended Default

**Default:** Sunset = 6 months from deprecation; extend if analytics show remaining active usage
**Reason:** Standard window; data-driven extension prevents breaking active consumers

---

## Risks Of Wrong Choice

Too-short Sunset breaks consumers who can't migrate quickly. Too-long Sunset continues supporting old code unnecessarily. Fixed dates without analytics ignore actual migration progress.

---

## Related Rules
Set Realistic Sunset Dates Based on Analytics, Monitor Deprecated Version Usage Drop-off

---

## Related Skills
Implement SaloonPHP Pagination Plugin

---

## Usage Analytics Strategy

---

## Decision Context

Tracking API version usage to drive deprecation decisions.

---

## Decision Criteria

* maintainability
* performance

---

## Decision Tree

Need to know which API versions consumers are using?
↓
YES → Implement version usage analytics via middleware logging
  ↓
  Is the API high-traffic (>1000 req/s)?
  ↓
  YES → Sample analytics (1/100 requests) to reduce overhead
  NO → Log every request with version and basic metadata
NO → Need per-consumer version tracking?
  ↓
  YES → Include consumer identity (API key hash) in analytics
  NO → Aggregate counts only; no per-consumer tracking
  ↓
  Act on analytics data?
  ↓
  YES → Monthly review; adjust Sunset dates based on trends
  NO → Data collected but not used to drive decisions

---

## Rationale

Version usage analytics provide data to drive deprecation timing decisions. Sampling reduces overhead on high-traffic endpoints. Per-consumer tracking enables targeted migration communication.

---

## Recommended Default

**Default:** Sampled analytics (1/100 requests) with monthly review for Sunset decisions
**Reason:** Low overhead; data-driven deprecation; actionable insights

---

## Risks Of Wrong Choice

No analytics means deprecation timing is guesswork. Full analytics on high-traffic endpoints adds overhead. Analytics without action generates noise without value.

---

## Related Rules
Use Middleware for Header Injection, Review Analytics Monthly

---

## Related Skills
Implement SaloonPHP Pagination Plugin
