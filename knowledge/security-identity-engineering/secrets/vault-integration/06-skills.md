# Skill: Integrate HashiCorp Vault for Centralized Secrets Management

## Purpose
Connect Laravel to HashiCorp Vault to dynamically retrieve secrets (database credentials, API keys, encryption keys) at runtime instead of storing them in `.env` files.

## When To Use
- Enterprise environments requiring centralized secrets management
- Dynamic secrets (short-lived database credentials auto-rotated by Vault)
- Compliance requiring audit trails for secrets access
- Multi-service architectures sharing secrets via Vault

## When NOT To Use
- Small applications where `.env` files are sufficient
- When Vault infrastructure and maintenance cost is not justified
- Offline or air-gapped environments without Vault access

## Prerequisites
- HashiCorp Vault server deployed and configured
- Vault authentication method set up (AppRole, Token, Kubernetes)
- `composer require hashicorp/vault-client` or similar

## Workflow
1. Install Vault PHP client library
2. Configure Vault connection (address, auth method, mount path)
3. Authenticate to Vault (AppRole with role_id + secret_id, or token)
4. Retrieve secrets at application boot: database credentials, API keys, encryption keys
5. Set retrieved values into Laravel config: `config(['database.connections.mysql.password' => $vaultSecret])`
6. Implement Vault token renewal for long-running processes (queue workers)
7. Handle Vault downtime with fallback to cached credentials
8. Log Vault access attempts for audit trail
9. Never cache Vault secrets in `.env` or config files

## Validation Checklist
- [ ] Vault client installed and configured
- [ ] Authentication method configured (AppRole preferred)
- [ ] Secrets retrieved at boot and injected into Laravel config
- [ ] Token renewal implemented for queue workers
- [ ] Fallback strategy for Vault downtime
- [ ] Vault access logged for audit
- [ ] No secrets cached in `.env` or config files
