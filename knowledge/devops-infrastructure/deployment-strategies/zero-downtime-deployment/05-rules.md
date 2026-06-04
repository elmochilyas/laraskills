# Rules: Zero-Downtime Deployment

## ZDD-001: Health Check Gate Required
**Condition:** Production deployment performed
**Action:** Configure automated health check that validates full stack before traffic cutover
**Rationale:** Health check is the only gate preventing bad releases from serving production traffic
**Consequences:** Violation means every deployment is a blind release

## ZDD-002: Rollback Procedure Tested
**Condition:** Zero-downtime deployment pipeline established
**Action:** Test rollback procedure in staging before production deployment
**Rationale:** Untested rollback is not rollback; it's hope
**Consequences:** Violation means deployment failures become extended outages

## ZDD-003: Backward-Compatible Migrations
**Condition:** Database migrations included in deployment
**Action:** All schema changes must be backward-compatible with previous code version
**Rationale:** Rollback requires old code to work with new schema
**Consequences:** Violation makes rollback impossible after migration

## ZDD-004: Atomic Cutover Only
**Condition:** Traffic switch between releases
**Action:** Use atomic cutover (symlink or load balancer switch), not progressive file replacement
**Rationale:** Progressive replacement serves partially-updated application to users
**Consequences:** Violation causes inconsistent application state errors

## ZDD-005: Release Retention Policy
**Condition:** ZDD directory structure in use
**Action:** Configure retention to keep 3-5 releases maximum
**Rationale:** Unlimited releases exhaust disk space; too few limit rollback depth
**Consequences:** Violation causes disk full errors or insufficient rollback capability
