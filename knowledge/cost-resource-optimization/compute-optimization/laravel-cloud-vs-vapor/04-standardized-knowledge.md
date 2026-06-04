# Laravel Cloud vs Vapor Cost Comparison

## Metadata
- **ID**: KU-27-CLOUD-VS-VAPOR
- **Subdomain**: compute-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Laravel Cloud vs Vapor Cost Comparison
- **Version**: 1.0
- **Classification**: Emerging
- **Maturity**: Medium

## Overview
Laravel Cloud (Fargate-based) emerges as the default recommendation over Vapor (Lambda-based) for most production workloads in 2026. Real-world migrations show 30-50% cost reduction moving from Vapor to Cloud (PyleSoft: $11K→$5.5K; Trybe: ~40% at 500M requests/month; Superscript: 30%). Cloud's auto-hibernation and scale-to-zero make it competitive even for low-traffic apps at $5/month Starter plan.

## Core Concepts
- **Laravel Cloud**: Managed Fargate containers with auto-hibernation; $5/month Starter to custom enterprise
- **Laravel Vapor**: Lambda-based serverless; charges per-invocation regardless of traffic pattern
- **Vapor hidden cost**: Single HTTP request can count as 9+ Lambda invocations (Vapor architecture overhead)
- **Cloud advantage**: Fargate Spot available for workers; Vapor stuck with Lambda invocation pricing
- **Migration ROI**: Payback typically 3-6 months for apps spending >$1K/month on Vapor
- **The Laravel hosting trilemma**: Forge (EC2, DIY) vs Vapor (Lambda, serverless) vs Cloud (Fargate, managed)

## When To Use
- New Laravel projects: Cloud is the default recommendation for 2026
- Existing Vapor deployments spending >$1K/month: model Cloud migration for 30-50% savings
- Low traffic (<100K req/day): Cloud Starter ($5/mo) simpler than Vapor
- Mid traffic (100K-5M req/day): Cloud wins on cost predictability and Octane performance
- High traffic (>5M req/day): Cloud or Forge+EC2 with Graviton and Savings Plans

## When NOT To Use
- Deeply invested in Lambda architecture with very spiky traffic (Vapor may still be competitive)
- Maximum control and cost optimization at extreme scale (>$20K/month infra) — Forge+EC2 wins
- Workloads requiring Vapor-specific features not yet available in Cloud (deploy hooks, env syncing)
- Apps with strict cold start SLA that Cloud's auto-hibernation cannot guarantee
- Teams without capacity to test Octane compatibility of third-party packages

