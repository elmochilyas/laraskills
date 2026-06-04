# Decomposition: Ansible Packer

## Topic Overview
Ansible for Laravel server configuration and management. Covers playbook structure, role composition, idempotent provisioning patterns, secret management with Ansible Vault, and CI/CD integration.

## Decomposition Strategy
1. **Playbook architecture** — inventory, variables, roles, tasks, handlers
2. **Laravel-specific roles** — PHP-FPM, Nginx, MySQL, Redis, Supervisor, Composer
3. **Secret management** — Ansible Vault encryption, vault passwords, CI integration
4. **Idempotency patterns** — checking state before modification, handlers, `changed_when`
5. **CI/CD integration** — running playbooks from CI, vault password passing, deployment tags

## Proposed Folder Structure
```
infrastructure-as-code/
├── ansible-packer/
│   ├── 02-knowledge-unit.md
│   ├── 03-decomposition.md
│   ├── 04-standardized-knowledge.md
│   └── templates/
│       ├── production-playbook.yml
│       ├── ansible.cfg
│       └── vault-setup.md
```

## Knowledge Unit Inventory
- KU-020: Ansible Packer — configuration management, playbooks, Vault
- KU-018: Terraform Basics — cloud provisioning alternative/complement
- KU-019: Terraform AWS Laravel — Terraform specifics for Laravel

## Dependency Graph
- **Prerequisites:** Linux administration, SSH, YAML
- **Related:** Terraform (complementary), Forge/Ploi (UI alternative), Docker (container alternative)
- **Extends:** Manual SSH → automated playbooks → CI/CD-triggered provisioning

## Boundary Analysis
- **In scope:** Ansible playbook patterns, role design, vault integration, CI/CD integration
- **Out of scope:** Terraform (separate IaC tool), Docker/K8s (container config), Packer (image building)

## Future Expansion Opportunities
- Molecule testing for Ansible roles
- AWX/AAP enterprise integration
- Ansible + Packer for golden AMI creation
