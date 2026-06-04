# Ansible Provisioning

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Infrastructure as Code
- **Knowledge Unit:** Ansible Provisioning
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Ansible is an open-source configuration management and provisioning tool that uses YAML playbooks to automate server setup. For Laravel, Ansible playbooks configure Ubuntu servers with PHP extensions, Nginx, MySQL/PostgreSQL, Redis, Supervisor, Composer, and application deployment. It is agentless (SSH-based) and idempotent.

---

## Core Concepts

- **Playbook** — YAML file defining desired server state with plays and tasks
- **Role** — Reusable collection of tasks, handlers, variables, and templates
- **Inventory** — List of managed servers with connection parameters and groups
- **Task** — Single configuration operation (install package, copy file, start service)
- **Handler** — Task triggered by notification from another task (restart service on config change)
- **Idempotency** — Running a playbook multiple times produces the same result; Ansible detects when a task's desired state is already achieved and skips it

---

## Mental Models

- **Desired State Declaration** — You describe what the server should look like; Ansible makes it so. If Nginx should be installed and running, write that once and Ansible ensures it on every run.
- **Agentless by Design** — Ansible uses SSH — no agent installation required. This simplifies initial setup but means every playbook run requires SSH connectivity.
- **Roles as Building Blocks** — Roles are reusable infrastructure components. A `php` role installs PHP; an `nginx` role configures Nginx. Combine roles to build complete server configurations.

---

## Internal Mechanics

Ansible connects to target servers via SSH, copies the playbook and any required files to the target, then executes tasks sequentially. Each task performs a module operation (e.g., `apt`, `copy`, `template`, `service`). Modules check the current state before making changes — if the desired state is already achieved, the task reports "ok" and makes no changes. Tasks can notify handlers when changes occur. Handlers run at the end of the playbook, typically to restart services after configuration changes.

---

## Patterns

- **Use Roles** — Organize playbooks into roles (php, nginx, mysql, redis, supervisor) for reusability and separation of concerns
- **Ansible Vault for Secrets** — Encrypt sensitive variables with `ansible-vault encrypt` so they can be committed to version control
- **Test with Molecule** — Test role execution in Docker containers before applying to production servers
- **Use Handlers for Service Restarts** — Notify handlers on config file changes to avoid unnecessary restarts

---

## Architectural Decisions

- **Ansible vs. Forge/Ploi** — Use Ansible for infrastructure-as-code approach with full control; use Forge/Ploi for simpler deployments without configuration management expertise
- **Ansible vs. Terraform** — Ansible configures OS and software (configuration management); Terraform provisions cloud resources (infrastructure provisioning). They are complementary.
- **Ansible vs. Docker** — Ansible configures servers directly; Docker packages applications with their dependencies. Use Ansible for server setup and Docker for application isolation.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Agentless (SSH-based) | SSH connectivity required for every run | Network issues or key problems block configuration |
| Idempotent playbooks | YAML complexity for complex logic | Conditional and loop constructs can be challenging |
| Roles promote reusability | Role dependency management | Role versioning and compatibility must be tracked |
| Ansible Vault for secrets | Vault password management | Vault password must be securely distributed to team |

---

## Performance Considerations

Playbook execution time scales with number of tasks and servers. Serial execution across servers can be slow for large fleets — use `serial` and `forks` configuration for parallelism. Handler notification groups restart at the end to batch service restarts. Fact gathering (collecting server information) adds overhead — disable unnecessary fact gathering with `gather_facts: no` when not needed.

---

## Production Considerations

Use inventory files with host groups for environment separation (staging, production). Ansible Vault encrypts sensitive variables for secure version control. Test playbooks with Molecule before production. Delegate database operations to a single server with `delegate_to` to avoid race conditions. Implement `--check` mode in CI/CD for change preview. Use `ansible-lint` to enforce playbook best practices.

---

## Common Mistakes

- **Not Using Roles** — Writing all tasks in a single playbook without role separation leads to duplication and maintenance difficulty.
- **Missing Idempotency** — Tasks that don't account for current state cause changes on every run. Always use module parameters that support idempotency.
- **No Vault for Secrets** — Storing database passwords and API keys in plain text in playbooks committed to version control.
- **Testing in Production** — Running playbooks directly on production servers without testing in staging or Molecule first.

---

## Failure Modes

- **SSH Connection Failure** — Ansible cannot connect to target server. Detection: playbook fails with SSH connection error. Mitigation: verify SSH keys, network connectivity, and target server status.
- **Package Repository Unavailable** — APT cache is stale or repository is unreachable. Detection: `apt` task fails with repository errors. Mitigation: configure `apt` module with `update_cache: yes` and retry logic.
- **Idempotency Failure** — Task changes state on every run despite no configuration change. Detection: handler fires unnecessarily. Mitigation: verify module parameters support idempotency, file tasks should use `checksum` validation.
- **Vault Decryption Failure** — Ansible Vault password unavailable or incorrect. Detection: playbook fails with decryption error. Mitigation: ensure vault password is available in CI/CD environment.

---

## Ecosystem Usage

Ansible is a popular choice for Laravel infrastructure teams that need version-controlled, auditable server configuration. Ansible roles for PHP, Nginx, MySQL, and Redis are available from Ansible Galaxy. Ansible complements Terraform in the Laravel IaC stack: Terraform provisions cloud resources, Ansible configures them. Ansible is also used with Packer for golden image creation. Teams with compliance requirements prefer Ansible's audit trail and idempotent execution.

---

## Related Knowledge Units

### Prerequisites
- Linux administration, SSH, YAML

### Related Topics
- Terraform (infrastructure provisioning complement)
- Ansible Packer (golden image creation)

### Advanced Follow-up Topics
- AWX/AAP (Ansible automation controller)
- Molecule Testing
- Ansible Vault

---

## Research Notes

Ansible provides agentless configuration management for Laravel servers. Use roles for reusability and organization. Ansible Vault encrypts secrets in playbooks. Molecule tests roles in isolation. Ansible complements Terraform — Terraform creates infrastructure, Ansible configures it. Idempotency is the key design principle — every task should check current state before making changes.
