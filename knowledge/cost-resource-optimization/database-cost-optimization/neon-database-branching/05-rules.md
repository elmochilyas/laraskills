## Branch From Production for Realistic Testing
---
## Testing
---
Always create Neon branches from latest production data for realistic testing; avoid synthetic data that doesn't match production patterns.
---
Copy-on-write means zero storage cost for the parent data until modified; branching from production reveals issues that synthetic data misses, especially schema migration edge cases.
---
CI/CD: branch from production at current LSN, run migration tests, delete branch. Cost: ~$0.01.
---
Using synthetic test data with different distribution, missing null patterns, and different cardinality.
---
PII compliance prevents using production data; use anonymized production branch instead.
---
Test passes with synthetic data but fails in production due to unexpected data patterns.
---
## Auto-Delete Branches After PR Merge
---
## Maintenance
---
Always automate Neon branch deletion when PRs are merged or branches reach TTL; never leave branches orphaned.
---
Idle branches consume no compute but storage deltas accumulate; 30 stale branches with 100MB each = 3GB unnecessary storage cost and increased management overhead.
---
GitHub Action: on PR close, delete Neon branch `pr-{number}-*`.
---
20 stale branches from merged PRs, each with 50-200MB deltas, accumulating storage cost.
---
Long-lived feature branches under active development; still plan cleanup after feature release.
---
Accumulated storage costs, branch sprawl, manual cleanup effort.
---
## Use Scale-to-Zero for Developer Branches
---
## Cost Optimization
---
Always enable auto-pause (scale-to-zero) on developer Neon branches; never leave them always-on.
---
Developer databases accessed 6-8 hours/day; scale-to-zero eliminates compute cost for 16-18 hours/day. Sub-1s cold start is acceptable for development.
---
Developer branch: auto-pause after 5 minutes idle. Cost: ~$15/month for 8h/day usage.
---
Developer branch running 24/7 "to keep warm."
---
Performance testing branches that must remain warm; still rare for daily development.
---
60-70% higher compute costs on developer branches.
---
## Integrate Branching With CI/CD Pipeline
---
## Cost Optimization
---
Always create and delete Neon branches within CI/CD pipeline runs for isolated test environments.
---
CI/CD runs 10-30 minutes; branch creation takes milliseconds; delete after completion. Net cost = minutes of compute + minimal delta storage — near-zero cost for isolated test databases.
---
Pipeline: create branch (50ms) -> run migrations -> run tests -> delete branch. Cost: $0.002/run.
---
Running CI/CD tests against a shared staging database, risking test data contamination.
---
CI/CD pipelines using non-database-dependent tests; still recommend branching for integration tests.
---
Test data contamination, parallel pipeline conflicts, no isolation between test runs.
---
## Set Compute Limits Per Branch
---
## Cost Optimization
---
Always set per-branch compute unit limits on Neon to prevent runaway queries from consuming the team budget.
---
A long-running query on a developer branch shouldn't consume team's compute credits; per-branch limits isolate costs.
---
Sandbox branches: max 1 CU. Testing branches: max 2-4 CU.
---
All branches with unlimited compute; one developer's heavy query consumes all team CUs.
---
No common exceptions; cost isolation is always valuable.
---
Unpredictable Neon bills from uncontrolled compute usage on developer branches.
