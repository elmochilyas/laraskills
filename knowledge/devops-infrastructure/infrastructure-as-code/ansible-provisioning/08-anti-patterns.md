# Anti-Patterns: Ansible Provisioning

## AP-ANSIBLE-001: The Monolithic Playbook
**Description:** A single playbook file with hundreds of tasks, no roles, no includes.
**Consequences:** Playbook is not reusable across projects. Debugging is difficult. Team collaboration is impossible.
**Remediation:** Use roles and includes. Each role is independently testable and reusable.

## AP-ANSIBLE-002: Secrets in Plain Text
**Description:** Database passwords and API keys written directly in playbook files.
**Consequences:** Anyone with repository access has production credentials.
**Remediation:** Use Ansible Vault for all sensitive variables. Store vault password in CI/CD secrets.
