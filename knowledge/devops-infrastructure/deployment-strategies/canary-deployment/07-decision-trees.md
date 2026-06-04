# Decision Trees: Canary Deployment

## Strategy Selection

**Is the application high-traffic (> 10k req/min)?**
- No → Canary lacks statistical significance; use blue-green or rolling update
- Yes → Canary is viable

**Does the team have real-time observability?**
- No → Canary without observability is blind; use blue-green instead
- Yes → Canary is appropriate

**Can rollback be fully automated?**
- No → Manual rollback defeats canary's purpose; use blue-green for instant rollback
- Yes → Canary deployment can proceed

## Canary Percentage Decision

**Traffic volume:**
- 10k-50k req/min → Start at 5% canary
- 50k-200k req/min → Start at 2% canary
- > 200k req/min → Start at 1% canary

**Risk profile:**
- Critical (payments, auth) → Start at 1%, hold at 5% for extended observation
- Standard → Start at 5%, progressive to 100% over 30 minutes
- Low risk → Start at 10%, rapid progressive to 100%
