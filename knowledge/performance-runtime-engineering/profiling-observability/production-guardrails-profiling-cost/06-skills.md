# Skill: Implement Production Profiling Guardrails with SLO-Driven Activation and Canary Isolation

## Purpose
Implement production profiling safety mechanisms: SLO-driven profiling activation (auto-enable at 99 Hz when error budget burn rate exceeds 2x), canary pool isolation (1-5% of hosts), feature-flag gating (per-endpoint/user-segment), health check exclusion, and a 2% CPU profiling cost budget with monitoring alerts — preventing profiling overhead from causing cascading failures during incidents.

## When To Use
- Any production environment with profiling enabled
- High-traffic systems where even 1% overhead impacts capacity
- Incident response workflows needing automated profiling activation
- Teams using SLOs/error budgets to govern observability tooling cost

## When NOT To Use
- Development/staging environments (guardrails add unnecessary complexity)
- Low-traffic systems where overhead impact is negligible
- eBPF-only profiling (<0.5% overhead may not need SLO-driven activation)
- Teams without SLOs or error budgets defined

## Prerequisites
- SLOs and error budgets defined for the service
- Canary pool hosts identified (1-5% of fleet)
- Profiling tool with automated activation API
- Feature flag system for endpoint gating

## Inputs
- SLO burn rate thresholds
- Canary host list
- Profiling overhead budget (2% CPU)
- Health check endpoint paths

## Workflow

### 1. Allocate Profiling Cost Budget
- Reserve 2% of total CPU budget for profiling
- Monitor profiling overhead as a dashboard metric
- Alert when overhead exceeds 2% for >5 minutes
- Reduce sample rate or canary percentage at sustained overspend

### 2. Configure Canary Pool Isolation
- Tag 1-5% of fleet hosts for profiling (canary pool)
- Load balancer routes 95% traffic to non-profiled hosts
- Run low-overhead profiling (1-5% sample rate) on canary hosts only
- Provides representative data without fleet-wide overhead

### 3. Implement SLO-Driven Profiling Activation
- Disable high-frequency profiling by default in production
- Configure alert: when SLO burn rate exceeds 2x, trigger profiling activation
- Activate at 99 Hz on canary hosts first (never fleet-wide)
- Deactivate when SLO is restored (burn rate <0.5x)
- Automate fully — no manual activation during incidents

### 4. Add Feature-Flag Gating
- Gate profiling per-endpoint or per-user-segment with feature flags
- Example: profile only checkout for test users
- Use fast in-memory checks (APCu, local variable) — never database calls per request
- Overhead from flag check must be less than profiling overhead

### 5. Exclude Health Check Endpoints
- Configure profiling tool to skip health check, metrics, and probe endpoints
- Use path exclusion lists in profiling configuration
- Health checks generate the most profiles with the least diagnostic value
- Remove their data from profiler storage and aggregation

### 6. Document and Test Incident Runbook
- Document profiling activation procedure in runbook
- Test end-to-end: SLO breach → alert → profiling activation → profile collection
- Always activate on canary hosts first during incidents
- No manual profiling activation under stress — automation only

## Validation Checklist
- [ ] Profiling cost budget defined (2% CPU) and monitored
- [ ] Canary pool hosts tagged and configured for profiling
- [ ] SLO-driven activation automation configured (alert → profiling → deactivation)
- [ ] Feature-flag gating implemented for endpoint/user profiling
- [ ] Health check endpoints excluded from profiling
- [ ] Runbook documents profiling procedure during incidents
- [ ] End-to-end test: SLO breach triggers profiling, SLO restoration stops it

## Related Rules
- No fleet-wide profiling during incidents (`05-rules.md:1`)
- 2% CPU budget for profiling (`05-rules.md:25`)
- Exclude health check endpoints (`05-rules.md:49`)
- Canary pools for continuous profiling (`05-rules.md:75`)

## Related Skills
- SLO Definition and Error Budgets
- Continuous Profiling Strategy
- APM Integration Patterns
- Capacity Planning and Safety Margins

## Success Criteria
- Profiling overhead ≤2% of CPU at all times
- SLO-driven activation automates profiling during incidents
- Canary pool limits blast radius to 1-5% of traffic
- Health check endpoints excluded from profiling
- Incident runbook tested and documented
- No profiling-related cascading failures
