# Decomposition: Terraform AWS Laravel

## Topic Overview
Pulumi for provisioning Laravel infrastructure on AWS using TypeScript/Python/Go. Covers stack management, AWS Native provider patterns, component resources, OIDC authentication, and CI/CD integration.

## Decomposition Strategy
1. **Pulumi fundamentals** — program structure, stack management, state backends
2. **AWS Native provider** — resource definitions, auto-generated schemas, version management
3. **Component resources** — reusable infrastructure patterns as TypeScript/Python classes
4. **Stack configuration** — per-environment config, secrets, stack references
5. **CI/CD integration** — GitHub Actions setup, OIDC authentication, preview/apply flow

## Proposed Folder Structure
```
infrastructure-as-code/
├── terraform-aws-laravel/
│   ├── 02-knowledge-unit.md
│   ├── 03-decomposition.md
│   ├── 04-standardized-knowledge.md
│   └── templates/
│       ├── laravel-infrastructure.ts
│       ├── pulumi-oidc-setup.md
│       └── stack-config.example.yaml
```

## Knowledge Unit Inventory
- KU-018: Terraform Basics — HCL-based IaC alternative
- KU-019: Terraform AWS Laravel — Pulumi for Laravel AWS infrastructure
- KU-020: Ansible Packer — complementary config management

## Dependency Graph
- **Prerequisites:** AWS fundamentals, TypeScript/Python/Go programming
- **Related:** Terraform (alternative), Ansible (complementary), K8s (infra provisioning for clusters)
- **Extends:** Manual CLI → IaC → automated CI/CD provisioning

## Boundary Analysis
- **In scope:** Pulumi program patterns, AWS Native provider, stack management, CI/CD integration
- **Out of scope:** Terraform (separate IaC tool), manual cloud management, non-AWS clouds

## Future Expansion Opportunities
- Pulumi ESC (Environments, Secrets, and Configuration)
- Pulumi Crosswalk for AWS (higher-level abstractions)
- Multi-cloud Pulumi patterns (AWS + GCP + Azure)
