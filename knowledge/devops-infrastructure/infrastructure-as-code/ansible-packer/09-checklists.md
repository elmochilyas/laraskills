# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 07-infrastructure-as-code
**Knowledge Unit:** ansible-packer
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Ansible playbook structure defined (inventory, variables, roles, tasks, handlers)
- [ ] Laravel-specific roles created (PHP-FPM, Nginx, MySQL, Redis, Supervisor, Composer)
- [ ] Secret management via Ansible Vault configured
- [ ] Idempotent provisioning patterns implemented (check mode, handlers)
- [ ] CI/CD integration configured for playbook execution
- [ ] `ansible.cfg` configured with recommended defaults

---

# Architecture Checklist

- [ ] Playbook architecture designed (inventory groups, role composition, variable precedence)
- [ ] Role decomposition for Laravel: PHP-FPM, Nginx, MySQL, Redis, Supervisor, Composer
- [ ] Ansible Vault strategy for secrets (vault password management, CI integration)
- [ ] Idempotency architecture (state checking before modification, `changed_when`)
- [ ] CI/CD integration design (playbook execution from CI pipeline)

---

# Implementation Checklist

- [ ] `production-playbook.yml` created with Laravel server setup
- [ ] Inventory file created with host groups (web, db, cache, worker)
- [ ] Roles created for each service (PHP-FPM, Nginx, MySQL, Redis, Supervisor)
- [ ] Ansible Vault encrypted variable files created
- [ ] `ansible.cfg` configured (host key checking, SSH settings, roles path)
- [ ] Handlers defined for service restarts (notified on config change)

---

# Performance Checklist

- [ ] Playbook execution time measured and optimized
- [ ] Idempotent checks ensure unchanged services are not restarted
- [ ] Handler notification only on config change (no unnecessary restarts)
- [ ] Fact caching enabled (`gathering: smart`) for faster runs
- [ ] Pipelining enabled in ansible.cfg for faster SSH execution

---

# Security Checklist

- [ ] Vault password stored securely (CI secret, not in repository)
- [ ] SSH key-based authentication for Ansible connections
- [ ] Encrypted variables for all secrets (DB passwords, API keys)
- [ ] No secrets in plain-text variables or playbooks
- [ ] `become` used with caution (limited sudo scope)

---

# Reliability Checklist

- [ ] Playbook run multiple times produces same state (idempotency)
- [ ] Handler restarts only when configuration changes
- [ ] Failed task handling defined (`ignore_errors`, `failed_when`)
- [ ] Rollback playbook defined for reverting server configuration
- [ ] Check mode (`--check`) tested before production apply

---

# Testing Checklist

- [ ] Playbook syntax checked (`ansible-playbook --syntax-check`)
- [ ] Check mode run against staging (`--check --diff`)
- [ ] Idempotency verified (second run makes no changes)
- [ ] Vault decryption tested in CI environment
- [ ] Role testing with Molecule evaluated

---

# Maintainability Checklist

- [ ] Playbooks and roles version-controlled
- [ ] Role documentation in each role's README
- [ ] Variable files organized per environment
- [ ] Vault password rotation procedure documented
- [ ] Playbook runbook documented with common commands

---

# Anti-Pattern Prevention Checklist

- [ ] No plain-text secrets in playbooks or variables
- [ ] No shell commands when Ansible modules exist (`apt`, `copy`, `template`)
- [ ] No hardcoded IPs in inventory (use dynamic inventory)
- [ ] No manual server modifications outside Ansible (configuration drift)
- [ ] No playbook with `--check` failures in production

---

# Production Readiness Checklist

- [ ] Playbook run and verified on staging environment
- [ ] Vault password available in CI/CD as secure secret
- [ ] Idempotency verified (second run is clean)
- [ ] Check mode passes without errors
- [ ] Rollback playbook tested
- [ ] Ansible version pinned in requirements

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: playbook, inventory, roles, vault designed
- [ ] Security requirements satisfied: vault for secrets, key-based SSH, limited become
- [ ] Performance requirements satisfied: fact caching, pipelining, handler optimization
- [ ] Testing requirements satisfied: syntax check, check mode, idempotency verified
- [ ] Anti-pattern checks passed: no plain-text secrets, no shell abuse, no drift
- [ ] Production readiness verified: staging run, vault in CI, rollback playbook tested

---

# Related References

- Terraform (complementary)
- Forge/Ploi (UI alternative)
- Docker (container alternative)
