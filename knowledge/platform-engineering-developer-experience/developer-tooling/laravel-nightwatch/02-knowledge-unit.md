# Knowledge Unit: Laravel Nightwatch

## Metadata
- **Subdomain:** Developer Tooling & Debugging
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** developer-tooling-debugging/laravel-nightwatch
- **Maturity:** Mature
- **Related Technologies:** Laravel Nightwatch, PHP, Laravel, APM, Production Monitoring

## Executive Summary

Laravel Nightwatch is Laravel's official production Application Performance Monitoring (APM) service, providing real-time and historical performance data for Laravel applications. It captures: request throughput and latency, database query performance, queued job execution, cache operation metrics, HTTP client call timings, and exception tracking. Nightwatch integrates as a Laravel service provider that collects performance data during request execution and reports it to the Nightwatch dashboard. Unlike Telescope (local debugging) or Pulse (live dashboard), Nightwatch is designed for long-term production monitoring with metrics retention, trend analysis, and alerting. It's a commercial service by the Laravel team, available as a paid add-on for Laravel Cloud and standalone for self-hosted applications.

## Core Concepts

- **APM (Application Performance Monitoring):** Continuous monitoring of application performance metrics (response time, throughput, error rates) with historical data retention
- **Request Tracing:** Captures the full lifecycle of each request—middleware, controller, queries, views, responses—with timing breakdowns
- **Transaction Segmentation:** Groups related requests by route name, queue job class, or scheduled command for aggregate performance analysis
- **Query Performance:** Tracks slow queries, N+1 patterns, and query volume per route to identify database bottlenecks
- **Deployment Tracking:** Correlates performance changes with deployments to identify regressions introduced by code changes
- **Alerting:** Configurable alerts based on performance thresholds (p95 response time > 500ms, error rate > 1%, slow query count > 10/minute)

## Mental Models

- **Nightwatch as Production Telescope:** Where Telescope is for local debugging of individual requests, Nightwatch is for production monitoring of aggregate performance trends
- **Nightwatch as Performance Historian:** Nightwatch keeps performance data over time, enabling trend analysis and capacity planning—like a historian tracking measurements over days and weeks
- **Nightwatch as Deployment Quality Gate:** By correlating performance changes with deployments, Nightwatch acts as a quality gate that detects performance regressions automatically

## Internal Mechanics

1. **Data Collection:** NightwatchServiceProvider registers middleware and event listeners that capture request timing, query data, cache operations, and exceptions
2. **Sampling Strategy:** In high-traffic environments, Nightwatch uses adaptive sampling (capture N requests per minute) to balance data completeness with overhead
3. **Data Transmission:** Collected data is batched and sent to the Nightwatch API asynchronously via queued HTTP calls, ensuring minimal impact on the request
4. **Dashboard Rendering:** The Nightwatch web dashboard queries the stored data for visualization: response time charts, route breakdowns, query analysis, and deployment markers
5. **Alert Evaluation:** Configurable alert rules are evaluated against incoming data; threshold violations trigger notifications (email, Slack, webhook)
6. **Retention Management:** Nightwatch manages data retention per plan (7-90 days typically); older data is archived or purged based on retention policy

## Patterns

- **Deployment Correlation Pattern:** Tag deployments in Nightwatch to correlate performance changes with releases. If p95 response time increases after deployment, roll back or investigate.
- **Slow Query Detection Pattern:** Use Nightwatch's query analysis to identify slow queries (>100ms), high-frequency queries (N+1), and queries affecting page load time most.
- **Route-Based Optimization Pattern:** Sort routes by total time spent (throughput × average duration) to identify endpoints that deliver the most performance value when optimized.
- **Queue Job Monitoring Pattern:** Monitor queue job duration, failure rates, and throughput to identify backlog issues or noisy jobs that consume disproportionate resources.
- **Alert-Based Response Pattern:** Set alerts for critical thresholds: p95 response time > 1s, error rate > 1%, queue backlog > 1000. Respond proactively before users are affected.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Sampling rate | 100% vs adaptive vs custom percentage | Adaptive (default) for most; 100% for low-traffic apps; custom for budget compliance |
| Data retention | 7 days vs 30 days vs 90 days | 30 days minimum for trend analysis; 90 days for compliance/capacity planning |
| Alerting channels | Email vs Slack vs webhook vs PagerDuty | Slack for team notifications; PagerDuty for on-call escalation |
| Deployment integration | Manual tags vs CI integration vs webhook | CI integration for automatic deployment markers |

