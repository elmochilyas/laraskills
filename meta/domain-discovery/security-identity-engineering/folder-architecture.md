# Folder Architecture: Security & Identity Engineering

## Structure Rationale

The folder architecture separates Security & Identity Engineering into three top-level groups:

1. **Core Security Primitives** (`authentication/`, `authorization/`) — The foundational identity and access control systems that every Laravel application requires. These are ordered by the typical application flow: authentication first (who you are), authorization second (what you can do).

2. **Defense & Hardening** (`hardening/`, `threat-mitigation/`, `secrets/`, `multi-tenancy/`) — The protective layers that secure the application against threats. These cover both proactive (hardening, secrets management) and reactive (threat mitigation) security measures, plus the specialized isolation requirements of multi-tenant architectures.

3. **Observability & Compliance** (`audit-logging/`) — The recording and verification layer for security events, essential for incident response, forensics, and regulatory compliance.

The numbering scheme (`01-`, `02-`, etc.) establishes a logical reading order but should not imply strict dependency. Cross-cutting references (e.g., authentication influencing authorization, audit logging touching all layers) are documented within each subdomain's knowledge cards.

Each subdomain folder contains a `domain/` subfolder for detailed domain discovery output, a `knowledge/` subfolder for structured knowledge units and rules, and a `rules/` subfolder for executable skill rules and decision trees. The top-level `shared/` folder captures concepts that span multiple subdomains (e.g., token lifecycle, session management, encryption primitives).

## Proposed ECC Folder Tree

