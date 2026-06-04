# Rules: Ansible Provisioning

## ANSIBLE-001: Role-Based Organization
**Condition:** Ansible playbook collection for Laravel
**Action:** Organize configuration into roles (php, nginx, mysql, redis, supervisor)
**Rationale:** Monolithic playbooks are not reusable across projects
**Consequences:** Violation duplicates configuration across projects

## ANSIBLE-002: Idempotent Tasks
**Condition:** Ansible task modifies system state
**Action:** Write tasks that produce identical result on repeated execution
**Rationale:** Non-idempotent tasks cause configuration drift on each playbook run
**Consequences:** Violation causes unpredictable server state after multiple runs

## ANSIBLE-003: Vault for Secrets
**Condition:** Playbook contains sensitive variables
**Action:** Use `ansible-vault encrypt` for passwords, API keys, and tokens
**Rationale:** Plaintext secrets in playbooks expose credentials to all users with repository access
**Consequences:** Violation exposes production credentials in version control

## ANSIBLE-004: Handlers for Service Restarts
**Condition:** Config file modified by task
**Action:** Use handler-notify pattern, not inline restart commands
**Rationale:** Unnecessary service restarts cause brief downtime on each playbook run
**Consequences:** Violation restarts services even when configuration hasn't changed
