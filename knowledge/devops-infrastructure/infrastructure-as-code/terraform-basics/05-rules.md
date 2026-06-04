# Rules: Terraform Basics

## TF-001: Remote State Required
**Condition:** Terraform project shared with team
**Action:** Configure remote state backend (S3, Terraform Cloud) with state locking
**Rationale:** Local state prevents team collaboration and is lost on machine failure
**Consequences:** Violation causes state conflicts and potential data loss

## TF-002: Review Plan Before Apply
**Condition:** Terraform apply to production environment
**Action:** Review `terraform plan` output before executing `terraform apply`
**Rationale:** Unreviewed plan can destroy or replace critical infrastructure
**Consequences:** Violation enables accidental resource deletion

## TF-003: Use Variables, Not Hardcoded Values
**Condition:** Environment-specific values in Terraform
**Action:** Define as input variables with description and type
**Rationale:** Hardcoded values prevent environment reuse and create duplication
**Consequences:** Violation requires copy-paste for each environment

## TF-004: Module Versioning
**Condition:** Using Terraform modules from registry
**Action:** Pin module versions with `version` argument
**Rationale:** Unpinned modules silently upgrade and change resource behavior
**Consequences:** Violation causes unexpected infrastructure changes
