# K28: Vapor Lambda Invocation Multiplier

## Metadata
- **ID**: K28
- **Subdomain**: Compute Optimization
- **Topic**: Vapor Lambda Invocation Cost
- **Source**: Laravel Blog (Trybe), Industry Analysis
- **Reliability**: Medium

## Executive Summary
A single HTTP request via Laravel Vapor can count as 9+ Lambda invocations due to Vapor's architectural layers: request handling, PHP-FPM bridge, worker processes, and auxiliary functions. This multiplier effect means Vapor's effective cost per request is significantly higher than raw Lambda pricing suggests. Understanding this multiplier is critical when comparing Vapor against Cloud (Fargate) or Forge (EC2).

## Core Concepts
- **Multiplier source**: Vapor uses multiple Lambda functions per HTTP request (router Ã¢â€ â€™ PHP-FPM bridge Ã¢â€ â€™ application Ã¢â€ â€™ workers Ã¢â€ â€™ response)
- **9x estimate**: Each HTTP request triggers ~9+ Lambda invocations including: front controller, php-fpm bridge, queue worker polling, deployment hooks
- **Impact**: Effectively multiplies Lambda cost by 9x vs running the same workload directly on Lambda via Bref
- **Hidden costs**: Vapor's scheduled tasks, queue workers, and deployment scripts run as additional Lambda functions

## Mental Models
- **Vapor convenience tax**: The 9x multiplier is the price for Vapor's managed abstraction
- **Iceberg**: Visible Lambda cost is the tip; hidden multiplier is below the waterline
- **Vapor as middleware-heavy**: Every layer between request and response adds Lambda invocations

## Internal Mechanics
Vapor architecture: Client Ã¢â€ â€™ CloudFront Ã¢â€ â€™ API Gateway Ã¢â€ â€™ Vapor Router Lambda Ã¢â€ â€™ PHP-FPM Bridge Lambda Ã¢â€ â€™ Application Lambda. Each hop = 1 Lambda invocation. Additionally: deploy scripts, CRON replacements, queue workers are separate Lambda functions. The multiplier compounds: 1 HTTP request = 2-3 synchronous Lambda invocations + background worker invocations for queues/mail.

## Patterns
- **Direct Lambda (Bref)**: 1 invocation per HTTP request (no multiplier); less managed but more cost-effective
- **Vapor vs Bref cost**: Vapor can be 3-9x more expensive for the same workload on Lambda
- **Scale impact**: At low volume (<1M req/month), multiplier is negligible; at high volume, becomes dominant cost driver

## Architectural Decisions
- Use Vapor only if the managed deployment experience justifies the premium
- Consider Bref + custom deployment for Lambda-native Laravel at scale
- Consider Cloud (Fargate) for medium-to-high volume: no invocation multiplier, flat container pricing

## Tradeoffs
- **Convenience (Vapor) vs cost (direct Lambda)**: Vapor's multiplier is the price of managed deployment
- **Vapor ecosystem features vs raw Lambda flexibility**: Vapor provides env management, deployment, monitoring; direct Lambda requires building these
- **PHP-FPM vs Octane**: Vapor uses PHP-FPM on Lambda; limited Octane support

## Production Considerations
- Measure actual Lambda invocation count in Vapor vs expected HTTP requests to determine your multiplier
- Use Vapor's cost dashboard to track per-request cost
- Factor multiplier into any Vapor vs Cloud vs Forge cost comparison
- Monitor per-request cost trending as traffic patterns change

## Common Mistakes
- Estimating Vapor cost using raw Lambda pricing without multiplier
- Not monitoring per-request cost over time as traffic patterns change
- Assuming Vapor's invocation count matches request count
- Comparing Vapor cost to Fargate without factoring the multiplier

## Failure Modes
- Cost shock at scale: multiplier makes Vapor uneconomical for high-traffic apps (see Trybe: 40% savings moving to Cloud)
- Debugging difficulty: 9x invocations make it hard to trace cost to specific features

## Ecosystem Usage

- **Laravel Cloud**: Fargate-based with auto-hibernation; ideal for low-traffic applications\n- **Laravel Forge**: EC2 and VPS management with Graviton support via t4g instances\n- **Laravel Vapor**: Lambda-based deployment; each HTTP request generates 9+ Lambda invocations\n- **Bref PHP runtime**: Open-source PHP on Lambda for custom Laravel deployments

## Performance Considerations

- Graviton3/4: 30-40% better performance than Graviton2 at same vCPU count\n- Fargate tasks: 30-120s startup time (image pull + init); use smaller images and eager pull\n- Lambda: memory allocation directly impacts CPU; 1769MB = 1 full vCPU\n- EC2: dedicated instances (no noise neighbors) vs default (shared) for consistent performance

## Related Knowledge Units
- K27: Laravel Cloud vs Vapor
- K22: Lambda Pricing Breakdown
- K23: Lambda vs EC2 Breakeven
- K41: Trybe Cost Reduction

## Research Notes
The 9x multiplier estimate comes from Trybe's migration case study (Laravel Blog, May 2026). Exact multiplier varies by application architecture. Queue-heavy apps see higher multipliers due to Lambda-based workers. API-heavy apps may see lower multiples (~4-5x) if workers are minimal. The multiplier is the primary reason Vapor becomes uneconomical above ~20M requests/month.
