# Decomposition: Terraform Basics

## Topic Overview
Terraform for provisioning Laravel infrastructure on AWS. Covers HCL syntax, state management, module composition, resource lifecycle, and the plan → apply workflow for reproducible cloud environments.

## Decomposition Strategy
1. **HCL fundamentals** — resources, data sources, variables, outputs, backend configuration
2. **State management** — S3 backend, DynamoDB locking, state file security
3. **Module composition** — community modules for VPC, RDS, ECS, ElastiCache
4. **Lifecycle management** — `prevent_destroy`, `create_before_destroy`, `ignore_changes`
5. **Laravel infrastructure pattern** — RDS + ElastiCache + ECS Fargate as core stack

## Proposed Folder Structure
```
infrastructure-as-code/
├── terraform-basics/
│   ├── 02-knowledge-unit.md
│   ├── 03-decomposition.md
│   ├── 04-standardized-knowledge.md
│   └── templates/
│       ├── main.tf
│       ├── backend.tf
│       └── terraform-aws-laravel-guide.md
```

## Knowledge Unit Inventory
- KU-018: Terraform Basics — HCL-based IaC fundamentals
- KU-019: Terraform AWS Laravel — Pulumi alternative
- KU-020: Ansible Packer — complementary server config

## Dependency Graph
- **Prerequisites:** AWS basics, infrastructure concepts
- **Related:** Pulumi (alternative), Ansible (complementary), K8s (Terraform-provisioned clusters)
- **Extends:** Manual cloud console → IaC → GitOps infrastructure management

## Boundary Analysis
- **In scope:** Terraform HCL, state management, modules, lifecycle, Laravel AWS infrastructure patterns
- **Out of scope:** Pulumi (separate tool), Ansible (server config), K8s (orchestration), non-AWS clouds

## Future Expansion Opportunities
- Terragrunt integration for DRY multi-environment config
- OpenTofu migration guide for teams affected by BSL license change
- Terraform policy as code (Sentinel/OPA)
- Terraform Stacks (new deployment model)