## Tradeoffs

- **Nightwatch vs Pulse:** Pulse provides a live dashboard on your own server with no data retention (real-time only). Nightwatch provides historical data, alerts, and advanced analytics but is a paid service. Use Pulse for quick local monitoring; Nightwatch for production observability.
- **Nightwatch vs Telescope:** Telescope is a debugging tool for development (captures all request details). Nightwatch is a monitoring tool for production (aggregated metrics, not full request dumps). Both serve different stages of the development lifecycle.
- **Sampling vs Full Capture:** Sampling reduces overhead on high-traffic applications but may miss sporadic issues (occasional slow requests, rare errors). Full capture catches everything but adds more overhead.

## Performance Considerations

- **Collection Overhead:** Nightwatch adds 5-15ms per request for data capture and formatting. This is lower than Debugbar (which is development-only) due to optimized collection code and no stack trace generation.
- **Transmission Overhead:** Data is batched and sent asynchronously via queued HTTP calls. The queue worker handles transmission, removing latency from the request path.
- **Memory Impact:** Nightwatch accumulates data during the request; peak memory impact is ~1-2MB per request. This is negligible for standard Laravel applications.
- **Adaptive Sampling:** In high-traffic environments, Nightwatch samples only a percentage of requests (e.g., 10% of traffic), reducing collection overhead proportionally.

## Production Considerations

- **Subscription Required:** Nightwatch is a paid service from the Laravel team. Budget for the subscription cost. Evaluate against self-hosted alternatives (Pulse + custom monitoring).
- **Data Residency:** Nightwatch sends performance data to Laravel's servers. Consider data residency requirements if your application handles sensitive data (PII, financial, healthcare).
- **Network Egress:** Nightwatch sends data to an external API. For applications in restricted networks (VPN, private subnets), ensure egress access to the Nightwatch API endpoint.
- **Deployment Tagging:** Maximize Nightwatch value by integrating deployment tagging into CI/CD—tagging each deployment enables performance correlation and rollback decision support.

## Common Mistakes

- **Using Nightwatch without Pulse locally:** Relying on Nightwatch for local debugging—Nightwatch is designed for production monitoring; use Telescope/Debugbar for local development
- **Not setting up alerting:** Enabling Nightwatch but not configuring alerts for threshold violations; you get a dashboard but no proactive notifications
- **Sampling too aggressively:** Setting sampling too low (e.g., 1%) on low-traffic apps; critical performance issues may not be captured
- **Ignoring deployment correlation:** Deploying without tagging releases in Nightwatch; performance changes can't be correlated with specific deployments
- **Not integrating with team workflows:** Nightwatch alerts go to individual emails instead of team channels or incident management tools

## Failure Modes

- **Data Loss on Rate Limit:** Exceeding the plan's data ingestion limit causes data loss without notification. Mitigate: monitor ingestion volume; upgrade plan proactively.
- **High Sampling Misses Sporadic Issues:** Random sampling misses rare slow requests that affect 0.1% of traffic. Mitigate: increase sampling for critical routes.
- **Network Outage Blocks Data Transmission:** Nightwatch cannot send data during network outages. Mitigate: queue backlog handles temporary disconnections; long outages cause data loss.
- **Alert Fatigue:** Too many alerts desensitize the team. Mitigate: tune thresholds carefully; use severity levels (warning vs critical); aggregate related alerts.

## Ecosystem Usage

- **Laravel Cloud:** Nightwatch is integrated as the default monitoring solution for Laravel Cloud deployments
- **Laravel Teams:** Product teams use Nightwatch for production observability, especially those already in the Laravel ecosystem (no additional monitoring service to learn)
- **Laravel Forge + Nightwatch:** Forge-managed servers can be configured with Nightwatch for performance monitoring alongside Forge's server monitoring
- **Laravel Vapor:** Vapor applications can be configured with Nightwatch for serverless application performance monitoring

## Related Knowledge Units

- laravel-pulse
- laravel-telescope
- debugbar-collectors-profiling
- log-viewer-debugging-patterns

## Research Notes

- Laravel Nightwatch was announced in 2023 as Laravel's official APM solution, built by the Laravel team
- Nightwatch uses a proprietary agent installed via Composer that communicates with Laravel's Nightwatch API
- The service is designed to complement Laravel Pulse (real-time dashboard) and Laravel Telescope (local debugging) in the Laravel observability stack
- Nightwatch pricing is based on monthly request volume, with plans ranging from small (millions of requests/month) to enterprise (billions of requests/month)
