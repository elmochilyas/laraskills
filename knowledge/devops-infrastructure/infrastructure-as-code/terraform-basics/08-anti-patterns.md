# Anti-Patterns: Terraform Basics

## AP-TF-001: Local State in Git
**Description:** Committing `terraform.tfstate` to version control.
**Consequences:** Sensitive infrastructure details exposed in repository. State conflicts when multiple team members run apply.
**Remediation:** Use remote state backend. Add `*.tfstate*` to `.gitignore`.

## AP-TF-002: No Workspace Separation
**Description:** Using a single set of `.tf` files for all environments without variables or modules.
**Consequences:** Dev and production infrastructure differ. Applying changes meant for dev affects production.
**Remediation:** Use Terraform workspaces or separate directory structures per environment.

## AP-TF-003: Manual Resource Management
**Description:** Some resources managed by Terraform, others manually in cloud console.
**Consequences:** Terraform state becomes inconsistent with reality. Next apply may delete manually created resources.
**Remediation:** All infrastructure under Terraform management or use `import` to bring existing resources under management.
