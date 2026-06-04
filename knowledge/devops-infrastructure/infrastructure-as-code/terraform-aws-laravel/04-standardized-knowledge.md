# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 07-infrastructure-as-code
**Knowledge Unit:** terraform-aws-laravel
**Difficulty:** Advanced
**Category:** Infrastructure as Code
**Last Updated:** 2026-06-03

# Overview

Terraform AWS Laravel covers provisioning Laravel infrastructure on AWS using Terraform HCL. Resources include VPC, RDS, ElastiCache, ECS/EKS, S3, CloudFront, and IAM. This KU focuses on the AWS-specific resource configurations for a production Laravel deployment.

This topic exists because Laravel on AWS requires specific infrastructure patterns that differ from general Terraform usage. The engineering value is codified, repeatable AWS infrastructure that can be version-controlled and peer-reviewed.

# When To Use

- Deploying Laravel on AWS infrastructure
- Teams using Terraform for multi-cloud IaC
- Compliance requirements for infrastructure audit trail

# When NOT To Use

- AWS-only teams preferring CDK or Pulumi
- Managed platforms (Vapor, Cloud) that abstract infrastructure
- Simple single-server deployments

# Core Concepts

- **VPC** — Network isolation with public/private subnets
- **RDS** — Managed MySQL/PostgreSQL
- **ElastiCache** — Managed Redis
- **ECS/EKS** — Container orchestration
- **S3** — File storage
- **CloudFront** — CDN for static assets
- **IAM** — Access control and permissions

# Best Practices

**Use Remote State.** Store state in S3 with DynamoDB locking.

**Tag All Resources.** Apply consistent tags for cost allocation and resource identification.

**Use Workspaces or Directories.** Separate environments with Terraform workspaces or directory structure.

**Lock Provider Versions.** Use `required_providers` with version constraints.

# Related Topics

**Prerequisites:** AWS basics, Terraform fundamentals
**Closely Related:** Terraform Basics, Pulumi (alternative), Ansible (complementary)
**Advanced Follow-Ups:** Terragrunt, Terraform Cloud, Policy as Code
