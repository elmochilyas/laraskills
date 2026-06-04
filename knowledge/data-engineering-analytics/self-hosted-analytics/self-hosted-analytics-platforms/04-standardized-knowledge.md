# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 02-self-hosted-analytics
**Knowledge Unit:** self-hosted-analytics-platforms
**Difficulty:** Foundation
**Category:** Analytics Infrastructure
**Last Updated:** 2026-06-03

---

# Overview

The deprecation of Universal Analytics and forced migration to GA4 drove massive churn toward self-hosted analytics platforms. Laravel applications now commonly integrate with one of three major platforms: **Plausible** (privacy-first, simplicity-obsessed), **Matomo** (full GA4 replacement with enterprise features), or **PostHog** (product analytics with session recording and feature flags).

Each platform has a fundamentally different integration pattern. Plausible uses a lightweight JavaScript snippet with an optional reverse proxy for self-hosting. Matomo offers a full PHP SDK that integrates directly with Laravel. PostHog provides a REST API, client-side JavaScript library, and server-side SDK with feature flag evaluation.

Engineers must care because the choice of analytics platform determines data ownership, privacy compliance, operational cost, and analytical capabilities. The self-hosted approach gives full data control but requires infrastructure management. The integration pattern — proxy vs direct API vs SDK — determines reliability, performance, and feature access.

---

# Core Concepts

## Plausible

Plausible is a lightweight, privacy-first analytics platform focused on simplicity. It uses cookieless tracking, IP anonymization by default, and provides a clean dashboard with essential metrics (page views, unique visitors, bounce rate, visit duration). Self-hosting requires running the Plausible application (Elixir) and a PostgreSQL database, optionally fronted by a reverse proxy for tracking requests.

## Matomo

Matomo (formerly Piwik) is a full-featured analytics platform that can serve as a GA4 replacement. It supports heatmaps, session recordings, A/B testing, SEO reporting, funnel analysis, and custom dimensions. Matomo provides a PHP SDK (`matomo/matomo-php-tracker`) that integrates directly with Laravel, sending tracking requests via HTTP to the Matomo instance.

## PostHog

PostHog is a product analytics platform that combines event tracking, feature flags, session recording, and experimentation. It provides a JavaScript library for client-side tracking, a Python SDK for server-side, and a REST API. PostHog's value proposition is all-in-one product analytics without third-party data sharing.

## Reverse Proxy Pattern

For Plausible and Matomo, the recommended integration pattern is a reverse proxy: the Laravel application proxies tracking requests to the analytics server, masking the analytics server URL and bypassing ad blockers. Nginx or Caddy handles the proxying, keeping the analytics server internal.

---

# When To Use

- Applications serving EU users (GDPR compliance through data ownership)
- Products that cannot share data with third-party analytics providers
- Applications requiring custom analytics beyond what GA4 or SaaS platforms provide
- High-traffic applications where per-event SaaS costs exceed self-hosting costs
- Compliance-sensitive industries (healthcare, finance, education)
- Products needing session recording or product analytics (PostHog)

---

# When NOT To Use

- Small applications with low traffic (SaaS analytics is cheaper and simpler)
- Teams without infrastructure management capacity
- Applications that need zero maintenance analytics
- Rapid prototyping where analytics infrastructure is premature
- Products that specifically require Google Analytics integration (use GA4 directly)

---

# Best Practices

## Use Reverse Proxy for Tracking Endpoints

Always proxy analytics tracking requests through the Laravel application or a reverse proxy. This prevents ad blockers from blocking analytics, enables server-side event enrichment, and keeps the analytics server URL internal.

## Separate Analytics Database from Application Database

The analytics platform database (PostgreSQL for Plausible, MySQL for Matomo, ClickHouse for PostHog) should run on separate infrastructure from the Laravel application database. Analytics workloads have different I/O patterns and resource requirements.

## Monitor Self-Hosted Infrastructure

Self-hosted analytics platforms require active monitoring: disk space (event data grows fast), memory usage, query performance, and backup status. Set up alerts for these metrics.

## Plan for Data Migration

Self-hosted analytics platforms do not have built-in data portability. Before committing to a platform, verify that data export capabilities meet your requirements. Consider a parallel run period during migration.

---

# Architecture Guidelines

## Deployment Options

