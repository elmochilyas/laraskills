# Decomposition: Ansible Provisioning

## Topic Overview
Ansible is an open-source configuration management and provisioning tool that uses YAML playbooks to automate server setup. For Laravel, Ansible playbooks configure Ubuntu servers with: PHP (with required extensions), Nginx (with site configurations), MySQL/PostgreSQL, Redis, Supervisor (for queue workers), Composer, and application deployment. Ansible is agentless (SSH-based) and idempotent — running a playbook multiple times produces the same result.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ansible-provisioning/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Ansible Provisioning
- **Purpose:** Ansible is an open-source configuration management and provisioning tool that uses YAML playbooks to automate server setup.
- **Difficulty:** Intermediate
- **Dependencies:** Terraform for Laravel (KU-018) — infrastructure provisioning paired with Ansible, Laravel Forge Provisioning (KU-001) — Ansible alternative for server management, Production Dockerfiles (KU-010) — containerized alternative to Ansible-managed servers, Environment & Secret Management (KU-021) — secrets in Ansible Vault

## Dependency Graph
**Depends on:**
- Terraform for Laravel (KU-018) — infrastructure provisioning paired with Ansible
- Laravel Forge Provisioning (KU-001) — Ansible alternative for server management
- Production Dockerfiles (KU-010) — containerized alternative to Ansible-managed servers
- Environment & Secret Management (KU-021) — secrets in Ansible Vault

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Playbooks:** YAML files defining the desired server state. A playbook maps group
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- Terraform for Laravel (KU-018) — infrastructure provisioning paired with Ansible, Laravel Forge Provisioning (KU-001) — Ansible alternative for server management, Production Dockerfiles (KU-010) — containerized alternative to Ansible-managed servers, Environment & Secret Management (KU-021) — secrets in Ansible Vault

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