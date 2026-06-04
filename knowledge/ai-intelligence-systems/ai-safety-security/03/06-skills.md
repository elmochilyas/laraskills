# Skill: Manage Secrets and Configuration Securely

## Purpose
Securely manage API keys, tokens, and credentials across AI system components using a dedicated secrets manager with encryption, automated rotation, access auditing, and emergency revocation — preventing credential leakage and limiting blast radius.

## When To Use
- Any production AI system with third-party API keys (LLM providers, vector databases, monitoring services)
- Multi-environment deployments requiring different credentials per environment
- Teams with compliance requirements (SOC2, HIPAA, PCI-DSS) requiring secrets management controls
- Systems where multiple applications share provider keys (centralized management needed)

## When NOT To Use
- Local development prototyping (environment variables are acceptable temporarily)
- Single-developer, single-deployment hobby projects (overhead may exceed risk)

## Prerequisites
- KU-03 (Secure Secrets & Configuration Management) — understanding of secret types and risks
- Secrets manager (Vault, AWS Secrets Manager, Azure Key Vault, GCP Secret Manager)
- Access to all provider accounts for key rotation
- Git repository scanning tool (truffleHog, git-secrets) for leak detection

## Inputs
- List of all secrets in the system (provider API keys, database credentials, encryption keys, signing secrets)
- Provider account access for each secret
- Secrets manager configuration
- Rotation schedule (default 90 days)
- Access control policies (who/what can read each secret)

## Workflow
1. **Inventory all secrets**: List every credential in the system: LLM provider keys, vector DB credentials, monitoring service tokens, database passwords, encryption keys, signing secrets. Classify by sensitivity.
2. **Set up secrets manager**: Deploy and configure a secrets manager (Vault for self-hosted, AWS Secrets Manager for AWS-native, Azure Key Vault for Azure-native). Store all production secrets there.
3. **Migrate secrets from env/config**: Move all secrets from .env files, config files, and environment variables to the secrets manager. Use mock/stub credentials for local development.
4. **Implement secret fetching at startup**: Create a service provider that fetches all secrets at application startup and caches them in-memory with a 5-15 minute TTL. Never fetch from vault on the request path.
5. **Configure automated rotation**: Set up key rotation every 90 days. Generate new key → validate against provider → update vault → wait for cache TTL → revoke old key. Use secrets manager's built-in rotation if available.
6. **Implement least privilege access**: Each environment (dev, staging, production) has separate keys. Each service has its own credentials with minimum required permissions. Document who can access which secrets.
7. **Audit secret access**: Enable access logging on the secrets manager. Monitor for unusual access patterns (off-hours reads, unexpected services, high frequency). Set up alerts.
8. **Implement emergency revocation**: Create a runbook for secret compromise: revoke immediately at provider → update vault → force cache refresh on all instances (short TTL) → verify old key is no longer used → rotate all related keys.
9. **Scan for leaked secrets**: Run automated git history scanning (truffleHog, git-secrets) in CI/CD. Scan logs for accidental exposure. Alert on any detected leaks.
10. **Review and prune quarterly**: Audit the secrets inventory. Remove unused secrets. Validate rotation schedules. Review access controls. Update incident response runbook.

## Validation Checklist
- [ ] No secrets are committed to version control (verified with scanning tools)
- [ ] Production secrets are stored in a dedicated secrets manager (not env vars or config files)
- [ ] Secrets are rotated on a schedule (default ≤90 days) and immediately on compromise
- [ ] Each environment (dev, staging, production) has unique secrets
- [ ] Secret access is audited (who accessed what and when)
- [ ] Secrets are never logged in application logs or error messages
- [ ] Emergency revocation process exists and is tested

## Common Failures
- **Secrets committed to git**: .env file committed with real keys, or key accidentally pasted into code. Fix: pre-commit hooks with git-secrets scanning, rotate immediately on detection.
- **Vault as bottleneck**: Every request fetches from vault, adding 5-50ms latency. Fix: cache aggressively with in-memory store and TTL refresh.
- **Rotation causes downtime**: New key not validated before old key revoked. Fix: validate new key against provider, keep both keys valid during rotation window.
- **Same key across environments**: Dev key leak compromises production. Fix: use separate keys per environment with different permissions.
- **Secrets in logs**: Debug logging includes API keys or tokens. Fix: add secret pattern redaction to log formatter.

## Decision Points
- **Secrets manager choice**: Vault for self-hosted (full control, free, complex). AWS Secrets Manager for managed (auto-rotation, higher cost). Consider existing cloud provider.
- **Cache TTL**: 5 minutes for fast revocation propagation. 15 minutes to reduce vault load. Start with 5, increase if vault becomes bottleneck.
- **Rotation schedule**: 90 days for standard risk. 30 days for high-security environments. Follow provider-mandated rotation if applicable.

## Performance Considerations
- Vault read: 5-50ms. Cache aggressively (in-memory with TTL) — key lookup should be <1ms
- Batch secret fetching: fetch all secrets in one API call at startup rather than individual fetches
- Cache refresh: scheduled TTL expiry, not per-request vault calls
- Encryption/decryption overhead: negligible (<1ms) for symmetric keys
- Memory for cached secrets: typically <10KB for all keys

## Security Considerations
- Never log secrets — implement secret pattern redaction in log formatter
- Environment isolation: dev key leak shouldn't affect production (separate keys, separate vault paths)
- Least privilege: each service gets minimum permissions (specific models, read-only if applicable)
- Revocation must propagate to all instances within seconds (cache busting)
- Runbook for compromise: immediate revocation → audit log review → rotate all related keys → notify stakeholders
- Use secret scanning tools in CI/CD to detect committed secrets before merge

## Related Rules
- Never store API keys in source code, .env files committed to git, or config files in version control
- Implement automatic key rotation on a maximum 90-day schedule
- Cache API keys in memory with TTL, never fetch from the vault on every request

## Related Skills
- Skill: Manage API Keys Securely (gateway-ku-03)
- Skill: Prevent Prompt Injection Attacks (ku-01)
- Skill: Protect PII and Data Privacy (ku-04)

## Success Criteria
- Zero secrets committed to version control (verified by automated scanning)
- 100% of production secrets stored in secrets manager with encryption at rest
- Automated rotation runs on schedule (every 90 days) with zero downtime
- Secret access is fully auditable (who, what, when for every read)
- Emergency revocation completes in <5 minutes (compromise → revoke → propagate)
- Secrets are never present in application logs, error messages, or debug output
- Quarterly audit validates inventory completeness and removes unused secrets