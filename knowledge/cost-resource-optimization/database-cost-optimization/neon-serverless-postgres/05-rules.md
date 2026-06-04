## Use Neon for All Non-Production Databases
---
## Cost Optimization
---
Always use Neon serverless PostgreSQL for dev, staging, and CI/CD database environments; reserve Aurora/RDS for production.
---
Neon's scale-to-zero means 60-70% cost reduction vs always-on databases; branching gives each developer isolated DB; free tier covers most staging needs.
---
Dev: Neon 1 CU, auto-pause, $15/month. Staging: Neon 2 CU, branch from production, $30/month.
---
Running dev and staging on RDS On-Demand 24/7 at $100/month each.
---
Production primary workloads requiring multi-AZ HA or 99.95%+ uptime.
---
3-5x higher non-production database costs than necessary.
---
## Set Compute Limits Per Branch
---
## Cost Optimization
---
Always configure per-branch compute unit limits on Neon to prevent runaway queries from consuming the team budget.
---
A single long-running query on a developer branch can consume all team compute credits; per-branch limits isolate costs and prevent budget surprises.
---
Sandbox branches: max CU = 1. Testing branches: max CU = 2-4.
---
All branches with unlimited compute; one developer's heavy query consumes all team CUs.
---
Production branch on Neon (if used for light production); still set reasonable limit.
---
Unpredictable Neon bills from uncontrolled compute usage on developer branches.
---
## Configure Auto-Pause for Idle Branches
---
## Cost Optimization
---
Always configure auto-pause after 5 minutes of inactivity on Neon branches.
---
Developer branches accessed 6-8 hours/day; auto-pause means 16-18 hours/day zero compute cost. Sub-1s cold start is acceptable for development.
---
Neon branch: auto-pause after 5 minutes idle. Compute cost ~$15/month for 8h/day usage.
---
Developer branches running 24/7 "to keep warm."
---
60-70% higher compute costs for non-production branches.
---
## Branch From Production for Realistic Testing
---
## Testing
---
Always branch Neon databases from production for realistic test data instead of using synthetic data.
---
Test data never matches production patterns; branching with production data reveals issues synthetic data misses. Copy-on-write means zero storage cost until branch modifies data.
---
CI/CD pipeline: branch from production, run tests, delete branch. Realistic data, zero storage cost.
---
Using synthetically generated test data that doesn't match production patterns.
---
Schema changes that shouldn't be tested against PII data; use anonymized production branch.
---
Test passes with synthetic data but fails in production due to unexpected data patterns.
---
## Set Branch TTL for Auto-Cleanup
---
## Maintenance
---
Always set 7-14 day TTL on Neon branches; never let branches accumulate indefinitely.
---
Idle branches cost nothing for compute but storage deltas accumulate; setting TTL auto-deletes stale branches and prevents orphaned storage costs.
---
Neon branch TTL: 14 days. Warning email at 7 days. Auto-delete at 14 days.
---
20 stale branches each with 100MB delta = 2GB storage cost; no cleanup mechanism.
---
Long-lived feature branches actively used for weeks; still set TTL and extend as needed.
---
Accumulated storage costs from abandoned branches, manual cleanup effort.
---
## Monitor Free Tier Compute Credits
---
## Cost Optimization
---
Always monitor Neon free tier compute credit usage; set alerts at 80% consumption.
---
100 compute-hours/month goes quickly with multiple active branches. 4 developers each running 2 hours/day = 240 hours/month — exceeding free tier.
---
Free tier: 80 hours used out of 100. Alert set. Upgrade to paid plan before exhaustion.
---
4 developer branches running 2h/day each, exceeding 100h free tier, surprise $50+ bill.
---
Organizations on paid Neon plans; still monitor usage against budget.
---
Unexpected Neon charges from free tier exhaustion.