```
security-identity-engineering/
│
├── 01-authentication/
│   ├── domain/
│   │   ├── session-auth-discovery.md
│   │   ├── sanctum-api-auth-discovery.md
│   │   ├── passport-oauth2-discovery.md
│   │   ├── socialite-social-login-discovery.md
│   │   ├── passkeys-webauthn-discovery.md
│   │   ├── enterprise-sso-saml-oidc-discovery.md
│   │   ├── mfa-totp-discovery.md
│   │   └── starter-kits-auth-discovery.md
│   ├── knowledge/
│   │   ├── sanctum-token-management.md
│   │   ├── passport-grant-types.md
│   │   ├── socialite-provider-config.md
│   │   ├── passkeys-ceremonies.md
│   │   ├── webauthn-relying-party.md
│   │   ├── fortify-pipeline-actions.md
│   │   └── multi-guard-architecture.md
│   ├── rules/
│   │   ├── auth-package-selection.md
│   │   ├── sanctum-vs-passport-decision.md
│   │   ├── fortify-action-customization.md
│   │   ├── passkeys-implementation.md
│   │   └── sso-integration-checklist.md
│   └── ku/
│       ├── auth-guard-provider.ku.md
│       ├── sanctum-token.ku.md
│       ├── passport-oauth2.ku.md
│       ├── passkeys-webauthn.ku.md
│       └── fortify.ku.md
│
├── 02-authorization/
│   ├── domain/
│   │   ├── gates-policies-discovery.md
│   │   ├── spatie-permission-discovery.md
│   │   ├── rbac-design-discovery.md
│   │   ├── abac-rebac-discovery.md
│   │   └── authorization-testing-discovery.md
│   ├── knowledge/
│   │   ├── gate-definition-patterns.md
│   │   ├── policy-method-signatures.md
│   │   ├── spatie-hasroles-trait.md
│   │   ├── permission-vs-role-checking.md
│   │   ├── team-scoped-permissions.md
│   │   └── cache-invalidation-strategy.md
│   ├── rules/
│   │   ├── gate-vs-policy-decision.md
│   │   ├── spatie-permission-setup.md
│   │   ├── authorization-resource-mapping.md
│   │   ├── super-admin-bypass.md
│   │   └── permission-seeding.md
│   └── ku/
│       ├── gates.ku.md
│       ├── policies.ku.md
│       ├── spatie-permission.ku.md
│       └── rbac.ku.md
│
├── 03-hardening/
│   ├── domain/
│   │   ├── csrf-protection-discovery.md
│   │   ├── xss-prevention-discovery.md
│   │   ├── sql-injection-discovery.md
│   │   ├── mass-assignment-discovery.md
│   │   ├── security-headers-discovery.md
│   │   ├── cors-configuration-discovery.md
│   │   ├── session-security-discovery.md
│   │   └── dependency-security-discovery.md
│   ├── knowledge/
│   │   ├── csrf-token-lifecycle.md
│   │   ├── blade-escaping-behavior.md
│   │   ├── query-binding-patterns.md
│   │   ├── fillable-guarded-semantics.md
│   │   ├── hsts-csp-header-values.md
│   │   ├── cors-origin-restriction.md
│   │   └── session-driver-selection.md
│   ├── rules/
│   │   ├── form-csrf-enforcement.md
│   │   ├── secure-blade-output.md
│   │   ├── safe-eloquent-queries.md
│   │   ├── mass-assignment-protection.md
│   │   ├── security-headers-middleware.md
│   │   └── session-config-production.md
│   └── ku/
│       ├── csrf-protection.ku.md
│       ├── xss-prevention.ku.md
│       ├── sql-injection.ku.md
│       ├── mass-assignment.ku.md
│       ├── security-headers.ku.md
│       └── session-security.ku.md
│
├── 04-threat-mitigation/
│   ├── domain/
│   │   ├── rate-limiting-discovery.md
│   │   ├── input-validation-discovery.md
│   │   ├── output-escaping-discovery.md
│   │   ├── encryption-discovery.md
│   │   ├── signed-urls-discovery.md
│   │   └── file-upload-security-discovery.md
│   ├── knowledge/
│   │   ├── rate-limiter-algorithms.md
│   │   ├── form-request-rules.md
│   │   ├── crypt-facade-api.md
│   │   ├── envelope-encryption-dek-kek.md
│   │   └── signed-route-parameters.md
│   ├── rules/
│   │   ├── api-rate-limit-config.md
│   │   ├── validation-best-practices.md
│   │   ├── encryption-selection.md
│   │   ├── secure-file-uploads.md
│   │   └── signed-url-usage.md
│   └── ku/
│       ├── rate-limiting.ku.md
│       ├── input-validation.ku.md
│       ├── encryption.ku.md
│       ├── signed-urls.ku.md
│       └── file-upload-security.ku.md
│
├── 05-secrets/
│   ├── domain/
│   │   ├── env-management-discovery.md
│   │   ├── vault-integration-discovery.md
│   │   ├── key-rotation-discovery.md
│   │   ├── column-encryption-discovery.md
│   │   └── secret-scanning-discovery.md
│   ├── knowledge/
│   │   ├── app-key-generation.md
│   │   ├── hashicorp-vault-drivers.md
│   │   ├── locksmith-recipes.md
│   │   ├── sealcraft-providers.md
│   │   └── encryption-key-storage.md
│   ├── rules/
│   │   ├── env-config-production.md
│   │   ├── vault-deployment-pattern.md
│   │   ├── key-rotation-schedule.md
│   │   └── secrets-cicd-integration.md
│   └── ku/
│       ├── env-management.ku.md
│       ├── vault-integration.ku.md
│       ├── key-rotation.ku.md
│       └── column-encryption.ku.md
│
├── 06-audit-logging/
│   ├── domain/
│   │   ├── model-activity-logging-discovery.md
│   │   ├── comprehensive-auditing-discovery.md
│   │   ├── immutable-audit-trails-discovery.md
│   │   ├── multi-tenant-audit-discovery.md
│   │   └── log-integrity-verification-discovery.md
│   ├── knowledge/
│   │   ├── spatie-activitylog-usage.md
│   │   ├── hmac-checksum-verification.md
│   │   ├── sha256-hash-chain.md
│   │   ├── batch-grouping-patterns.md
│   │   └── retention-policy-design.md
│   ├── rules/
│   │   ├── audit-trait-selection.md
│   │   ├── sensitive-field-masking.md
│   │   ├── log-retention-config.md
│   │   └── compliance-traceability.md
│   └── ku/
│       ├── activity-logging.ku.md
│       ├── audit-trail.ku.md
│       ├── immutable-audit.ku.md
│       └── audit-compliance.ku.md
│
├── 07-multi-tenancy/
│   ├── domain/
│   │   ├── data-isolation-patterns-discovery.md
│   │   ├── tenant-resolution-discovery.md
│   │   ├── tenant-aware-queues-discovery.md
│   │   ├── security-isolation-discovery.md
│   │   └── tenant-migration-strategy-discovery.md
│   ├── knowledge/
│   │   ├── global-scope-implementation.md
│   │   ├── db-connection-switching.md
│   │   ├── queue-context-serialization.md
│   │   └── cross-tenant-test-patterns.md
│   ├── rules/
│   │   ├── isolation-pattern-selection.md
│   │   ├── tenant-resolver-middleware.md
│   │   ├── tenant-aware-job-trait.md
│   │   └── isolation-testing.md
│   └── ku/
│       ├── data-isolation.ku.md
│       ├── tenant-resolution.ku.md
│       ├── tenant-queues.ku.md
│       └── tenant-security.ku.md
│
└── shared/
    ├── token-lifecycle.md
    ├── session-management.md
    ├── encryption-primitives.md
    ├── hashing-algorithms.md
    ├── middleware-execution-order.md
    └── security-testing-patterns.md
```

## Domain → Subdomain Mapping

| Domain Analysis Section | ECC Folder | Rationale |
|---|---|---|
| Authentication Systems | `01-authentication/` | Core identity verification; first concern in request lifecycle |
| Authorization (Gates, Policies, RBAC/ABAC) | `02-authorization/` | Second concern after authentication; determines what authenticated users can do |
| Security Hardening (CSRF, XSS, SQLi, Headers) | `03-hardening/` | Proactive application hardening against web vulnerabilities |
| Threat Mitigation (Rate Limiting, Validation, Encryption) | `04-threat-mitigation/` | Active defense layer against attacks and abuse |
| Secrets Management (Vaults, Key Rotation) | `05-secrets/` | Credential lifecycle management distinct from application code |
| Audit Logging | `06-audit-logging/` | Observability and compliance; cross-cuts all other subdomains |
| Multi-Tenancy Security | `07-multi-tenancy/` | Specialized isolation patterns; relevant to SaaS architecture |
| Cross-cutting concerns (Tokens, Sessions, Crypto) | `shared/` | Concepts that span multiple subdomains without single ownership |

## Future Growth Considerations

1. **AI Security Subdomain** — As LLM-based features become standard in Laravel applications, a new `08-ai-security/` branch may be needed to cover prompt injection defense, AI output validation, and model access control. This would surface as a first-class subdomain when application patterns stabilize.

2. **Compliance Automation Subdomain** — If regulatory compliance (SOC2, HIPAA, GDPR) controls-as-code becomes a distinct practice in the Laravel ecosystem, a `09-compliance/` branch should be created for automated evidence collection, control mapping, and audit readiness tooling.

3. **Zero Trust Architecture Subdomain** — As Laravel applications adopt zero trust principles (continuous verification, device posture, micro-segmentation), a `10-zero-trust/` branch could house knowledge around per-request re-authentication, network-level authorization, and distributed identity verification.

4. **Edge Security Subdomain** — With the growth of Laravel Vapor and edge computing patterns, serverless-specific security concerns (cold-start auth, edge-computed policies, distributed session management) may warrant an `11-edge-security/` branch.

5. **Subdomain Expansion** — The `05-secrets/` folder will grow significantly as KMS provider abstraction matures (AWS KMS, GCP Cloud KMS, Azure Key Vault, HashiCorp Vault Transit). Each provider may warrant its own knowledge file within `knowledge/`.

6. **Rule Proliferation** — The `rules/` folders are expected to grow faster than `knowledge/` as more decision trees, checklists, and executable rules are extracted from the knowledge base. Consider a `rules/` subfolder per knowledge card for complex domains (e.g., `02-authorization/rules/permission-checking/`).

7. **Octane/Swoole Safety** — State management under long-running processes (Octane, Swoole, RoadRunner) is a cross-cutting concern that may grow into its own section within `shared/` or a dedicated subdomain if pattern complexity warrants it.
