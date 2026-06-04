# Pulumi for Laravel

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Infrastructure as Code
- **Knowledge Unit:** Pulumi for Laravel
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Pulumi is an Infrastructure as Code tool that uses general-purpose programming languages (TypeScript, Python, Go, C#, Java) instead of a domain-specific language like HCL. For Laravel infrastructure, Pulumi provisions VPC, RDS, ElastiCache, ECS/EKS, S3, CloudFront, and IAM resources using real programming constructs.

---

## Core Concepts

- **Stack** — Isolated instance of infrastructure (dev, staging, production) with its own configuration
- **Resource** — Cloud service managed by Pulumi (VPC, RDS instance, S3 bucket)
- **Provider** — Cloud provider plugin (AWS, Azure, GCP) that Pulumi uses to manage resources
- **Component** — Reusable infrastructure pattern defined as a class or function using the programming language
- **State Backend** — Storage for infrastructure state (S3, Pulumi Cloud, Azure Blob Storage)

---

## Mental Models

- **Code-First IaC** — Unlike Terraform's HCL (a DSL), Pulumi uses familiar programming languages. Loops, conditionals, functions, and classes work the same way they do in application code.
- **Stacks as Environments** — Each stack is an independent instance of your infrastructure. Dev, staging, and production stacks share the same code but have different configuration values.
- **Component as Module** — Pulumi Components are like Terraform modules but written in your language of choice. They encapsulate related resources and expose typed inputs and outputs.

---

## Internal Mechanics

When `pulumi up` is executed, Pulumi reads the program file (e.g., `index.ts`), evaluates it to determine the desired state of all resources, computes the diff against the current state stored in the state backend, shows a preview of changes, and then applies the changes through the cloud provider's API. Pulumi tracks resource dependencies and creates/updates/deletes resources in the correct order. The state backend stores the mapping between configuration and real-world resources, enabling incremental updates.

---

## Patterns

- **Use Stacks for Environments** — Separate stacks for dev, staging, production with shared base configuration and environment-specific overrides
- **OIDC for CI/CD** — Use OIDC authentication for CI/CD pipelines instead of long-lived cloud credentials
- **Preview Before Apply** — Always run `pulumi preview` in CI/CD before production `pulumi up` to review changes
- **Version Lock Providers** — Pin provider versions to prevent unexpected resource changes from provider updates

---

## Architectural Decisions

- **Pulumi vs. Terraform** — Choose Pulumi when teams prefer TypeScript/Python/Go for IaC and need programming constructs; choose Terraform when teams have established HCL expertise
- **Pulumi vs. AWS CDK** — Choose Pulumi for multi-cloud support; choose AWS CDK for AWS-only teams
- **Pulumi Cloud vs. Self-Managed State** — Use Pulumi Cloud for managed state and team features; use self-managed state (S3, Azure Blob) for air-gapped environments

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Familiar programming languages | Larger learning curve for non-developer DevOps | Team must be comfortable with TypeScript/Python/Go |
| Loops, conditionals, classes for infrastructure | Less community examples than Terraform | Fewer pre-built modules for specific patterns |
| Multi-cloud support (AWS, Azure, GCP) | State management complexity | Must configure and secure state backend |
| OIDC integration for CI/CD | Provider version management | Pinning required to prevent unexpected changes |

---

## Performance Considerations

Pulumi program execution time depends on cloud provider API latency and number of resources. Preview operations are fast (no API calls) but apply operations require sequential resource creation/deletion. Stack operations can be parallelized across independent stacks. Provider plugins add startup overhead. State backend latency affects `pulumi up` performance.

---

## Production Considerations

Use stacks for environment isolation with clear naming conventions. Store stack configuration in the repository or Pulumi ESC. Implement CI/CD pipelines that run `pulumi preview` before `pulumi up`. Use OIDC for secure CI/CD authentication. Lock provider versions to prevent unexpected changes. Tag all resources for cost allocation and identification. Review stack changes in pull requests.

---

## Common Mistakes

- **No Preview Step in CI/CD** — Running `pulumi up` without preview means changes are applied without review. Always run preview in CI/CD with manual approval for production.
- **Hardcoded Configuration** — Embedding environment-specific values in code instead of using stack configuration or Pulumi ESC.
- **Unpinned Provider Versions** — Using `latest` or floating tags for providers causes unexpected resource changes when providers update.
- **State Backend Misconfiguration** — Losing state file or misconfigured locking causes deployment failures or resource conflicts.

---

## Failure Modes

- **Cloud Provider Rate Limit** — Pulumi makes many API calls during `pulumi up` and may hit provider rate limits. Detection: apply fails with rate limit error. Mitigation: implement retry logic, reduce batch size.
- **State Lock Contention** — Two users running `pulumi up` simultaneously. Detection: state lock acquisition error. Mitigation: implement CI/CD serialization, use stack locks.
- **Stack Configuration Drift** — Manual changes to cloud resources outside Pulumi. Detection: `pulumi preview` shows unexpected changes. Mitigation: tag resources managed by Pulumi, enforce IaC-only changes.

---

## Ecosystem Usage

Pulumi is used by Laravel teams that prefer code-based IaC over HCL. Common usage includes provisioning complete Laravel infrastructure on AWS (VPC, RDS, ElastiCache, ECS). Pulumi Crosswalk for AWS provides simplified resource creation patterns. Pulumi ESC manages environment configuration. Pulumi is less common than Terraform in the Laravel ecosystem but is growing among teams with strong TypeScript/Go expertise.

---

## Related Knowledge Units

### Prerequisites
- TypeScript/Python/Go, cloud concepts

### Related Topics
- Terraform (alternative IaC tool)
- AWS CDK (AWS-native alternative)

### Advanced Follow-up Topics
- Pulumi ESC (environment configuration)
- Crosswalk for AWS
- Component Registry

---

## Research Notes

Pulumi appeals to teams that find HCL limiting. Use stacks for environment isolation. Always run preview before apply in CI/CD. Use OIDC for CI/CD authentication. Lock provider versions. Pulumi is less common than Terraform in the Laravel ecosystem but offers advantages for teams preferring code-based infrastructure definition.
