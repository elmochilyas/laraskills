# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 07-infrastructure-as-code
**Knowledge Unit:** ansible-provisioning
**Difficulty:** Intermediate
**Category:** Infrastructure as Code
**Last Updated:** 2026-06-03

# Overview

Ansible is an open-source configuration management and provisioning tool that uses YAML playbooks to automate server setup. For Laravel, Ansible playbooks configure Ubuntu servers with PHP extensions, Nginx, MySQL/PostgreSQL, Redis, Supervisor, Composer, and application deployment. Ansible is agentless (SSH-based) and idempotent.

Ansible exists because manual server configuration does not scale and is error-prone. The engineering value is repeatable, version-controlled server configuration with a single tool that handles both initial provisioning and ongoing configuration drift correction.

# When To Use

- Infrastructure-as-code approach to server configuration
- Teams preferring YAML-based configuration (no DSL to learn)
- Heterogeneous environments (Ansible manages any SSH-accessible server)
- Compliance requirements for auditable configuration changes

# When NOT To Use

- Docker-based deployments (container images replace server config)
- Single-server deployments where Forge/Ploi suffice
- Teams without SSH key management for target servers

# Core Concepts

- **Playbook** — YAML file defining desired server state
- **Role** — Reusable collection of tasks, handlers, variables
- **Inventory** — List of managed servers with connection parameters
- **Task** — Single configuration operation (install package, copy file)
- **Handler** — Task triggered by notification (restart service on config change)
- **Idempotency** — Running playbook multiple times produces same result

# Best Practices

**Use Roles.** Organize playbooks into roles (php, nginx, mysql, redis, supervisor) for reusability.

**Ansible Vault for Secrets.** Encrypt sensitive variables with `ansible-vault encrypt`.

**Test with Molecule.** Test role execution in Docker containers before production.

**Use Handlers for Service Restarts.** Notify handlers on config file changes to avoid unnecessary restarts.

# Related Topics

**Prerequisites:** Linux administration, SSH, YAML
**Closely Related:** Terraform (infrastructure provisioning), Ansible Packer (golden images)
**Advanced Follow-Ups:** AWX/AAP, Molecule Testing, Ansible Vault
