# Rules: Envoyer

## ENVOYER-PLATFORM-001: CI/CD Integration
**Condition:** Envoyer used for deployments
**Action:** Trigger deployments from CI/CD pipeline, not manually
**Rationale:** Manual Envoyer deployments bypass CI/CD quality gates
**Consequences:** Violation allows untested code to reach production

## ENVOYER-PLATFORM-002: Team Access Management
**Condition:** Multiple developers on team
**Action:** Use Envoyer team feature, not shared credentials
**Rationale:** Shared credentials prevent audit trail and access revocation
**Consequences:** Violation removes deployment accountability