## Best Practices
- **Model TCO, not just compute cost**: Include Cloud's platform margin vs Vapor's Lambda + hidden costs (WHY: Vapor's apparent Lambda cost is only part of the bill; include API Gateway, CloudFront, and 9x invocation multiplier; Cloud bundles infra into container pricing; raw compute comparison understates Vapor's total cost)
- **Test Octane on existing Forge/EC2 before Cloud migration**: Validates throughput gains independently (WHY: Cloud's cost advantage partly comes from Octane; if your app doesn't benefit from Octane, Cloud vs Vapor math changes; isolate variables: test Octane first, then migrate platform)
- **Use Cloud auto-hibernation for staging environments**: Near-zero cost for non-production (WHY: Cloud containers hibernate when idle; staging environment used 8h/day costs ~1/3 of always-on; can save $50-200/month per environment)
- **Configure Cloud spending limits before production**: Set hard monthly ceilings at 50/75/90% alerts (WHY: Cloud's auto-scaling can increase spend during traffic spikes; spending limits prevent surprise bills; alerts give time to react before hitting ceiling)
- **Validate migration case studies against your workload pattern**: PyleSoft (auction, variable) vs Trybe (high traffic) vs Superscript (Heroku migration) have different profiles (WHY: each case study has different traffic patterns and savings drivers; match your workload to the closest study for realistic projections)

## Architecture Guidelines
- Cloud for new projects and Vapor migrations (recommended by Laravel team 2026)
- Vapor only for existing deep Lambda investments with spiky traffic
- Forge+EC2 for maximum control at extreme scale (>$20K/month)
- Private Cloud for enterprise compliance and dedicated capacity
- Migration path: Vapor→Cloud typically 1-4 weeks engineering effort

## Performance Considerations
- Cloud cold start after auto-hibernation: 5-15 seconds (first request) vs Vapor: 200-1000ms
- Octane on Cloud: warm requests are 3-10x faster than Vapor's PHP-FPM on Lambda
- Cloud container memory should account for Octane worker overhead (50-100MB per idle worker)
- Monitor auto-hibernation frequency: too-frequent hibernation hurts UX for periodic users
- Cloud's auto-scaling adds containers in 30-120 seconds during traffic spikes

## Security Considerations
- Cloud runs on AWS Fargate with AWS-managed infrastructure isolation
- Vapor runs on Lambda with Lambda's security boundary; each invocation isolated
- Both support custom domains with SSL/TLS and CloudFront CDN
- Cloud IAM roles for deployment: least-privilege recommended
- Cloud environment variables encrypted at rest; Vapor uses Lambda environment variables

## Common Mistakes
1. **Assuming Vapor's Lambda model is cheapest for all workloads**: Lambda's per-request model is most expensive at sustained traffic (Cause: "serverless is cheaper" marketing; Consequence: traffic grows, Vapor bill grows linearly with no volume discount; Better: model Lambda cost at your projected peak traffic, not current)
2. **Not factoring Vapor's 9x invocation multiplier**: Architecture overhead makes each HTTP request cost 9+ Lambda invocations (Cause: Vapor uses multiple Lambda functions per request: routing, PHP-FPM, asset serving; Consequence: effective cost is 9x published Lambda rates; Better: use Vapor's cost monitoring to see actual per-request cost)
3. **Ignoring Cloud's auto-hibernation for staging**: Running staging environments 24/7 on Cloud (Cause: assuming Cloud containers are always-on like EC2; Consequence: paying for 24/7 compute when staging is only used 8h/day; Better: Cloud auto-hibernation scales staging to zero when idle)
4. **Not testing Octane compatibility before migration**: Third-party packages with global state break on Octane (Cause: Octane shares state across requests; packages assume request-scoped state; Consequence: migration fails, rollback to Vapor, lost engineering time; Better: test all critical packages on Octane before committing to Cloud)

## Anti-Patterns
- **Cloud for everything**: Using Cloud for batch processing that would be cheaper on Fargate Spot
- **Vapor lock-in without review**: Staying on Vapor without annual cost comparison
- **Rip-and-replace Vapor simultaneous migration**: Moving all apps to Cloud in one sprint
- **Ignoring Forge for commodity workloads**: For simple PHP apps under low traffic, Forge on t4g.nano ($5/month) beats both

## Examples
- **Low traffic ($5/month)**: Cloud Starter plan, auto-hibernation, 1 container, Octane, 20K req/day
- **Mid traffic ($200/month)**: Cloud Growth plan, 2-5 containers, auto-scaling, 500K req/day, Octane
- **High traffic ($2,000/month)**: Cloud Scale plan, 10-20 containers, auto-scaling, 5M req/day, Octane, Redis
- **Vapor equivalent ($3,500/month)**: Same traffic on Vapor, 9x invocation multiplier, API Gateway costs, $1,500 more

## Related Topics
- Vapor Lambda Invocation Cost (ku-28)
- Filament Forge to Cloud (ku-39)
- PyleSoft Cost Reduction (ku-40)
- Trybe Cost Reduction (ku-41)
- Superscript Heroku Migration (ku-42)

## AI Agent Notes
- Default: Cloud for new projects and Vapor migrations
- Validate Octane compatibility before Cloud migration
- Model TCO including Vapor's 9x invocation multiplier
- Use Cloud auto-hibernation for non-production environments
- Migration payback is typically 3-6 months for >$1K/month Vapor spend
