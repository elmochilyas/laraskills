# Terraform AWS Laravel

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Infrastructure as Code
- **Knowledge Unit:** Terraform AWS Laravel
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Terraform AWS Laravel covers provisioning Laravel infrastructure on AWS using Terraform HCL, including VPC, RDS, ElastiCache, ECS/EKS, S3, CloudFront, and IAM resources. It provides codified, repeatable AWS infrastructure that can be version-controlled and peer-reviewed.

---

## Core Concepts

- **VPC** — Network isolation with public/private subnets, NAT gateways, and security groups
- **RDS** — Managed MySQL/PostgreSQL with automated backups and Multi-AZ failover
- **ElastiCache** — Managed Redis for cache, sessions, and queue backends
- **ECS/EKS** — Container orchestration for PHP-FPM and queue workers
- **S3** — File storage with IAM access control
- **CloudFront** — CDN for static asset delivery with edge caching
- **IAM** — Access control with least-privilege policies for services and users

---

## Mental Models

- **Complete Environment in Code** — Every production resource is defined in HCL. A commit to the repository creates, modifies, or destroys infrastructure through Terraform.
- **Network First** — VPC is the foundation. Subnets, routing, and security groups define how services communicate. Everything else runs inside this network.
- **Managed Services Over Self-Hosted** — AWS managed services (RDS, ElastiCache) reduce operational burden over self-hosting databases on EC2.

---

## Internal Mechanics

Terraform reads `.tf` files, constructs a dependency graph of resources, queries the current state from the state backend (S3 + DynamoDB), computes the diff between desired and actual state, and generates an execution plan. On apply, Terraform creates or modifies resources in dependency order: VPC first, then subnets, then security groups, then RDS/ElastiCache, then compute (ECS/EKS), then S3/CloudFront, then IAM policies. Each resource is tracked in the state file for future updates.

---

## Patterns

- **Use Remote State** — Store state in S3 with DynamoDB locking for team collaboration and state protection
- **Tag All Resources** — Apply consistent tags (Environment, Project, Owner, CostCenter) for cost allocation and resource identification
- **Use Workspaces or Directories** — Separate environments with Terraform workspaces or directory structure (dev/staging/production)
- **Lock Provider Versions** — Use `required_providers` with version constraints to prevent unexpected changes

---

## Architectural Decisions

- **ECS vs. EKS** — Choose ECS for simpler AWS-native container management; choose EKS for Kubernetes-native workflows and multi-cloud portability
- **RDS vs. Aurora** — Choose RDS for standard MySQL/PostgreSQL with lower cost; choose Aurora for higher performance and availability
- **Multi-AZ vs. Single-AZ** — Use Multi-AZ for production databases with automatic failover; use Single-AZ for dev/staging to reduce cost
- **S3 vs. EFS** — Use S3 for file uploads and static assets; use EFS for shared filesystem access across multiple containers

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Complete infrastructure in version control | Significant Terraform expertise required | Team must understand HCL and AWS resource configuration |
| Repeatable environment creation | State file management complexity | State corruption can cause infrastructure management issues |
| Peer-reviewed infrastructure changes | Long apply times for complex environments | Full environment apply can take 10-30 minutes |
| AWS-native service integration | AWS lock-in | Migrating to other cloud providers requires complete rewrite |

---

## Performance Considerations

RDS instance size determines database throughput — choose based on workload profiling. ElastiCache node type affects Redis performance. ECS/EKS task size determines application performance. S3 performance is virtually unlimited with proper prefix naming. CloudFront edge locations reduce latency for global users. NAT Gateway throughput affects outbound traffic from private subnets.

---

## Production Considerations

Use S3 as the remote state backend with DynamoDB locking. Tag all resources for cost tracking. Configure RDS automated backups with appropriate retention period. Use Multi-AZ for production databases. Configure security groups with least-privilege ingress/egress rules. Enable CloudFront for static assets. Implement IAM roles for service-to-service authentication. Use AWS KMS for encryption at rest.

---

## Common Mistakes

- **State File in Local Filesystem** — State file is stored locally, making team collaboration impossible and risking state loss. Always use remote state.
- **Hardcoded Resource IDs** — Using hardcoded IDs instead of Terraform data sources or references. Changes require manual updates to hardcoded values.
- **No Resource Tagging** — Resources deployed without tags, making cost allocation and resource identification difficult.
- **Incorrect Security Group Rules** — Overly permissive security groups (0.0.0.0/0) for database and cache services.

---

## Failure Modes

- **State Lock Contention** — Two team members running `terraform apply` simultaneously. Detection: error acquiring state lock. Mitigation: use DynamoDB locking, implement CI/CD serialization.
- **RDS Maintenance Window Disruption** — RDS maintenance during peak traffic causes brief downtime. Detection: database connectivity errors during maintenance window. Mitigation: configure maintenance windows during low-traffic periods.
- **Resource Limit Exceeded** — AWS service quota reached (VPCs, security groups per VPC). Detection: `terraform apply` fails with limit exceeded error. Mitigation: request service quota increases proactively.
- **State Drift** — Manual changes to resources outside Terraform. Detection: `terraform plan` shows unexpected changes. Mitigation: tag Terraform-managed resources, enforce IaC-only changes via policy.

---

## Ecosystem Usage

Terraform AWS Laravel is used by teams deploying Laravel on AWS infrastructure. The pattern typically includes VPC with public/private subnets, RDS MySQL, ElastiCache Redis, ECS Fargate for PHP-FPM or Octane containers, S3 for file storage, CloudFront for CDN, and IAM for security. Terraform modules for common Laravel infrastructure patterns are available from the Terraform Registry and community sources.

---

## Related Knowledge Units

### Prerequisites
- AWS basics, Terraform fundamentals

### Related Topics
- Terraform Basics
- Pulumi (alternative IaC)
- Ansible (complementary configuration management)

### Advanced Follow-up Topics
- Terragrunt
- Terraform Cloud
- Policy as Code (Sentinel)

---

## Research Notes

Terraform AWS Laravel provisions production-ready Laravel infrastructure on AWS. Use remote state with S3 and DynamoDB locking. Tag all resources for cost allocation. Lock provider versions. Use Multi-AZ for production RDS. Configure security groups with least-privilege rules. Terraform and Ansible are complementary — Terraform creates infrastructure, Ansible configures it.
