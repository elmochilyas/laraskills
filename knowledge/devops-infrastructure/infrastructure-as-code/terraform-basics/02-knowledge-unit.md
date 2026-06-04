# Terraform Basics

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Infrastructure as Code
- **Knowledge Unit:** Terraform Basics
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-04

---

## Executive Summary

Terraform is a declarative Infrastructure as Code tool that provisions cloud resources using the HashiCorp Configuration Language (HCL). For Laravel, Terraform provisions VPC, RDS, ElastiCache, compute resources, S3, and IAM. The core workflow is plan → apply — define desired state, preview changes, then apply them.

---

## Core Concepts

- **HCL** — Declarative language for defining cloud resources in `.tf` files
- **State** — Mapping between configuration and real-world resources; Terraform's source of truth
- **Provider** — Plugin for cloud service (AWS, GCP, Azure, DigitalOcean) that translates HCL to API calls
- **Module** — Reusable group of resources that can be called from other configurations
- **Plan** — Preview of changes before applying; shows what will be created, modified, or destroyed
- **Apply** — Execute the planned changes against the cloud provider

---

## Mental Models

- **Desired State Declaration** — You describe what the infrastructure should look like; Terraform makes it so. If you want 3 EC2 instances, write `count = 3` and Terraform ensures exactly 3 exist.
- **Plan Before Act** — Never apply without reviewing the plan first. The plan is Terraform's prediction of what changes will occur. A missing plan review is the leading cause of Terraform accidents.
- **State Is Reality** — The state file maps your configuration to actual resources. If state gets corrupted or deleted, Terraform loses track of existing resources. State is the most critical file in your IaC setup.

---

## Internal Mechanics

When `terraform plan` is executed, Terraform reads all `.tf` files in the directory, builds a dependency graph of resources, queries the current state from the state backend, computes the diff between desired (configuration) and actual (state) infrastructure, and outputs a plan. When `terraform apply` is executed, Terraform makes API calls to create, modify, or delete resources in dependency order (e.g., VPC before subnets, RDS before security group rules that reference it). Each resource creation or modification updates the state file.

---

## Patterns

- **Use Modules** — Break infrastructure into reusable modules (network, database, compute, storage) organized by domain
- **Remote State** — Store state remotely (S3, Terraform Cloud) with locking for team collaboration
- **Version Control** — Store all `.tf` files in Git with semantic commit messages for infrastructure changes
- **Use Variables** — Parameterize configurations with input variables for environment-specific differences (dev vs. production)

---

## Architectural Decisions

- **Terraform vs. Cloud Console** — Use Terraform for repeatable, auditable infrastructure; use cloud console for exploration and troubleshooting
- **Terraform vs. Pulumi** — Choose Terraform for HCL preference and mature ecosystem; choose Pulumi for code-based IaC with TypeScript/Python
- **Terraform vs. Ansible** — Terraform provisions infrastructure resources (VPC, RDS); Ansible configures OS and software. They are complementary, not alternatives.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Repeatable, version-controlled infrastructure | HCL learning curve | Team must learn a DSL for infrastructure definition |
| Plan preview prevents surprises | State file management complexity | State corruption can lose resource tracking |
| Multi-cloud support | Each provider has unique resource types | Provider-specific knowledge required for each cloud |
| Large module ecosystem | Module quality varies | Vetted modules before use; prefer official providers |

---

## Performance Considerations

Terraform plan execution time depends on the number of resources and provider API latency. Refreshing state (`terraform refresh`) makes API calls for every resource. Apply operations are sequential in dependency order. Large state files (thousands of resources) slow down all operations. Use `-target` flag for focused operations on specific resources.

---

## Production Considerations

Always use remote state with locking (S3 + DynamoDB or Terraform Cloud). Never manually edit the state file. Use `terraform plan` in CI/CD with manual approval gates for production. Lock provider versions in `required_providers` blocks. Use workspaces or directory structures for environment separation. Tag all resources for cost tracking. Review `terraform plan` output carefully for unintended resource destruction.

---

## Common Mistakes

- **No Remote State** — State stored locally prevents team collaboration and risks state loss on developer machine failure.
- **Skipping Plan Review** — Applying without reviewing the plan leads to unintended resource destruction or configuration changes.
- **Hardcoded Configuration** — Embedding environment-specific values in resources instead of using variables.
- **State File in Git** — Committing the `.tfstate` file to Git causes merge conflicts and exposes infrastructure details.
- **No Provider Version Pinning** — Provider updates introduce breaking changes that break infrastructure.

---

## Failure Modes

- **State Lock Contention** — Two team members try to apply simultaneously. Detection: error acquiring state lock. Mitigation: always use state locking; serialize deployments in CI/CD.
- **State Data Loss** — State backend (S3 bucket) is accidentally deleted. Detection: `terraform plan` shows all resources will be created. Mitigation: enable S3 versioning on state bucket, implement backup.
- **Provider API Evolution** — Provider update changes default behavior. Detection: plan shows unexpected resource changes. Mitigation: pin provider versions, review changelogs before upgrading.
- **Resource Dependency Cycle** — Circular dependency between resources prevents apply. Detection: plan fails with dependency cycle error. Mitigation: redesign resource structure to eliminate cycles.

---

## Ecosystem Usage

Terraform is the most widely used IaC tool in the Laravel ecosystem. It provisions the infrastructure that Forge/Ploi manage or the environments that Vapor/Cloud run on. Common Laravel Terraform configurations include VPC, RDS (MySQL/PostgreSQL), ElastiCache (Redis), ECS/EKS (compute), S3 (storage), and CloudFront (CDN). Terraform Registry contains community modules for common Laravel infrastructure patterns.

---

## Related Knowledge Units

### Prerequisites
- Cloud fundamentals

### Related Topics
- Terraform AWS Laravel
- Terraform for Laravel
- Pulumi (alternative IaC)

### Advanced Follow-up Topics
- Terraform Cloud
- Terragrunt
- Policy as Code (Sentinel)

---

## Research Notes

Terraform is the standard IaC tool for Laravel infrastructure. Use remote state with locking for team collaboration. Always review plan output before applying. Use modules for resource organization. Pin provider versions. Store all `.tf` files in version control. Terraform and Ansible are complementary tools for infrastructure and configuration management respectively.
