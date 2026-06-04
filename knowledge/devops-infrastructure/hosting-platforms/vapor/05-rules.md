# Rules: Vapor

## VAPOR-PLATFORM-001: CI/CD Deployment
**Condition:** Vapor used for Laravel hosting
**Action:** Trigger deployments from CI/CD pipeline using Vapor CLI
**Rationale:** Manual deployments bypass CI/CD quality gates
**Consequences:** Violation allows untested code to reach production

## VAPOR-PLATFORM-002: Cost Monitoring
**Condition:** Production application on Vapor
**Action:** Set AWS budget alerts for Vapor-related costs
**Rationale:** Serverless costs scale with traffic; unexpected spikes cause cost overruns
**Consequences:** Violation results in unbudgeted AWS charges

## VAPOR-PLATFORM-003: Configuration Cache
**Condition:** Vapor deployment
**Action:** Enable config cache in vapor.yml for cold start optimization
**Rationale:** Uncached config files significantly increase Lambda cold start time
**Consequences:** Violation degrades application response time after idle periods
