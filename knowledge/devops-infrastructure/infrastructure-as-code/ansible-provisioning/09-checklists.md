# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 07-infrastructure-as-code
**Knowledge Unit:** ansible-provisioning
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Ansible installed and control node configured
- [ ] Inventory file created with managed hosts (web, db, cache, worker)
- [ ] `production-playbook.yml` written with Laravel server setup
- [ ] PHP (with extensions), Nginx, MySQL/PostgreSQL, Redis roles created
- [ ] Supervisor role created for queue worker management
- [ ] Agentless SSH-based architecture understood and verified

---

# Architecture Checklist

- [ ] Playbook architecture designed (inventory, variables, roles, tasks, handlers)
- [ ] Laravel service roles decomposed (PHP-FPM, Nginx, MySQL, Redis, Supervisor, Composer)
- [ ] Idempotency pattern defined (check state before modification, `changed_when`)
- [ ] Secret management strategy determined (Ansible Vault vs external)
- [ ] Alternative evaluation: Forge vs Ploi vs Ansible documented

---

# Implementation Checklist

- [ ] Inventory file written with host groups and variables
- [ ] PHP role created (install PHP, required extensions, configure FPM pool)
- [ ] Nginx role created (install, site config, SSL template)
- [ ] MySQL/PostgreSQL role created (install, create database, user)
- [ ] Supervisor role created (install, configure queue worker)
- [ ] Composer role created (install, global config)

---

# Performance Checklist

- [ ] PHP-FPM pool settings tuned (pm.max_children calculated)
- [ ] OPcache configured in PHP role template
- [ ] Nginx `fastcgi` buffers, gzip, client_max_body_size tuned
- [ ] MySQL query cache and connection limits configured
- [ ] Playbook execution optimized (parallel tasks, serial batches)

---

# Security Checklist

- [ ] SSH key-based authentication (no passwords)
- [ ] Firewall rules defined in playbook (UFW or iptables)
- [ ] Fail2ban installed via playbook
- [ ] Unattended-upgrades configured
- [ ] PHP-FPM pool locked to localhost
- [ ] Ansible Vault for sensitive variables

---

# Reliability Checklist

- [ ] Playbook idempotency verified (run twice, no changes on second run)
- [ ] Handler restarts only on config change (not every run)
- [ ] Check mode enabled (`--check`) before production apply
- [ ] Rollback playbook defined for config revert
- [ ] Supervisor auto-restart for queue workers

---

# Testing Checklist

- [ ] Playbook syntax validated (`ansible-playbook --syntax-check`)
- [ ] `--check --diff` mode passes against staging
- [ ] Idempotency proven (second run has `changed=0`)
- [ ] All services configured correctly (curl localhost returns Laravel)
- [ ] Queue worker processed test job

---

# Maintainability Checklist

- [ ] Playbooks and roles version-controlled in repository
- [ ] Role documentation included (README per role)
- [ ] Variable files organized per environment
- [ ] Vault password rotation procedure documented
- [ ] ansible.cfg version-controlled with team defaults

---

# Anti-Pattern Prevention Checklist

- [ ] No plain-text secrets in playbooks or variables
- [ ] No `shell:` module when Ansible module exists
- [ ] No hardcoded paths (use variables)
- [ ] No manual SSH changes outside Ansible (drift prevention)
- [ ] No running playbook without `--check` in production first

---

# Production Readiness Checklist

- [ ] Playbook executed against staging and verified
- [ ] Vault password stored securely in CI/CD
- [ ] Idempotency verified (second run green)
- [ ] Check mode passes with no failures
- [ ] Rollback playbook tested
- [ ] Monitoring configured (Nightwatch or similar)

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: playbook, inventory, roles designed
- [ ] Security requirements satisfied: vault, SSH keys, firewall, fail2ban configured
- [ ] Performance requirements satisfied: PHP-FPM, OPcache, Nginx tuned
- [ ] Testing requirements satisfied: syntax, check mode, idempotency verified
- [ ] Anti-pattern checks passed: no plain-text secrets, no drift, no shell abuse
- [ ] Production readiness verified: staging run, vault in CI, rollback ready

---

# Related References

- Terraform for Laravel (KU-018) -- infrastructure provisioning paired with Ansible
- Laravel Forge Provisioning (KU-001) -- Ansible alternative for server management
- Production Dockerfiles (KU-010) -- containerized alternative to Ansible-managed servers
- Environment & Secret Management (KU-021) -- secrets in Ansible Vault