- **Docker Compose:** Simplest deployment for all three platforms. Suitable for single-server setups.
- **Kubernetes:** Required for high-availability PostHog and Matomo deployments.
- **Managed hosting:** Plausible offers managed hosting; Matomo has Matomo Cloud; PostHog has PostHog Cloud. Self-hosting is the focus.

## Integration Architecture

Laravel Application → Reverse Proxy (Nginx/Caddy) → Analytics Platform

The reverse proxy handles tracking requests. The Laravel application handles dashboard access (embedding analytics dashboards or iframing them).

## Data Flow

User Browser → Tracking Snippet → Reverse Proxy → Analytics Server → Database

The tracking snippet sends data through the reverse proxy, which adds server-side context (IP, user agent) before forwarding to the analytics server.

---

# Performance Considerations

- Self-hosted analytics platforms consume significant server resources: Plausible is lightweight (512MB RAM), PostHog is resource-intensive (8GB+ RAM recommended).
- Reverse proxy adds negligible latency (< 5ms) to tracking requests.
- Database growth can cause query slowdowns over time. Plan for partitioning or archival after 6-12 months.
- PostHog's session recording generates large amounts of data quickly. Set recording limits and retention periods.

---

# Security Considerations

- Keep the analytics server on an internal network, accessible only through the reverse proxy.
- Use API keys or shared secrets between the Laravel application and analytics platform.
- Ensure the analytics server receives only anonymized data from the proxy.
- Restrict dashboard access to authenticated Laravel users via SSO or proxy authentication.
- Regularly update the analytics platform software to patch security vulnerabilities.

---

# Common Mistakes

## Mistake: Direct Browser-to-Analytics Tracking

The tracking snippet sends data directly to the analytics server URL. Users can see the analytics server URL, ad blockers block the requests, and the analytics server is exposed to the internet.

**Better approach:** Always proxy tracking requests through a reverse proxy or the Laravel application.

## Mistake: Underprovisioning Resources

Running PostHog on a 1GB RAM server. The server runs out of memory within hours of enabling session recording. Analytics data is lost, and the server becomes unresponsive.

**Better approach:** Check platform resource requirements before deploying. PostHog requires 8GB+ RAM for production use.

## Mistake: No Backup Strategy

Analytics data is not backed up because "it's analytics, not production data." Months of analytics data are lost when the analytics server disk fails.

**Better approach:** Include analytics databases in the backup strategy. Analytics data is often irreplaceable business intelligence.

---

# Anti-Patterns

## Using Self-Hosted Analytics as a Primary Database

Treating the analytics platform database as a queryable data source for application logic. Analytics databases are optimized for aggregation queries, not for individual record lookups.

**Solution:** Keep analytics data in the analytics platform. Export aggregated results to the application database if needed for in-app display.

## Forking and Customizing the Analytics Platform

Modifying the self-hosted analytics platform source code to add custom features. This creates a maintenance nightmare when upstream updates are released.

**Solution:** Use the platform's API and plugin system for customizations. If the platform cannot meet requirements, consider a different platform.

---

# Examples

## Reverse Proxy Configuration (Nginx)

```nginx
server {
    listen 443 ssl;
    server_name analytics.example.com;

    location / {
        proxy_pass http://plausible:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Plausible Proxy for Laravel

```php
// In routes/web.php
Route::get('js/script.js', function (Request $request) {
    $response = Http::get('http://plausible:8000/js/script.js');
    return response($response->body(), 200, ['Content-Type' => 'application/javascript']);
});

Route::post('api/event', function (Request $request) {
    $response = Http::post('http://plausible:8000/api/event', [
        'name' => $request->input('name'),
        'url' => $request->input('url'),
        'domain' => $request->input('domain'),
    ]);
    return response('', 202);
});
```

---

# Related Topics

**Prerequisites:**
- Middleware Event Tracking — Where self-hosted analytics event capture integrates
- GDPR Compliance — Cookie-free analytics is default across all platforms

**Closely Related:**
- Star Schema — ClickHouse schema design for PostHog/Plausible queries
- ClickHouse MergeTree — ClickHouse engine configuration for analytics

**Advanced Follow-Up:**
- Multi-Region ClickHouse — Scaling self-hosted analytics across regions
- Warehouse Cost Optimization — Cost comparison: self-hosted vs cloud warehouse

**Cross-Domain Connections:**
- DevOps & Infrastructure — Infrastructure management for self-hosted platforms
