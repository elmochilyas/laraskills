# Superscript 30% Cost Savings (Heroku to Cloud)

## Metadata
- **ID**: KU-42-SUPERSCRIPT-MIGRATION
- **Subdomain**: compute-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Superscript Heroku Migration
- **Version**: 1.0
- **Classification**: Speculative
- **Maturity**: Medium

## Overview
Superscript achieved 30% cost savings migrating from Heroku to Laravel Private Cloud. Heroku's premium pricing for managed PostgreSQL and dyno hours was replaced by Cloud's Fargate containers with Neon PostgreSQL. The migration also improved performance via Octane and reduced operational complexity. This case study validates that non-AWS-to-AWS migrations can yield significant savings when leveraging modern hosting platforms.

## Core Concepts
- **Migration path**: Heroku → Laravel Private Cloud
- **30% savings**: Driven by container vs dyno pricing and database cost reduction
- **Database change**: Heroku Postgres → Neon serverless PostgreSQL (sub-1s cold starts, generous free tier)
- **Runtime change**: PHP-FPM on Heroku → Octane on Cloud
- **Heroku premium**: Heroku's convenience markup became uneconomical at scale post-Salesforce acquisition
- **Private Cloud**: Dedicated K8s cluster with VPC peering, higher cost than standard Cloud but more control

## When To Use
- Existing Heroku deployments >$3K/month (migration payback typically 3-6 months)
- Heroku users evaluating exit strategies post-Salesforce acquisition pricing changes
- Teams wanting to consolidate from Heroku to Laravel-native platform
- Applications where Heroku dyno pricing no longer scales economically
- Proof-of-concept for Heroku → Cloud migration business case

## When NOT To Use
- Small Heroku apps <$500/month (migration effort exceeds savings)
- Heroku apps deeply integrated with Heroku add-ons (Redis, Memcached, workers)
- Teams without AWS experience (Cloud runs on AWS; some AWS knowledge needed)
- Temporary/short-lived projects where migration payback exceeds project lifespan
- Workloads where Heroku's zero-ops model is valued more than cost savings

## Best Practices
- **Model total Heroku cost, not just dyno pricing**: Heroku Postgres, Redis, worker dynos, and add-ons inflate total (WHY: Heroku's database pricing is particularly expensive compared to Neon/RDS; add-on costs for Redis, SSL, monitoring add 20-40% to bill; Cloud bundles or provides cheaper alternatives for all)
- **Use Neon as default database for Cloud migrations from Heroku**: Neon provides similar DX with much lower cost (WHY: Heroku Postgres charges $50-200/month for managed PG; Neon's free tier covers small apps, paid from $0.106/CU-hour; sub-1s cold starts match Heroku's instant-on experience)
- **Validate Octane compatibility pre-migration**: Heroku runs PHP-FPM; Cloud uses Octane by default (WHY: Octane incompatibility would reduce Cloud's performance advantage; test on Heroku with a staging app or local FrankenPHP before committing to migration timeline)
- **Plan for 3-6 month payback**: Include engineering time, parallel-run costs, and migration tooling (WHY: Superscript reported 30% savings but doesn't detail migration effort; typical Heroku → Cloud migration takes 2-4 weeks engineering time; model total TCO including this cost)
- **Maintain Heroku deployment during cutover**: Run in parallel for 1-2 weeks, route percentage of traffic (WHY: allows rollback if issues arise; Cloud configuration may need tuning; gradual cutover reduces risk; DNS changes and SSL certificate propagation take 1-2 days)

## Architecture Guidelines
- Private Cloud for >$10K/month Heroku spend with compliance requirements
- Standard Cloud for <$10K/month Heroku spend without compliance needs
- Neon PostgreSQL as Heroku Postgres replacement (same PostgreSQL, lower cost)
- Octane/FrankenPHP as Heroku PHP-FPM replacement (3-10x throughput)
- Auto-hibernation for non-production environments (Heroku charged 24/7)
- Cloud spending limits configured pre-migration

## Performance Considerations
- Heroku dyno: CPU limited (1 vCPU shared); Cloud container: dedicated CPU
- Heroku Postgres: $50-200/month for managed PG; Neon: free to $50/month
- Octane on Cloud: 3-10x throughput vs PHP-FPM on Heroku
- Cloud auto-hibernation: 5-15s cold start vs Heroku always-on dynos
- Cloud auto-scaling adds containers in 30-120s during traffic spikes

## Security Considerations
- Heroku Postgres → Neon: ensure same encryption and backup standards
- Cloud IAM roles more granular than Heroku's app-level permissions
- Cloud supports VPC peering for Private Cloud (Heroku Private Spaces similar)
- Review Cloud's data residency; Heroku had US/EU regions
- Cloud deployment credentials should follow least privilege

## Common Mistakes
1. **Not accounting for Heroku add-on costs in savings comparison**: Heroku Redis, SSL, monitoring add 20-40% to bill (Cause: comparing dyno cost only; Consequence: overestimating Cloud savings percentage; Better: include all Heroku add-on costs in pre-migration cost baseline)
2. **Assuming 30% savings applies to all Heroku deployments**: Savings depend on Heroku spend composition (Cause: case study generalizes; Consequence: app with lower database costs may see different savings; Better: model your specific Heroku cost breakdown before projecting)
3. **Not testing Neon as direct Heroku Postgres replacement**: Some Heroku-specific PG features have no Neon equivalent (Cause: both are PostgreSQL; Consequence: Heroku follower databases, dataclips, and PG extensions may not work in Neon; Better: audit Heroku PG-specific features before migration)
4. **Underestimating Cloud learning curve**: Cloud CLI and workflows differ from Heroku (Cause: both are "managed platforms"; Consequence: team productivity drops during migration period; Better: budget 2-4 weeks for team to learn Cloud before full migration)

## Anti-Patterns
- **Migrating all Heroku apps simultaneously**: Risk of simultaneous failures
- **Skipping Octane validation**: Cloud uses Octane by default; must test compatibility
- **No rollback plan**: Heroku apps terminated before Cloud is stable
- **Ignoring Neon cold start for user-facing DB queries**: Neon takes 500ms-1s for first query after idle

## Examples
- **Superscript profile**: Heroku → Laravel Private Cloud, 30% savings, Neon DB, Octane runtime
- **Heroku mid-tier app**: $5K/month Heroku (dynos + Postgres + Redis), projected Cloud $3.5K/month, 3-week migration
- **Heroku starter app**: $500/month Heroku, Cloud saves maybe $150/month, migration not worth effort

## Related Topics
- Laravel Cloud vs Vapor (ku-27)
- Neon Serverless PostgreSQL (ku-08)
- Laravel Octane Throughput (ku-38)
- PyleSoft Cost Reduction (ku-40)

## AI Agent Notes
- Default: model total Heroku cost (dynos + add-ons + database) before projecting savings
- Default: test Octane compatibility before Heroku → Cloud migration
- Neon is the natural Heroku Postgres replacement
- 30% savings is realistic for Heroku apps >$3K/month
- Migration payback typically 3-6 months including engineering cost
