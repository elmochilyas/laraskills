# Neon Database Branching

## Metadata
- **ID**: KU-47-NEON-BRANCHING
- **Subdomain**: database-cost-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Neon Database Branching
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Neon's database branching creates instant, copy-on-write database clones at zero additional cost. This enables every PR, developer, and CI/CD pipeline to have its own isolated PostgreSQL database. Combined with scale-to-zero compute, a team of 10 developers can each have dedicated databases for <$50/month total. This paradigm eliminates shared staging databases, connection conflicts, and "works on my machine" issues.

## Core Concepts
- **Instant branching**: Create branch from any point in database history (milliseconds)
- **Copy-on-write**: Zero storage cost until data is modified in the branch
- **Scale-to-zero**: Branches use no compute until accessed
- **Use cases**: PR preview environments, developer sandboxes, CI/CD testing
- **Cost model**: Pay only for compute when branch is actively used + storage for deltas
- **Time-travel**: Branch from any historical point (up to 7 days on free tier)

## When To Use
- Development databases for each team member (replaces shared dev DB)
- PR preview environments with isolated database
- CI/CD pipeline testing with production-like data
- Database migration testing on real data without affecting production
- Schema change validation before production deployment
- Any scenario requiring isolated database copies

## When NOT To Use
- Production primary workloads (Neon not recommended for production as of 2026)
- Workloads requiring multi-AZ HA or 99.95%+ uptime SLAs
- Applications that need MySQL/MariaDB or proprietary database features
- Very large databases (>200GB) where branching creates significant storage
- Workloads needing <1ms query latency (Neon compute cold start: 500ms-1s)

## Best Practices
- **Branch from production for realistic testing**: Use `psql` or Neon CLI to create branch with production data (WHY: test data doesn't match production patterns; branching with production data reveals issues that synthetic data misses; copy-on-write means no storage cost until branch modifies data)
- **Auto-delete branches after PR merge**: Set branch TTL or integrate with CI/CD teardown (WHY: idle branches cost nothing for compute but storage for deltas accumulates; setting 7-day TTL auto-deletes stale branches; prevents orphaned branch accumulation)
- **Use scale-to-zero for developer branches**: Branches use no compute when idle (WHY: developer DB accessed 6-8 hours/day; scale-to-zero means 16-18 hours/day of zero compute cost; saves 60-70% vs always-on dev database)
- **Integrate branching with CI/CD pipeline**: Create branch at pipeline start, delete at end (WHY: CI/CD runs 10-30 minutes; branch creation takes milliseconds; delete after pipeline completes; net cost = minutes of compute + minimal delta storage)
- **Set compute limits per branch**: Prevent runaway queries from consuming all compute credits (WHY: a long-running query on a developer branch shouldn't consume team's compute budget; Neon allows per-branch compute limits; set to 1 CU for sandbox branches)

## Architecture Guidelines
- Use Neon for all non-production database environments (dev, staging, CI/CD)
- Use Aurora/RDS for production databases (HA, mature, multi-AZ)
- Production → Neon synchronization: use logical replication for production-like dev data
- Branch naming convention: `pr-{number}-{description}` or `dev-{username}`
- Automate branch lifecycle: create on PR open, update on PR sync, delete on PR merge

## Performance Considerations
- Branch creation: milliseconds (no data copy)
- First query after idle: 500ms-1s cold start (scale-to-zero wake)
- Compute unit (CU): 1 CU = 1 vCPU with 4GB RAM
- Storage: billed for delta from parent (not full copy)
- Zero performance impact on parent database when branching

## Security Considerations
- Branches inherit parent database permissions and roles
- Production data in branches carries same security requirements
- Branch access should be controlled via Neon project permissions
- PII in production database is copied to branch — ensure dev environments have appropriate controls
- Delete branches promptly to minimize production data exposure surface

## Common Mistakes
1. **Not setting branch TTL**: Branches accumulate indefinitely, storage costs grow (Cause: "I'll clean up later"; Consequence: 20 stale branches each with 100MB delta = 2GB storage cost; Better: set 7-14 day TTL; warn before auto-deletion)
2. **Branching with production data for all developers**: Not all devs need production-scale data (Cause: "more realistic data = better testing"; Consequence: branching 50GB production database 10 times; Better: use subset or anonymized data for routine development; full production branch only for schema migration testing)
3. **Running CI/CD tests on shared production database**: Risk of test data contamination (Cause: convenience over isolation; Consequence: test data pollutes production; test failures affect real users; Better: branch for each CI/CD run, delete after completion)
4. **Not using auto-pause for developer branches**: Branches running 24/7 when dev is sleeping (Cause: "keep warm for quick response"; Consequence: paying for compute 16 hours/day when not needed; Better: auto-pause after 5 minutes idle; 500ms-1s cold start is acceptable for development)

## Anti-Patterns
- **Sharing one dev database across team**: Connection conflicts, schema migration clashes
- **Manually restoring backups for test environments**: Hours vs milliseconds with branching
- **No branch lifecycle management**: Stale branches accumulate storage cost
- **Branching production for every minor task**: Overkill for quick schema checks

## Examples
- **Team of 10 developers**: 10 branches from production, scale-to-zero, ~$50/month total; each dev has isolated DB
- **CI/CD pipeline**: Branch creation at pipeline start (50ms), run tests (5 min), branch deletion; cost = $0.002 per run
- **PR preview**: Branch from staging database, deployed with preview environment, auto-deleted after PR merge

## Related Topics
- Neon Serverless PostgreSQL (ku-08)
- Aurora Serverless v2 Pricing (ku-06)
- Scale-to-Zero (ku-?? in server-database)

## AI Agent Notes
- Default: use Neon branching for all non-production database environments
- Default: set 7-day TTL on all branches
- Default: auto-pause after 5 minutes idle for developer branches
- Branch from production for realistic test data (copy-on-write = free until modified)
- CI/CD integration: create at start, delete at end
