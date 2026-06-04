# 04-Standardized Knowledge: Laravel Nightwatch

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | developer-tooling-debugging |
| **Knowledge Unit** | laravel-nightwatch |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-pulse, laravel-telescope, debugbar-collectors-profiling |
| **Framework/Language** | Laravel Nightwatch, PHP, Laravel, APM |

## Overview

Laravel Nightwatch is Laravel's official production APM service providing real-time/historical performance data. Captures: request throughput/latency, DB query performance, queued job execution, cache metrics, HTTP client timings, and exceptions. Integrates as a service provider collecting performance data and reporting to Nightwatch dashboard. Designed for long-term production monitoring with metrics retention, trend analysis, and alerting. Commercial service by Laravel team.

## Core Concepts

- **APM**: continuous performance monitoring (response time, throughput, error rates) with historical retention
- **Request Tracing**: full lifecycle capture — middleware, controller, queries, views, responses
- **Transaction Segmentation**: grouping by route name, queue job class, or scheduled command
- **Query Performance**: slow queries, N+1 patterns, query volume per route
- **Deployment Tracking**: correlation of performance changes with deployments
- **Alerting**: configurable thresholds (p95 > 500ms, error rate > 1%)

## When to Use

- Production Laravel applications requiring APM
- Teams wanting deployment-performance correlation
- Applications needing alerting on performance degradation
- Long-term trend analysis and capacity planning

## When NOT to Use

- Local development (use Telescope/Debugbar)
- Applications on a tight budget (Nightwatch is a paid service)
- Simple applications where Pulse + basic monitoring suffices
- Environments with data residency restrictions on external services

## Best Practices (WHY)

- **Integrate deployment tagging in CI**: correlate performance changes with specific releases
- **Set alert thresholds**: p95 response time, error rate, queue backlog — proactive notifications
- **Use adaptive sampling**: default setting balances data completeness with overhead
- **Route-based optimization**: sort routes by total time (throughput × avg duration) for maximum impact
- **Complement with Pulse**: use Pulse for live dashboard, Nightwatch for historical analysis

## Architecture Guidelines

- Deploy alongside Laravel Pulse for comprehensive observability
- Tag every deployment in CI/CD for performance correlation
- Configure sampling per environment/critical route
- Set severity levels for alerts (warning vs critical) to avoid alert fatigue

## Performance Considerations

- Collection overhead: 5-15ms per request (optimized, no stack traces)
- Data transmission: batched, async via queued HTTP calls — no request latency impact
- Memory: ~1-2MB per request peak
- Adaptive sampling reduces overhead proportionally in high-traffic environments

## Security Considerations

- Paid service — budget for subscription cost
- Data residency: Nightwatch sends performance data to Laravel's servers
- Ensure network egress access to Nightwatch API in restricted networks
- Route names may contain identifiers; query texts may contain data

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| Using Nightwatch for local debugging | Designed for production | Inefficient workflow | Use Telescope/Debugbar locally |
| No alerting configured | Dashboard only, no proactive notifications | Missed incidents | Configure threshold alerts |
| Overly aggressive sampling | 1% on low-traffic apps | Critical issues missed | Adaptive sampling (default) |
| No deployment tagging | Changes can't be correlated | Missed regression detection | Integrate in CI/CD |

## Anti-Patterns

- **Skipping Pulse**: Nightwatch without Pulse means no live dashboard on your own infrastructure
- **Alert fatigue**: too many alerts with low thresholds desensitize the team

## Examples

```php
// config/nightwatch.php
return [
    'sampling' => env('NIGHTWATCH_SAMPLING', 'adaptive'),
    'deployment' => env('NIGHTWATCH_DEPLOYMENT'),
];
```

## Related Topics

- laravel-pulse — real-time dashboard (complementary)
- laravel-telescope — local debugging tool
- debugbar-collectors-profiling — development profiling

## AI Agent Notes

- Nightwatch is a paid service; suggest Pulse as free alternative when appropriate
- Do not configure Nightwatch in CI or local environments

## Verification

- [ ] Nightwatch subscription active
- [ ] Deployment tagging integrated in CI/CD
- [ ] Alert thresholds configured
- [ ] Sampling strategy set appropriately
- [ ] Network egress allowed to Nightwatch API
