# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 01-event-tracking
**Knowledge Unit:** gdpr-compliance
**Difficulty:** Foundation
**Category:** Compliance Engineering
**Last Updated:** 2026-06-03

---

# Overview

GDPR compliance in analytics is a legal requirement for any application serving users in the European Union. The core engineering challenge is instrumenting event tracking in a way that respects user privacy by default — IP anonymization, cookieless tracking, explicit consent management, data retention limits, and the right to erasure — without sacrificing the analytical value of the data.

The post-GDPR analytics landscape has shifted dramatically. Plausible's cookie-free, IP-anonymized approach has become the de facto standard for self-hosted analytics. Laravel analytics packages now implement these patterns by default, and the industry has moved from "track everything and ask forgiveness later" to "track minimum necessary and document everything."

Engineers must care because non-compliance carries fines of up to 4% of global annual revenue or €20 million, whichever is greater. Beyond fines, privacy-first analytics is increasingly a competitive differentiator — users actively choose services that don't track them.

---

# Core Concepts

## IP Anonymization

The last octet (IPv4) or the last 80 bits (IPv6) of the visitor's IP address must be removed or zeroed before storage. This makes the IP non-personally-identifiable while preserving geolocation granularity at the city/region level. Anonymization must happen at capture time, not as a batch process after storage, because storing the full IP even temporarily constitutes processing of personal data.

## Cookieless Tracking

Cookieless tracking uses fingerprinting alternatives — typically a hash of the user agent + screen resolution + timezone + a daily rotation key — that don't require storing identifiers on the user's device. Unlike cookie-based tracking, cookieless tracking operates without consent under the "legitimate interest" basis for analytics that are strictly necessary for website operation.

## Consent Management

Consent must be: freely given, specific, informed, and unambiguous. For analytics, this means a consent management platform (CMP) that records explicit opt-in before any non-essential tracking begins. Consent records must include: what was consented to, when, and the version of the privacy policy at that time.

## Data Retention

Analytics data must have a defined retention period after which it is automatically deleted. Common retention periods are 14-26 months for aggregate analytics and 30 days for detailed event data. Retention must be enforced at the database level (TTL on ClickHouse MergeTree, partitioning by date with DROP PARTITION in PostgreSQL).

## Right to Erasure

Users can request deletion of all their analytics data. The system must be able to identify and delete all records associated with a user without a join-heavy query across normalized tables. This typically means storing the user identifier in a way that can be efficiently queried for deletion.

---

# When To Use

- Any Laravel application serving users in the EU or EEA
- Applications that process personal data through analytics tracking
- Self-hosted analytics deployments where the application is the data controller
- Multi-tenant SaaS platforms where each tenant may have different compliance requirements
- Systems that share analytics data with third-party processors

---

# When NOT To Use

- Analytics of fully anonymous data that cannot be linked to any user (e.g., server health metrics)
- Internal dashboards with no user-identifying information
- Applications that explicitly disallow EU users or are geo-blocked from EU access (though this is rarely a sound legal strategy)

---

# Best Practices

## Anonymize at Capture, Not in Batch

IP anonymization must happen in the tracking middleware before any storage or queuing. If the full IP touches a queue message or a log file, it has been processed. Use a middleware that anonymizes before dispatch.

## Use Laravel's Built-in Rate Limiter for Consent APIs

Consent management endpoints (consent given, consent withdrawn, data deletion requests) must be rate limited to prevent abuse, but not so aggressively that legitimate user requests fail.

## Implement Retention as Infrastructure, Not Application Code

Data retention should be enforced at the database/storage layer using TTLs, partition drops, or scheduled jobs that cannot be bypassed by application bugs. Application-level deletion is a supplementary mechanism, not a primary one.

## Maintain a Consent Audit Trail

Every consent action (given, withdrawn, scope changed) must be logged with timestamp, consent version, and IP (anonymized). This is critical for demonstrating compliance during audits.

## Treat All Analytics Data as Potentially Personal

Even anonymized datasets can become personally identifiable when combined with other data. Implement access controls, encryption at rest, and strict data governance for all analytics tables.

---

# Architecture Guidelines

## Layer Placement

Consent check logic belongs in the tracking middleware layer, not in individual enrichment or processing jobs. This ensures consent is evaluated once at the ingress point rather than scattered across the pipeline.

