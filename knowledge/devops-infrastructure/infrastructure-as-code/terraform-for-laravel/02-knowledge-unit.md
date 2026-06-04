# Terraform for Laravel

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Infrastructure as Code
- **Knowledge Unit:** Terraform for Laravel
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Terraform for Laravel Infrastructure focuses on the end-to-end provisioning of production Laravel environments on AWS using Terraform. This includes VPC networking, RDS databases, ElastiCache Redis, ECS/EKS compute, S3 storage, CloudFront CDN, and IAM security. A single `terraform apply` provisions a complete, production-ready Laravel environment.

---

## Core Concepts

- **VPC** — Network isolation for Laravel services with public and private subnets
- **RDS** — Managed database with automated backups and Multi-AZ failover
- **ElastiCache** — Redis for cache, sessions, and queue backends
- **ECS/EKS** — Compute for PHP-FPM/Octane and queue workers
- **S3** — File storage with IAM access control
- **CloudFront** — Global CDN for static asset delivery

---

## Mental Models

- **Single Command Deploy** — From nothing to production in one `terraform apply`. VPC, databases, compute, storage, and CDN are all defined in code and created together.
- **Environment as Snapshot** — Each Terraform workspace is a complete environment snapshot. Dev, staging, and production are identical configurations with different variable values.
- **Data Sources for Existing Infrastructure** — Use data sources to reference existing resources (VPCs, subnets, security groups) without managing them in Terraform.

---

## Internal Mechanics

Terraform reads the Laravel-specific configuration files, resolves module dependencies (network before compute, database before application), queries the current state from remote state storage, computes the plan, and applies changes. The typical Laravel infrastructure creates resources in order: VPC and subnets, security groups, RDS and ElastiCache (subnet groups), ECS cluster or EKS control plane, ECS services or EKS node groups, S3 buckets and CloudFront distributions, and IAM roles and policies.

---

## Patterns

- **Use Data Sources** — Reference existing resources (VPC, subnets) with data sources instead of hardcoding IDs for flexibility
- **Lifecycle Rules** — Use `create_before_destroy` for zero-downtime resource updates (e.g., RDS, ElastiCache)
- **Dependency Management** — Use `depends_on` explicitly where implicit dependencies are insufficient
- **Output Sensitive Values** — Mark outputs containing secrets as `sensitive = true` to prevent exposure in logs

---

## Architectural Decisions

- **Terraform vs. Vapor/Cloud** — Use Terraform for full control over infrastructure; use Vapor/Cloud for managed platforms that abstract infrastructure
- **Terraform vs. Forge** — Use Terraform for infrastructure provisioning; use Forge for server management within provisioned infrastructure
- **Workspaces vs. Directories** — Use workspaces for simple environment separation; use directories (modules per environment) for complex differences

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Complete infrastructure in version control | Terraform expertise required | Team must understand HCL and AWS |
| Repeatable environment creation | Apply time (10-30 mins) | Full environment changes require patience |
| Peer-reviewed changes via PRs | State management complexity | State corruption risks infrastructure management |
| Full control over AWS resources | AWS lock-in | Migration to other clouds requires new configurations |

---

## Performance Considerations

RDS instance class determines database throughput. ElastiCache node type affects Redis performance. ECS task size determines application container resources. CloudFront distribution propagation takes 5-15 minutes for global edge deployment. NAT Gateway throughput for private subnet egress traffic. S3 performance scales with prefix naming strategy.

---

## Production Considerations

Use remote state with S3 and DynamoDB locking. Tag all resources for cost allocation. Configure RDS automated backups with appropriate retention. Use Multi-AZ for production databases. Configure CloudFront for static assets. Implement least-privilege IAM policies. Use `prevent_destroy` lifecycle on critical resources (RDS, S3 buckets). Implement CI/CD with plan review and manual approval for production.

---

## Common Mistakes

- **Not Using Data Sources** — Hardcoding VPC IDs, subnet IDs, or security group IDs instead of using data sources. Changes require manual updates.
- **Missing Lifecycle Rules** — RDS or ElastiCache replaced instead of updated, causing data loss. Use `create_before_destroy` for stateful resources.
- **Secrets in State File** — Database passwords and API keys stored in plain text in the state file. Use `sensitive = true` and vault integration.
- **No Remote State** — State stored locally prevents team collaboration and risks state file loss.

---

## Failure Modes

- **RDS Replacement** — Changing a non-upgradeable RDS parameter causes Terraform to destroy and recreate the database. Detection: plan shows `force new resource`. Mitigation: review plan carefully, use `create_before_destroy` lifecycle.
- **State File Secret Exposure** — Terraform state file contains plain-text secrets (passwords, API keys). Detection: state file accessed by unauthorized user. Mitigation: use `sensitive = true`, encrypt state file, use vault for secret management.
- **CloudFront Distribution Stuck** — CloudFront deployment fails or gets stuck in progress. Detection: CloudFront status shows "InProgress" for extended time. Mitigation: check CloudFront error messages, verify origin configuration.

---

## Ecosystem Usage

Terraform is the standard IaC tool for provisioning Laravel infrastructure on AWS. Common modules: VPC, RDS MySQL/PostgreSQL, ElastiCache Redis, ECS Fargate or EKS, S3 with CloudFront, IAM roles. Terraform works with Forge by provisioning the cloud resources that Forge then manages at the server level. Terraform is complementary to Ansible — Terraform creates infrastructure, Ansible configures it.

---

## Related Knowledge Units

### Prerequisites
- Terraform basics, AWS fundamentals

### Related Topics
- Terraform AWS Laravel
- Pulumi (alternative IaC)
- Ansible (complementary configuration management)

### Advanced Follow-up Topics
- Terraform State Management
- Terragrunt
- Infrastructure Testing

---

## Research Notes

Terraform provides complete infrastructure provisioning for Laravel on AWS. Use data sources, lifecycle rules, and `depends_on` for robust configurations. Remote state with locking is essential for team collaboration. Tag all resources for cost tracking. Terraform and Ansible work together: Terraform creates infrastructure, Ansible configures servers. Use `create_before_destroy` for stateful resources.
