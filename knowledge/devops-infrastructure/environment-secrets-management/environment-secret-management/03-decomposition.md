# Decomposition: Environment & Secret Management

## Topic Overview
Environment and secret management encompasses how Laravel applications handle configuration across different environments (local, staging, production) and how sensitive values (API keys, database passwords, app keys) are stored, transmitted, and rotated. The Laravel ecosystem supports multiple approaches: `.env` files (the simplest), first-party tools (Forge env management, Vapor env push/pull), third-party vaults (Doppler, HashiCorp Vault), and cloud-native solutions (AWS Secrets Manager, SSM Parameter Store, GitHub Actions Secrets). The core principles are: never commit secrets to Git, use `.env.example` as a template, encrypt secrets at rest and in transit, and implement least-privilege access to secrets.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
environment-secret-management/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Environment & Secret Management
- **Purpose:** Environment and secret management encompasses how Laravel applications handle configuration across different environments (local, staging, production) and how sensitive values (API keys, database passwords, app keys) are stored, transmitted, and rotated.
- **Difficulty:** Intermediate
- **Dependencies:** Laravel Forge Provisioning (KU-001) — env management in Forge, Laravel Vapor (KU-015) — Vapor env push/pull, CI/CD Pipelines (KU-008/009) — CI secrets injection, Database Deployment & Migration (KU-019/020) — DB credentials management, Terraform for Laravel (KU-018) — secrets in IaC state files

## Dependency Graph
**Depends on:**
- Laravel Forge Provisioning (KU-001) — env management in Forge
- Laravel Vapor (KU-015) — Vapor env push/pull
- CI/CD Pipelines (KU-008/009) — CI secrets injection
- Database Deployment & Migration (KU-019/020) — DB credentials management
- Terraform for Laravel (KU-018) — secrets in IaC state files

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- `.env` file pattern:** The `.env` file is never committed to version control. It
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- Laravel Forge Provisioning (KU-001) — env management in Forge, Laravel Vapor (KU-015) — Vapor env push/pull, CI/CD Pipelines (KU-008/009) — CI secrets injection, Database Deployment & Migration (KU-019/020) — DB credentials management, Terraform for Laravel (KU-018) — secrets in IaC state files

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization