# Neon Serverless PostgreSQL

## Metadata
- **ID**: KU-08-NEON-POSTGRES
- **Subdomain**: database-cost-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Neon Serverless PostgreSQL
- **Version**: 1.0
- **Classification**: Emerging
- **Maturity**: High

## Overview
Neon offers serverless PostgreSQL with sub-1 second cold starts, 100 compute-hours free tier, 0.5GB storage free, and paid plans from $0.106/CU-hour. It features instant database branching (copy-on-write) for zero-cost dev/staging databases. Neon is the default database for Laravel Cloud, offering elastic scaling, scale-to-zero, and significant cost advantages over Aurora for variable workloads.

## Core Concepts
- **Compute Units (CU)**: $0.106/CU-hour, billed per-second with minimum 1 hour
- **Free tier**: 100 compute-hours/month + 0.5GB storage (enough for small staging apps)
- **Scale-to-zero**: Drops to 0 compute cost when idle; only storage charges apply
- **Cold start**: Sub-1 second for most workloads
- **Database branching**: Instant copy-on-write clones; zero-cost for CI/CD, dev, testing
- **Laravel Cloud default**: Neon is the default database option for new Laravel Cloud projects
- **Disaggregated storage**: Pageserver architecture separates compute from storage enables instant branching

## When To Use
- Development and staging database environments (primary use case as of 2026)
- CI/CD pipeline databases with branching for isolated test environments
- Light production workloads with low traffic and variable patterns
- Laravel Cloud projects (Neon is the default database)
- Heroku → Cloud migrations (Neon replaces Heroku Postgres at lower cost)
- Workloads needing instant database clones for testing

## When NOT To Use
- Production primary workloads requiring multi-AZ HA or 99.95%+ uptime
- Very large databases (>200GB) where Aurora/RDS may have better cost structure
- Applications needing MySQL/MariaDB or Oracle compatibility
- Workloads with strict <1ms query latency (Neon cold start is 500ms-1s)
- High-throughput write-heavy workloads needing dedicated IOPS

## Best Practices
- **Use Neon for all non-production database environments**: Dev, staging, CI/CD (WHY: scale-to-zero means 60-70% cost reduction vs always-on databases; branching gives each developer isolated DB; free tier covers most staging needs)
- **Set compute limits per branch**: Prevent runaway queries on developer branches (WHY: a single long-running query on a developer branch shouldn't consume team's compute budget; Neon allows per-branch CU limits; set 1 CU for sandbox branches, 2-4 CU for testing branches)
- **Configure auto-pause for idle branches**: Scale-to-zero after 5 minutes of inactivity (WHY: developer branches accessed 6-8 hours/day; auto-pause means 16-18 hours/day zero compute cost; sub-1s cold start is acceptable for development environments)
- **Branch from production for realistic testing**: Use Neon CLI or API for automated branching (WHY: test data never matches production patterns; branching with production data reveals issues synthetic data misses; copy-on-write means no storage cost until branch modifies data)
- **Monitor compute credit usage on free tier**: 100 compute-hours/month goes quickly with multiple active branches (WHY: 4 developers each running 2 hours/day = 240 compute-hours/month = exceed free tier; set up billing alerts at 80% of free tier; upgrade to paid plan proactively)

## Architecture Guidelines
- Neon for dev/staging/CI/CD; Aurora/RDS for production
- Branch naming: `pr-{number}-{description}` for PR previews
- Auto-delete branches after 7-14 days (Neon branch TTL setting)
- Production → Neon sync via logical replication for realistic dev data
- Compute sizing: 1 CU for development, 2-4 CU for staging, 4-8 CU for light production

## Performance Considerations
- Cold start: 500ms-1s from scale-to-zero (first query)
- Warm queries: 1-5ms latency (compute active)
- Compute Units: 1 CU = 1 vCPU + 4GB RAM
- Maximum compute: 8 CU per branch
- Storage: billed per GB for delta from parent; no I/O charges
- Concurrent connections: scaled with compute (100-500 depending on CU)

## Security Considerations
- Neon uses AWS infrastructure for storage (us-east-1, eu-west-1, ap-southeast-1)
- Encryption at rest with AES-256; in transit with TLS 1.3
- IP allowlisting for connection security
- Branch access inherits parent database roles and permissions
- Production data in branches requires same access controls as production

## Common Mistakes
1. **Using Neon for production primary without evaluation**: Not recommended for primary production workloads as of 2026 (Cause: Neon is production-ready in marketing; Consequence: multi-AZ HA not available; uptime SLAs not comparable to Aurora; Better: use Aurora/RDS for production; Neon for non-production)
2. **Not setting branch TTL**: Branches accumulate indefinitely (Cause: "I'll clean up later"; Consequence: stale branches accumulate storage delta costs; Better: set 7-14 day TTL; branches auto-deleted with warning)
3. **Oversizing compute for developer branches**: 8 CU for simple CRUD testing (Cause: "more compute = faster"; Consequence: 8x higher cost per developer branch; Better: 1 CU for routine development; upsize only for performance testing)
4. **Not configuring auto-pause**: Branches running 24/7 when not in use (Cause: "keep warm for quick response"; Consequence: paying for compute 16-18 hours/day unnecessarily; Better: 5-minute auto-pause; sub-1s cold start is fine for development)

## Anti-Patterns
- **Neon for production with strict HA requirements**: Single-AZ, no multi-region replication
- **Branching every PR with full production data**: Unnecessary for trivial changes
- **No compute limits on branches**: One runaway query consumes all CUs
- **Ignoring free tier limits**: 100 compute-hours exhausted in days with multiple active branches

## Examples
- **Staging app**: 2 CU, 8 hours/day, auto-pause, $0.106 × 2 × 8 × 30 = $50.88/month (vs RDS ~$100/month)
- **CI/CD pipeline**: Branch creation → run tests → delete; ~5 min compute per run; 200 runs/month = ~$0.18 total
- **Team of 10 devs**: 10 branches, 2 hours/day each, 1 CU, auto-pause; total ~$63.60/month for all dev databases

## Related Topics
- Neon Database Branching (ku-47)
- Aurora Serverless v2 Pricing (ku-06)
- Superscript Heroku Migration (ku-42)
- Laravel Cloud Platform Cost (ku-??)

## AI Agent Notes
- Default: use Neon for all non-production database environments
- Default: 1 CU for development, 2-4 CU for staging
- Default: auto-pause after 5 minutes, 7-day branch TTL
- Monitor free tier compute credits monthly
- Not recommended for production primary workloads as of 2026
