# Rules: Pulumi for Laravel

## PULUMI-001: Stack Isolation
**Condition:** Multi-environment Pulumi configuration
**Action:** Use separate stacks per environment with isolated state
**Rationale:** Shared stack across environments risks cross-environment resource modification
**Consequences:** Violation allows staging changes to affect production resources

## PULUMI-002: Preview in CI/CD
**Condition:** Pulumi deployment in CI/CD pipeline
**Action:** Run `pulumi preview` before `pulumi up` in all environments
**Rationale:** Unreviewed infrastructure changes can delete critical resources
**Consequences:** Violation causes accidental resource deletion without review

## PULUMI-003: OIDC for Authentication
**Condition:** CI/CD pipeline deploys Pulumi infrastructure
**Action:** Use OIDC authentication instead of long-lived cloud access keys
**Rationale:** Long-lived keys are security risk if leaked from CI/CD
**Consequences:** Violation requires managing and rotating cloud access keys

## PULUMI-004: Provider Version Pinning
**Condition:** Pulumi project for Laravel infrastructure
**Action:** Pin AWS/Azure/GCP provider versions in configuration
**Rationale:** Provider updates can change resource behavior or introduce breaking changes
**Consequences:** Violation causes unexpected infrastructure changes on provider updates
