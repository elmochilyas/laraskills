# Self-Hosted Analytics Platforms

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 02-self-hosted-analytics
- **Knowledge Unit:** self-hosted-analytics-platforms
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-04

---

## Executive Summary

The deprecation of Universal Analytics drove massive churn toward self-hosted analytics platforms — Laravel applications commonly integrate with Plausible (privacy-first), Matomo (full GA4 replacement), or PostHog (product analytics with session recording). The choice of analytics platform determines data ownership, privacy compliance, operational cost, and analytical capabilities; the integration pattern — proxy vs direct API vs SDK — determines reliability, performance, and feature access.

---

## Core Concepts

- **Plausible:** Lightweight, privacy-first, cookieless tracking by default, clean dashboard with essential metrics — self-hosting requires running the Elixir application with PostgreSQL
- **Matomo:** Full-featured GA4 replacement with heatmaps, session recordings, A/B testing, funnels — provides PHP SDK (`matomo/matomo-php-tracker`) that integrates directly with Laravel
- **PostHog:** Product analytics combining event tracking, feature flags, session recording, and experimentation — JavaScript library, Python SDK, and REST API available
- **Reverse Proxy Pattern:** Recommended integration for Plausible and Matomo — proxy tracking requests through the Laravel app or Nginx to mask the analytics server URL and bypass ad blockers

---

## Mental Models

- **Analytics Platform as Black Box:** The self-hosted analytics platform is a black box that receives events and provides dashboards. The Laravel application should treat it as an external service — even though it's self-hosted, the architecture assumes the platform could be replaced.
- **Reverse Proxy as Security Guard:** The reverse proxy sits between the user's browser and the analytics server, sanitizing and routing requests. Like a security guard checking IDs at a building entrance, the proxy adds server-side context and blocks unauthorized access.

---

## Internal Mechanics

The tracking flow: User Browser → Tracking Snippet → Reverse Proxy (Nginx/Caddy) → Analytics Server → Database. The reverse proxy adds server-side context (IP, user agent) before forwarding to the analytics server. For Plausible, the JavaScript snippet sends events to the proxy endpoint. For Matomo, the PHP SDK sends HTTP requests to the Matomo instance. For PostHog, the JavaScript library sends events directly to the PostHog instance or through a proxy. The analytics server processes events asynchronously and stores them in its database (PostgreSQL for Plausible, MySQL for Matomo, ClickHouse for PostHog).

---

## Patterns

- **Reverse Proxy Integration:** All tracking requests go through the Laravel application or a reverse proxy — masks analytics server URL, bypasses ad blockers, enables server-side enrichment
- **Separate Analytics Infrastructure:** Analytics platform database runs on separate infrastructure from the Laravel application database — different I/O patterns and resource requirements
- **Managed API Integration:** For lightweight tracking, use the analytics platform's REST API to send events server-side from Laravel jobs rather than client-side JavaScript

---

## Architectural Decisions

Choose Plausible for simplicity and privacy-first analytics where essential metrics suffice. Choose Matomo when feature parity with GA4 is required (funnels, segments, custom dimensions). Choose PostHog for product analytics with session recording and feature flags bundled together. Always use a reverse proxy for tracking endpoints regardless of platform choice.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Full data ownership (self-hosted) | Infrastructure management overhead | Must monitor disk, memory, backups |
| Privacy compliance (GDPR) | Resource consumption (PostHog: 8GB+ RAM) | Hardware cost can exceed SaaS at low traffic |
| No per-event SaaS costs | Data portability challenges | Platform lock-in risk |
| Custom analytics capabilities | Requires active maintenance and updates | Security patches and version upgrades |

---

## Performance Considerations

Plausible is lightweight (512MB RAM), PostHog is resource-intensive (8GB+ RAM recommended). The reverse proxy adds negligible latency (< 5ms) to tracking requests. Database growth causes query slowdowns over time — plan for partitioning or archival after 6-12 months. PostHog's session recording generates large amounts of data quickly — set recording limits and retention periods.

---

## Production Considerations

Keep the analytics server on an internal network accessible only through the reverse proxy. Use API keys or shared secrets between Laravel and the analytics platform. Ensure the analytics server receives only anonymized data. Restrict dashboard access to authenticated Laravel users via SSO or proxy authentication. Regularly update the analytics platform software for security patches.

---

## Common Mistakes

- **Direct Browser-to-Analytics Tracking:** Tracking snippet sends data directly to the analytics server URL — users see the URL, ad blockers block requests, the analytics server is exposed. Better: always proxy through a reverse proxy or Laravel application.
- **Underprovisioning Resources:** Running PostHog on a 1GB RAM server — runs out of memory within hours of enabling session recording. Better: check platform resource requirements before deploying.
- **No Backup Strategy:** Analytics data not backed up because "it's analytics, not production data" — months of irreplaceable business intelligence lost on disk failure. Better: include analytics databases in backup strategy.

---

## Failure Modes

- **Analytics Server Outage:** Self-hosted analytics server goes down — tracking requests fail either silently or with errors visible to users. Mitigation: proxy should degrade gracefully, queue events for later delivery.
- **Ad Blocker Blocking Direct URLs:** Direct analytics server URLs are blocked by client-side ad blockers — tracking data is lost. Mitigation: always use reverse proxy on the same domain.
- **Data Loss Without Audit:** Analytics database corruption or deletion without recent backup — irreplaceable historical data lost. Mitigation: automated daily backups with off-site storage.

---

## Ecosystem Usage

Laravel packages like `spatie/laravel-analytics` provide direct integration with Google Analytics but self-hosted platforms typically use their own SDKs or APIs. The reverse proxy pattern is commonly implemented as Laravel routes that forward to the analytics server. Community packages exist for Matomo PHP SDK integration. PostHog provides a first-party PHP SDK for server-side tracking.

---

## Related Knowledge Units

### Prerequisites
- Middleware Event Tracking — Where self-hosted analytics event capture integrates
- GDPR Compliance — Cookie-free analytics is default across all platforms

### Related Topics
- Star Schema — ClickHouse schema design for PostHog/Plausible queries
- ClickHouse MergeTree — ClickHouse engine configuration for analytics

### Advanced Follow-up Topics
- Multi-Region ClickHouse — Scaling self-hosted analytics across regions
- Warehouse Cost Optimization — Cost comparison: self-hosted vs cloud warehouse

---

## Research Notes

The GA4 migration was the primary catalyst for self-hosted analytics adoption. Plausible's cookieless, privacy-first approach became the de facto standard for GDPR compliance. PostHog's all-in-one product analytics model (events, feature flags, session recording) is gaining traction in product-driven organizations. The reverse proxy pattern is critical for both privacy (IP anonymization at proxy level) and reliability (bypassing ad blockers).
