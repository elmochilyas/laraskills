# Decomposition: Terraform for Laravel Infrastructure

## Topic Overview
Terraform enables declarative infrastructure provisioning for Laravel applications using the HashiCorp Configuration Language (HCL). Common resources include VPC (networking), RDS (database), ElastiCache (Redis), ECS/EKS (compute), S3 (file storage), CloudFront (CDN), and IAM (security). State is managed in S3 with DynamoDB locking.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
terraform-for-laravel/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Terraform for Laravel Infrastructure
- **Purpose:** Terraform enables declarative infrastructure provisioning for Laravel applications using the HashiCorp Configuration Language (HCL).
- **Difficulty:** Intermediate
- **Dependencies:** Pulumi for Laravel (KU-019) — IaC with programming languages, Ansible Provisioning (KU-020) — complementary configuration management, AWS CDK / CloudFormation (KU-021) — AWS-native IaC alternative, Kubernetes for Laravel (KU-013) — K8s provisioned by Terraform, Environment & Secret Management (KU-021) — secrets in Terraform

## Dependency Graph
**Depends on:**
- Pulumi for Laravel (KU-019) — IaC with programming languages
- Ansible Provisioning (KU-020) — complementary configuration management
- AWS CDK / CloudFormation (KU-021) — AWS-native IaC alternative
- Kubernetes for Laravel (KU-013) — K8s provisioned by Terraform
- Environment & Secret Management (KU-021) — secrets in Terraform

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Declarative infrastructure:** You define the desired state of infrastructure in 
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- Pulumi for Laravel (KU-019) — IaC with programming languages, Ansible Provisioning (KU-020) — complementary configuration management, AWS CDK / CloudFormation (KU-021) — AWS-native IaC alternative, Kubernetes for Laravel (KU-013) — K8s provisioned by Terraform, Environment & Secret Management (KU-021) — secrets in Terraform

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