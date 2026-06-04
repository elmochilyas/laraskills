# Anti-Patterns: Terraform AWS Laravel

## AP-TFAWS-001: Local State for Production
**Description:** Using local Terraform state for production infrastructure.
**Consequences:** State file loss means Terraform cannot manage existing resources. Team members cannot collaborate on infrastructure changes.
**Remediation:** Always use remote state (S3) with locking (DynamoDB) for any shared or production infrastructure.

## AP-TFAWS-002: Unreliable Destroy Prevention
**Description:** Relying on `terraform destroy` prompt confirmation instead of `prevent_destroy`.
**Consequences:** Accidental terminal confirmation destroys all resources including databases.
**Remediation:** Use `prevent_destroy = true` on critical resources. Use IAM policies to restrict destroy permissions.

## AP-TFAWS-003: Hardcoded Secrets in HCL
**Description:** Database passwords and API keys written directly in `.tf` files.
**Consequences:** Secrets committed to version control. Anyone with repository access has credentials.
**Remediation:** Use Terraform variables with `sensitive = true`. Store values in AWS Secrets Manager or Terraform Cloud.
