# Decision Trees: Environment & Secret Management

## Vault Selection

**Secret count:**
- < 10 secrets → .env files with CI/CD secrets suffice
- 10-50 secrets → Doppler (easiest integration)
- 50+ secrets → HashiCorp Vault or AWS Secrets Manager

**Compliance requirements:**
- SOC2/HIPAA → HashiCorp Vault with audit logging
- Standard → Doppler or .env files with access controls

## Secret Strategy

**Environment count:**
- 2 environments (dev + production) → .env files per environment
- 3+ environments → Vault-based solution reduces duplication
- Ephemeral environments → Vault with CI/CD integration
