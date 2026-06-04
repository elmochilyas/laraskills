# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 07-infrastructure-as-code
**Knowledge Unit:** terraform-for-laravel
**Difficulty:** Advanced
**Category:** Infrastructure as Code
**Last Updated:** 2026-06-03

# Overview

Terraform for Laravel Infrastructure focuses on the end-to-end provisioning of production Laravel environments on AWS using Terraform. This includes VPC networking, RDS databases, ElastiCache Redis, ECS/EKS compute, S3 storage, CloudFront CDN, and IAM security. State is managed in S3 with DynamoDB locking.

This topic exists because Laravel's infrastructure needs are specific: PHP-FPM compute, Redis caching, MySQL/PostgreSQL databases, and S3 file storage all need to work together. The engineering value is a single `terraform apply` that provisions a complete, production-ready Laravel environment.

# When To Use

- Production Laravel environments on AWS
- Teams wanting infrastructure as code for Laravel
- Repeatable environment creation (staging, QA, production)

# When NOT To Use

- Managed platforms (Vapor, Cloud)
- Teams without IaC experience
- Simple single-server deployments

# Core Concepts

- **VPC** — Network isolation for Laravel services
- **RDS** — Managed database with automated backups
- **ElastiCache** — Redis for cache and sessions
- **ECS/EKS** — Compute for PHP-FPM and queue workers
- **S3** — File storage with IAM access control
- **CloudFront** — Global CDN for static assets

# Best Practices

**Use Data Sources.** Reference existing resources (VPC, subnets) with data sources instead of hardcoding IDs.

**Lifecycle Rules.** Use `create_before_destroy` for zero-downtime resource updates.

**Dependency Management.** Use `depends_on` explicitly where implicit dependencies are insufficient.

**Output Sensitive Values.** Mark outputs containing secrets as `sensitive = true`.

# Related Topics

**Prerequisites:** Terraform basics, AWS fundamentals
**Closely Related:** Terraform AWS Laravel, Pulumi, Ansible (complementary)
**Advanced Follow-Ups:** Terraform State Management, Terragrunt, Infrastructure Testing
