# Anti-Patterns: Secure Secrets & Configuration Management

## Metadata

| Attribute | Value |
|-----------|-------|
| **ID** | ku-03 |
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | AI Safety & Security |
| **Type** | Security |
| **Version** | 1.0.0 |
| **Status** | Standardized |

## Anti-Pattern Inventory

1. [Config Files as Secrets](#1-config-files-as-secrets)
2. [Hardcoded Fallback Defaults](#2-hardcoded-fallback-defaults)
3. [Shared Service Account Credentials](#3-shared-service-account-credentials)
4. [Vault as a File System](#4-vault-as-a-file-system)
5. [No Offboarding Process](#5-no-offboarding-process)

---

## 1. Config Files as Secrets

### Category
Secrets Storage Violation

### Description
Encrypting entire configuration files (`.env.encrypted`, `config.php.enc`) and committing them to version control instead of using a dedicated secrets manager. This treats sensitive and non-sensitive configuration identically, makes rotation impossible without deploys, and exposes all config if the encryption key is compromised.

### Why It Happens
- Familiarity with version control workflows
- Convenience: everything is in one place, encrypted
- Lack of infrastructure for a real secrets manager
- Misunderstanding: "encrypted config files are secure enough"

### Warning Signs
- Encrypted config files exist in the git repository
- Decryption keys are stored in CI/CD variables or shared via team chat
- Changing a single secret requires re-encrypting the entire file and redeploying
- No audit trail for who accessed which secret when
- Secrets cannot be rotated independently

### Why Harmful
- A single decryption event exposes all secrets simultaneously
- Rotation requires full deploy cycle, making emergency rotation slow
- No access audit: you don't know who decrypted the config or when
- Different environments (dev/staging/prod) share similar config structure, increasing risk
- Team members must share decryption keys, violating least privilege

### Real-World Consequences
- Git history contains every version of every secret when encryption was first implemented
- Compromised CI/CD pipeline exposes all secrets from the encrypted file
- Emergency key rotation takes hours instead of minutes
- Compliance audit fails due to lack of per-secret access logging

### Preferred Alternative
Use a dedicated secrets manager (Vault, AWS Secrets Manager, Azure Key Vault, GCP Secret Manager). Store only non-sensitive configuration in config files. Fetch secrets at application startup and cache in memory.

### Refactoring Strategy
1. Migrate secrets from encrypted config files to a secrets manager
2. Implement a `SecretManager` service that fetches and caches secrets
3. Create configuration files that reference the secret manager (not hardcoded secrets)
4. Set up CI/CD to inject environment-specific secret identifiers
5. Remove encrypted config files from the repository
6. Add git-secrets scanning to prevent re-introduction

### Detection Checklist
- [ ] No encrypted config files exist in the repository
- [ ] Secrets are stored in a dedicated secrets manager
- [ ] Each secret is independently rotatable without redeploy
- [ ] Secret access is logged and auditable
- [ ] Git history is scanned for committed secrets

### Related Rules/Skills/Trees
- Skill: Implement Secure Secrets Management
- Decision Tree: Security Configuration

---

## 2. Hardcoded Fallback Defaults

### Category
Secrets Leak Vector

### Description
Including actual secret values as fallback defaults in configuration files. A common pattern: `config('openai.key') ?? 'sk-...'` where the fallback is a real API key. This embeds secrets in config files that may be committed, cached, or exposed through error messages and debugging output.

### Why It Happens
- Development convenience: the app works without environment configuration
- Copy-paste from documentation that shows placeholder values
- "Temporary" shortcuts that become permanent
- Misunderstanding of Laravel's `env()` default parameter behavior

### Warning Signs
- Config files contain long string defaults that look like API keys
- `env('VARIABLE', 'actual-key-value-here')` patterns in config
- The application works without a `.env` file (because it falls back to real keys)
- Error messages in development show config values including keys

### Why Harmful
- Secrets in config files can be committed to git accidentally
- Laravel config caching includes these values in cached config files
- Error stack traces may expose config values to users
- Any code that reads and logs config values will expose the secret
- Removes the incentive to set up proper environment configuration

### Real-World Consequences
- API keys committed to public repositories during initial scaffolding
- Production cached config exposes keys in deployment artifacts
- Support screenshots showing error pages with visible API keys
- Third-party tooling that reads config files gains access to all secrets

### Preferred Alternative
Never use real secrets as default values. Use `env('VARIABLE')` without defaults for required secrets, or use placeholder values that are obviously fake (`sk-placeholder`, `your-api-key-here`). Fail early and loudly when required secrets are missing.

```php
// Bad
'key' => env('OPENAI_KEY', 'sk-real-key-abc123'),

// Good
'key' => env('OPENAI_KEY'),
```

### Refactoring Strategy
1. Audit all config files for real secret values in defaults
2. Replace real defaults with empty strings or obvious placeholders
3. Add validation in `AppServiceProvider` that checks required secrets are set
4. Add CI pipeline check that prevents real secret patterns in config files
5. Rotate any secrets that were exposed through config defaults

### Detection Checklist
- [ ] No config file contains real secret values as defaults
- [ ] Required secrets fail loudly when missing (no silent fallback)
- [ ] CI pipeline scans config files for secret patterns
- [ ] Config cache does not contain secret values

### Related Rules/Skills/Trees
- Rule: Never commit secrets to version control
- Skill: Implement Secure Secrets Management

---

## 3. Shared Service Account Credentials

### Category
Least Privilege Violation

### Description
Using a single set of credentials (API key, service account) across all environments, services, or applications. A single API key for OpenAI is shared between dev, staging, and production; or multiple microservices use the same database credentials. This eliminates the ability to isolate incidents, rotate credentials per service, or audit per-service access.

### Why It Happens
- Initial setup simplicity: one key for everything works immediately
- Cost constraints: some services charge per API key or account
- Organizational silos: different teams don't coordinate credential management
- Legacy architecture: systems were designed before service decomposition

### Warning Signs
- The same API key works in development and production environments
- Multiple services use the same database credentials
- Microservices authenticate to each other using shared tokens
- No concept of per-service or per-environment identity
- Credential rotation requires coordinated downtime across services

### Why Harmful
- A compromised dev key exposes production resources
- Cannot audit which service accessed which resource
- Rotating credentials requires coordinated change across all services
- One service's abuse (exceeding rate limits) affects all services
- Violates the principle of least privilege: each service gets more access than needed

### Real-World Consequences
- Dev environment key leak exposes production AI budget to attackers
- One misconfigured microservice consumes all LLM quota, blocking other services
- Compliance audit fails due to lack of access isolation
- Emergency key rotation takes days instead of minutes

### Preferred Alternative
Provision unique credentials per environment, per service, and per deploy. Each environment (dev/staging/prod) gets its own keys, and each service within an environment gets its own identity with minimum required permissions.

### Refactoring Strategy
1. Inventory all shared credentials across environments and services
2. Create service-specific credentials with minimum required permissions
3. Implement per-environment secret namespaces in the secrets manager
4. Update deployment pipelines to inject environment-specific and service-specific credentials
5. Add monitoring for cross-environment credential usage (anomaly detection)

### Detection Checklist
- [ ] Each environment has unique credentials
- [ ] Each service has its own identity and permissions
- [ ] Credential usage is auditable per service
- [ ] Credential rotation for one service does not affect others

### Related Rules/Skills/Trees
- Rule: Apply least privilege
- Skill: Implement Secure Secrets Management

---

## 4. Vault as a File System

### Category
Secrets Manager Misuse

### Description
Storing entire configuration files, application settings, or non-sensitive metadata in the secrets manager as if it were a file system. The vault contains not just secrets but also log levels, feature flags, model names, and other configuration that doesn't need encryption or access control. This bloats the vault, increases access audit noise, and makes finding actual secrets harder.

### Why It Happens
- "Centralized config" philosophy: put everything in one place
- Misunderstanding of what constitutes a secret vs. configuration
- Vault provides nice versioning and access features that config files don't
- Over-engineering: treating all config as if it needs secrets-level protection

### Warning Signs
- The secrets manager stores values that are not sensitive: log levels, timeouts, model names
- Hundreds of secrets exist, most of which are non-sensitive configuration
- Audit logs show constant reads of non-secret values, hiding actual secret access
- Configuration changes require vault access grants, blocking developer productivity
- Application startup is slow due to fetching hundreds of vault entries

### Why Harmful
- Noise in access logs makes security auditing difficult
- Non-sensitive configuration changes require vault access (unnecessary friction)
- Vault storage costs increase unnecessarily
- Actual secrets are harder to find among the non-secret noise
- Developers are more likely to commit secrets to code because vault access is painful

### Real-World Consequences
- Security team cannot distinguish between secret access and config reads in audit logs
- Feature flag changes require vault PRs instead of simple config file updates
- Vault secret count exceeds licensing limits, requiring cleanup project
- Emergency secret rotation is delayed because the vault is cluttered

### Preferred Alternative
Keep secrets manager focused on actual secrets: credentials, tokens, keys, passwords. Store non-sensitive configuration in version-controlled config files, environment files, or a dedicated configuration service (not the vault).

### Refactoring Strategy
1. Classify all vault entries as "secret" or "configuration"
2. Migrate configuration entries to config files or environment variables
3. Remove non-secret entries from the vault
4. Set up vault access policies that limit which users/services can read which secrets
5. Add a linting rule that prevents adding non-secret values to the vault

### Detection Checklist
- [ ] Vault contains only actual secrets (credentials, keys, tokens)
- [ ] Non-sensitive configuration is in config files, not the vault
- [ ] Access audit shows only secret reads (not config reads)
- [ ] Vault entry count is proportional to actual secret count

### Related Rules/Skills/Trees
- Skill: Implement Secure Secrets Management

---

## 5. No Offboarding Process

### Category
Access Lifecycle Failure

### Description
Having no automated process to revoke a departing team member's access to secrets and credentials. When a developer leaves the organization, their API keys, vault access, service account access, and knowledge of secret locations persist indefinitely, creating a permanent exposure risk.

### Why It Happens
- HR and IT processes are separate and poorly coordinated
- No inventory of which secrets each team member can access
- "We trust our people" mindset
- Manual offboarding checklists that are inconsistently followed
- Shared credentials where individual revocation would break things

### Warning Signs
- No automated offboarding playbook exists
- Developer-issued API keys persist after departure
- No periodic access review for secrets
- Former team members still appear in vault access policies
- Secrets were shared via personal channels (email, chat) that aren't revoked

### Why Harmful
- Former employees retain access to production credentials indefinitely
- Disgruntled ex-employees can cause damage using known secrets
- Compliance audits flag lack of timely access revocation
- Secrets shared via personal channels cannot be centrally revoked
- No inventory means you don't know what secrets were exposed

### Real-World Consequences
- Ex-employee's personal device with stored API keys is compromised
- Automated systems using shared credentials cannot distinguish former from current employees
- SOC2/HIPAA audit findings for insufficient access revocation controls
- Cost accrual from unused API keys that should have been revoked

### Preferred Alternative
Implement automated offboarding: when an employee is deprovisioned in HR systems, a webhook triggers immediate revocation of all personal credentials, removal from vault access policies, and notification to team leads to rotate any shared secrets the employee knew.

### Refactoring Strategy
1. Inventory all credential types and who has access
2. Create HR system integration that triggers offboarding on departure
3. Implement API key scoping per individual (avoid shared credentials)
4. Set up vault access policies scoped to individuals, not groups
5. Create a quarterly access review process
6. Document and test the offboarding playbook regularly

### Detection Checklist
- [ ] Departing employees' credentials are revoked within 24 hours
- [ ] No shared credentials prevent individual revocation
- - [ ] Vault access is auditable per individual
- [ ] Offboarding playbook exists and is tested
- [ ] Periodic access reviews identify stale access

### Related Rules/Skills/Trees
- Skill: Implement Secure Secrets Management
- Decision Tree: Security Configuration
