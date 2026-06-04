# K27: Laravel Cloud vs Vapor Cost Comparison

## Metadata
- **ID**: K27
- **Subdomain**: Compute Optimization
- **Topic**: Laravel Cloud vs Vapor Cost
- **Source**: Laravel Blog (2026), Migration Case Studies
- **Reliability**: Medium

## Executive Summary
Laravel Cloud (Fargate-based) emerges as the default recommendation over Vapor (Lambda-based) for most production workloads in 2026. Real-world migrations show 30-50% cost reduction moving from Vapor to Cloud (PyleSoft: $11K→$5.5K; Trybe: ~40% at 500M requests/month; Superscript: 30%). Cloud's auto-hibernation and scale-to-zero make it competitive even for low-traffic apps at $5/month Starter plan.

## Core Concepts
- **Laravel Cloud**: Managed Fargate containers with auto-hibernation; $5/month Starter to custom enterprise
- **Laravel Vapor**: Lambda-based serverless; charges per-invocation regardless of traffic pattern
- **Vapor hidden cost**: Single HTTP request can count as 9+ Lambda invocations (Vapor architecture overhead)
- **Cloud advantage**: Fargate Spot available for workers; Vapor stuck with Lambda invocation pricing
- **Migration ROI**: Payback typically 3-6 months for apps spending >$1K/month on Vapor

## Mental Models
- **Vapor as taxi, Cloud as rental car**: Vapor charges per ride (invocation); Cloud charges per day with discounts for parking (hibernation)
- **The Laravel hosting trilemma**: Forge (EC2, DIY) vs Vapor (Lambda, serverless) vs Cloud (Fargate, managed)
- **Cloud as middle ground**: More control than Vapor, less management than Forge

## Internal Mechanics
Cloud runs on Fargate containers with auto-hibernation (scale to zero when idle) and automatic scaling based on traffic. Vapor runs on Lambda with API Gateway frontend. Cloud's Fargate model gives predictable per-container pricing; Vapor's Lambda model gives per-request pricing. Cloud supports Octane natively; Vapor requires PHP-FPM via Lambda.

## Patterns
- **Low traffic (<100K req/day)**: Cloud Starter ($5/mo) or Vapor — both cheap; Cloud simpler
- **Mid traffic (100K-5M req/day)**: Cloud wins on cost predictability and performance
- **High traffic (>5M req/day)**: Cloud or Forge+EC2 with Graviton and Savings Plans
- **Migration path**: Vapor→Cloud migration typically 1-4 weeks engineering effort

## Architectural Decisions
- Choose Cloud for new Laravel projects (as of 2026)
- Choose Vapor only if already deeply invested in Lambda architecture and traffic is very spiky
- Choose Forge+EC2 for maximum control and cost optimization at extreme scale (>$20K/month infra)
- Consider Private Cloud for workloads >$10K/month with dedicated resources

## Tradeoffs
- **Managed convenience vs vendor lock-in**: Cloud is easier but deep AWS customization may be limited
- **Scale-to-zero vs cold start**: Cloud auto-hibernation means potential 5-15s cold starts vs Vapor's 200ms-1s
- **Feature parity**: Vapor has longer feature history; Cloud catching up rapidly
- **Octane support**: Cloud native; Vapor requires workarounds

## Performance Considerations
- Test cold start times before committing Cloud to user-facing production (first request after hibernation)
- Cloud with Octane: warm requests are 3-10x faster than Vapor
- Monitor auto-hibernation intervals — too frequent hibernation can hurt UX for periodic users
- Cloud container memory: provision for Octane worker memory usage (50-100MB per idle worker)

## Production Considerations
- Validate case studies match your workload: PyleSoft (auction, variable), Trybe (high traffic), Superscript (Heroku migration)
- Watch Cloud Feature announcements: service is rapidly evolving (2025-2026)
- Deployment workflow: Cloud CLI vs Vapor CLI; similar but different commands
- Environment management: Cloud uses branches for PR preview deployments

## Common Mistakes
- Assuming Vapor's Lambda model is cheapest for all workloads (it's most expensive at sustained traffic)
- Not factoring Vapor's 9x invocation multiplier into cost estimates
- Ignoring Cloud's auto-hibernation for staging environments (near-zero cost)
- Migrating to Cloud without testing Octane compatibility of third-party packages

## Failure Modes
- Cloud's pricing model is newer and may change as product matures
- Migration cost from Vapor to Cloud ($2-10K engineering effort depending on complexity)
- Feature gaps: some Vapor-specific features (deploy hooks, env syncing) may not have Cloud equivalents
- Cold start SLA: not guaranteed; problematic for latency-sensitive apps

## Ecosystem Usage
- **Laravel Cloud**: Recommended for new projects and Vapor migrations
- **Laravel Vapor**: Legacy choice for existing Vapor deployments with spiky traffic
- **Laravel Forge**: For teams needing full control on EC2
- **Laravel Private Cloud**: Enterprise tier for compliance and dedicated capacity

## Related Knowledge Units
- K28: Vapor Lambda Invocation Multiplier
- K39: Filament Forge to Cloud
- K40: PyleSoft Cost Reduction
- K41: Trybe Cost Reduction
- K42: Superscript Heroku Migration

## Research Notes
Laravel Cloud launched in 2025 and rapidly became the default recommendation. The pricing model ($5/mo starter, auto-hibernation, Octane-native) directly addresses Vapor's pain points. Key insight: Cloud uses Fargate containers which provide predictable billing vs Lambda's per-invocation model. As of 2026, the Laravel team recommends Cloud for new projects. Vapor remains in maintenance mode with feature development focused on Cloud.
