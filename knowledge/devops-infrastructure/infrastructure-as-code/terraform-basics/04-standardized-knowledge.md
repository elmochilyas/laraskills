# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 07-infrastructure-as-code
**Knowledge Unit:** terraform-basics
**Difficulty:** Beginner
**Category:** Infrastructure as Code
**Last Updated:** 2026-06-03

# Overview

Terraform is a declarative Infrastructure as Code tool that provisions cloud resources using the HashiCorp Configuration Language (HCL). For Laravel, Terraform provisions VPC, RDS, ElastiCache, compute resources (ECS, EC2, EKS), S3, and IAM. The core workflow is plan → apply — you define desired state, preview changes, then apply them.

Terraform exists because cloud resource management through web consoles does not scale. The engineering value is version-controlled, peer-reviewed, automated infrastructure provisioning.

# When To Use

- Provisioning cloud infrastructure for Laravel
- Multi-cloud deployments requiring consistent tooling
- Infrastructure changes requiring peer review and audit trail

# When NOT To Use

- Managed platforms (Vapor, Cloud, Forge) that handle provisioning
- Small projects with minimal infrastructure
- Teams without IaC experience

# Core Concepts

- **HCL** — Declarative language for resource definitions
- **State** — Mapping between configuration and real-world resources
- **Provider** — Plugin for cloud service (AWS, GCP, Azure)
- **Module** — Reusable group of resources
- **Plan** — Preview of changes before applying
- **Apply** — Execute planned changes

# Best Practices

**Use Modules.** Break infrastructure into reusable modules (network, database, compute, storage).

**Remote State.** Store state remotely with locking for team collaboration.

**Version Control.** Store all `.tf` files in Git with semantic commit messages.

**Use Variables.** Parameterize configurations with input variables for environment differences.

# Related Topics

**Prerequisites:** Cloud fundamentals
**Closely Related:** Terraform AWS Laravel, Terraform for Laravel, Pulumi
**Advanced Follow-Ups:** Terraform Cloud, Terragrunt, Policy as Code