## GDPR Enforcement Pipeline

Request → Consent Check Middleware → IP Anonymization → Event Filtering (consent-required vs consent-exempt) → Queue Dispatch → Storage

The consent check and IP anonymization must happen before anything is written to queues or logs.

## Data Deletion Architecture

Implement a `UserAnalyticsData` service that can efficiently delete all analytics records for a given user. This service should use chunked deletion via the queue to avoid long-running database transactions. The service must be idempotent — calling it multiple times for the same user produces the same result.

---

# Performance Considerations

- IP anonymization is O(1) and has negligible performance impact.
- Consent lookups in middleware can be optimized with Redis caching of consent status.
- Data deletion requests for users with large analytics footprints should be queued to avoid blocking the request.
- Retention enforcement via database TTLs has near-zero runtime cost compared to application-level cron jobs.
- Cookieless fingerprinting requires hashing on every request; use xxhash or similar fast hash algorithms.

---

# Security Considerations

- Consent data is itself personal data and must be stored with the same protections as analytics data.
- The consent management system must be resistant to CSRF and replay attacks.
- Right-to-erasure endpoints must verify user identity before executing deletion.
- Analytics database access must be read-only for all application users; only the deletion service should have write access to personal data columns.
- Encryption at rest is mandatory for all analytics tables containing any potentially identifying data.

---

# Common Mistakes

## Mistake: Storing Full IP in Logs

Developers anonymize the IP before storing in the database but log the full IP for debugging. Server logs are not covered by the anonymization middleware, creating a GDPR exposure.

**Better approach:** Configure log anonymization at the Monolog handler level, or disable request logging entirely for analytics endpoints.

## Mistake: Consent as a Boolean

Storing consent as a single boolean column. GDPR requires granular consent — separate consents for analytics, marketing, and personalization.

**Better approach:** Store consent as a JSON object with consent purposes as keys and timestamps as values.

## Mistake: Hardcoded Retention Periods

Retention periods are hardcoded in application code, requiring a deployment to change them. Data protection authorities may require different retention periods for different data categories.

**Better approach:** Read retention periods from configuration or database, with per-category granularity.

---

# Anti-Patterns

## "Consent by Default"

Pre-checking consent checkboxes or starting analytics tracking before the user has explicitly opted in. This violates GDPR's requirement for affirmative consent.

**Solution:** Analytics tracking must be opt-in only. Start with no tracking; enable only after explicit consent.

## "We Anonymize Later"

Storing full IP addresses in the database with the intention of anonymizing them in a nightly batch job. Any period where personal data is stored in an identifiable form is a GDPR violation.

**Solution:** Anonymize at the middleware layer before any persistence.

---

# Examples

## IP Anonymization Middleware

```php
class AnonymizeIpMiddleware
{
    public function handle(Request $request, \Closure $next): mixed
    {
        $request->attributes->set('anonymized_ip', $this->anonymize($request->ip()));
        return $next($request);
    }

    private function anonymize(?string $ip): ?string
    {
        if ($ip === null) return null;

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            return preg_replace('/\.\d+$/', '.0', $ip);
        }

        // IPv6: zero last 80 bits
        $parts = explode(':', $ip);
        return implode(':', array_slice($parts, 0, 4)) . '::';
    }
}
```

## Consent Check in Tracking Middleware

```php
class ConsentCheckMiddleware
{
    public function __construct(private ConsentService $consent) {}

    public function terminate(Request $request, mixed $response): void
    {
        $userId = $request->user()?->id;
        $consent = $this->consent->get($userId);

        if (!$consent?->hasGiven('analytics')) {
            return; // Skip tracking if no analytics consent
        }

        EventTracking::dispatch($request, $consent->scope());
    }
}
```

---

# Related Topics

**Prerequisites:**
- Middleware Event Tracking — Where GDPR enforcement happens in the request lifecycle
- Multi-Tenancy Analytics — Per-tenant GDPR compliance and retention policies

**Closely Related:**
- Self-Hosted Analytics Platforms — Plausible/Matomo GDPR approach comparison
- Data Warehousing — Data retention enforcement at the storage layer

**Advanced Follow-Up:**
- Governance & Compliance Engineering — Broader compliance patterns beyond analytics

**Cross-Domain Connections:**
- Security & Identity Engineering — Encryption, access control, audit logging
