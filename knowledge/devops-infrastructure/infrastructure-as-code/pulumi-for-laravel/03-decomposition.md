# Decomposition: Pulumi for Laravel

## Topic Overview
Pulumi is an Infrastructure as Code tool that uses general-purpose programming languages (TypeScript, Python, Go, C#, Java) instead of a DSL (like Terraform's HCL). For Laravel infrastructure, Pulumi can provision VPC, RDS, ElastiCache, ECS/EKS, S3, CloudFront, and IAM resources using real programming language constructs (loops, conditionals, functions, classes). The AWS Native provider maps 1:1 to AWS CloudFormation resource schemas.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
pulumi-for-laravel/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Pulumi for Laravel
- **Purpose:** Pulumi is an Infrastructure as Code tool that uses general-purpose programming languages (TypeScript, Python, Go, C#, Java) instead of a DSL (like Terraform's HCL).
- **Difficulty:** Intermediate
- **Dependencies:** Terraform for Laravel (KU-018) — primary IaC alternative, Ansible Provisioning (KU-020) — complementary tool for config management, AWS CDK / CloudFormation (KU-021) — AWS-native IaC, Kubernetes for Laravel (KU-013) — K8s provisioned by Pulumi

## Dependency Graph
**Depends on:**
- Terraform for Laravel (KU-018) — primary IaC alternative
- Ansible Provisioning (KU-020) — complementary tool for config management
- AWS CDK / CloudFormation (KU-021) — AWS-native IaC
- Kubernetes for Laravel (KU-013) — K8s provisioned by Pulumi

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Infrastructure as real code:** Unlike Terraform's HCL (a DSL with limited progra
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- Terraform for Laravel (KU-018) — primary IaC alternative, Ansible Provisioning (KU-020) — complementary tool for config management, AWS CDK / CloudFormation (KU-021) — AWS-native IaC, Kubernetes for Laravel (KU-013) — K8s provisioned by Pulumi

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization