# Skills: Laravel Prunable Trait

**Domain:** governance-compliance-engineering
**Subdomain:** data-retention-anonymization
**Knowledge Unit:** Laravel Prunable Trait

---

## Skill 1: Implement Laravel Prunable Trait Controls
**Description:** Configure and deploy laravel prunable trait mechanisms within Laravel applications
**Trigger:** When building new features requiring governance or compliance controls
**Steps:**
1. Identify the applicable compliance requirements for the feature
2. Select the appropriate Laravel extension point (middleware, policy, observer, event)
3. Implement the control following the architecture guidelines
4. Add audit logging for all state-changing operations
5. Write automated evidence collection for the control
6. Create tests that verify the control is active and correctly configured
7. Document the control in the compliance register
**Outcome:** A production-grade compliance control integrated with Laravel's native architecture

## Skill 2: Design Audit Trail Systems
**Description:** Design and implement tamper-evident audit logging for Laravel applications
**Trigger:** When regulatory requirements mandate audit trails (GDPR, SOC 2, HIPAA)
**Steps:**
1. Determine audit requirements: what events, retention period, tamper-evidence mechanism
2. Select the audit package: Spatie Activitylog (general), Laravel Audit Chain (cryptographic), BeakAudit (HMAC), or custom
3. Configure model auditing with appropriate attribute selection and sensitive field masking
4. Implement queue-based asynchronous writes to avoid request overhead
5. Set up retention pruning with legal hold exclusion
6. Verify tamper evidence mechanisms work correctly
7. Document the audit schema for compliance reviewers and auditors
**Outcome:** A compliant and tamper-evident audit trail meeting regulatory requirements

## Skill 3: Automate Compliance Evidence Collection
**Description:** Build automated systems for continuous compliance evidence gathering
**Trigger:** When preparing for SOC 2, ISO 27001, or other compliance audits
**Steps:**
1. Identify all controls that require evidence collection
2. Implement Artisan commands that snapshot each control's configuration state
3. Store evidence snapshots in immutable storage (S3 Object Lock, append-only tables)
4. Schedule evidence collection: time-based (daily/weekly) and change-triggered (config events)
5. Implement evidence retrieval and report generation for audit observation windows
6. Verify evidence completeness, immutability, and accessibility
7. Document the evidence collection pipeline for auditors
**Outcome:** Continuous compliance evidence without manual effort or last-minute scrambling

## Skill 4: Implement Tenant Isolation
**Description:** Design and implement tenant isolation strategies that satisfy compliance requirements
**Trigger:** When building multi-tenant SaaS with regulatory data separation needs
**Steps:**
1. Assess data sensitivity and regulatory requirements per tenant
2. Select isolation level: column-scoped (low risk), schema-per-tenant (medium), database-per-tenant (high)
3. Implement tenant context resolution via subdomain, header, or JWT claim
4. Apply global scopes or dynamic connection resolvers consistently across all queries
5. Write cross-tenant access tests to verify isolation at every layer
6. Implement per-tenant backup and restore procedures
7. Document the isolation strategy and its compliance mapping
**Outcome:** Compliant multi-tenant architecture with appropriate data isolation per sensitivity level

## Skill 5: Policy-as-Code Pipeline
**Description:** Implement compliance policy enforcement through CI/CD pipelines
**Trigger:** When deploying to regulated environments requiring deployment-time compliance verification
**Steps:**
1. Define compliance policies as code using OPA/Rego or Conftest
2. Implement CI/CD policy gates that evaluate changes before deployment
3. Configure automated scanning (Checkov, composer audit) for security misconfigurations
4. Implement drift detection for runtime configuration changes
5. Automate evidence collection triggered by configuration changes
6. Document the policy-as-code pipeline for compliance auditors
**Outcome:** Automated compliance enforcement at every deployment, preventing non-compliant changes from reaching production