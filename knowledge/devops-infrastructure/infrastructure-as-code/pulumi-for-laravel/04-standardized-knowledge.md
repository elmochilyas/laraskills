# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 07-infrastructure-as-code
**Knowledge Unit:** pulumi-for-laravel
**Difficulty:** Advanced
**Category:** Infrastructure as Code
**Last Updated:** 2026-06-03

# Overview

Pulumi is an Infrastructure as Code tool that uses general-purpose programming languages (TypeScript, Python, Go, C#, Java) instead of a DSL like Terraform's HCL. For Laravel infrastructure, Pulumi provisions VPC, RDS, ElastiCache, ECS/EKS, S3, CloudFront, and IAM resources using real programming constructs.

Pulumi exists for teams that find HCL limiting for complex infrastructure patterns. The engineering value is using familiar programming languages with loops, conditionals, functions, and classes for infrastructure definition.

# When To Use

- Teams wanting to use TypeScript/Python/Go for IaC
- Complex infrastructure requiring programming logic (loops, conditionals)
- Organizations standardizing on Pulumi for multi-cloud management
- Teams already experienced with Pulumi

# When NOT To Use

- Teams preferring HCL or established Terraform workflows
- Simple infrastructure that doesn't benefit from programming constructs
- Organizations with Terraform expertise but no Pulumi experience

# Core Concepts

- **Stack** — Isolated instance of infrastructure (dev, staging, production)
- **Resource** — Cloud service managed by Pulumi (VPC, RDS, S3)
- **Provider** — Cloud provider plugin (AWS, Azure, GCP)
- **Component** — Reusable infrastructure pattern as code
- **State Backend** — Storage for infrastructure state (S3, Pulumi Cloud)

# Best Practices

**Use Stacks for Environments.** Separate stacks for dev, staging, production with shared base configuration.

**OIDC for CI/CD.** Use OIDC authentication for CI/CD pipelines instead of long-lived cloud credentials.

**Preview Before Apply.** Always run `pulumi preview` in CI/CD before production `pulumi up`.

**Version Lock Providers.** Pin provider versions to prevent unexpected resource changes.

# Related Topics

**Prerequisites:** TypeScript/Python/Go, cloud concepts
**Closely Related:** Terraform (alternative), AWS CDK (AWS-native), Ansible (complementary)
**Advanced Follow-Ups:** Pulumi ESC, Crosswalk for AWS, Component Registry
