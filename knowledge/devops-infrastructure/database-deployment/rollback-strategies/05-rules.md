# Rules: Rollback Strategies

## ROLLBACK-001: Reversible Migrations Required
**Condition:** Migration modifies schema
**Action:** Implement both `up` and `down` methods
**Rationale:** Irreversible migrations make deployment rollback impossible
**Consequences:** Violation blocks production rollback when code deploy fails

## ROLLBACK-002: Test Rollback in Staging
**Condition:** Migration deployed to production
**Action:** Test `migrate:rollback` in staging before production deployment
**Rationale:** Untested rollback may fail due to data volume or constraint differences
**Consequences:** Violation reveals rollback issues during production incident

## ROLLBACK-003: Automate Rollback in Pipeline
**Condition:** CI/CD pipeline includes deployment step
**Action:** Include automated rollback trigger for database migrations
**Rationale:** Manual rollback is slow and error-prone during incidents
**Consequences:** Violation extends database-related incident recovery time

## ROLLBACK-004: Document Irreversible Changes
**Condition:** Irreversible data migration (data pruning, archival)
**Action:** Document reason and obtain sign-off before deployment
**Rationale:** Irreversible data loss requires explicit team decision
**Consequences:** Violation causes unrecoverable data loss without awareness
