# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 07-infrastructure-as-code
**Knowledge Unit:** terraform-basics
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Terraform installed and CLI configured
- [ ] HCL syntax understood (resources, data sources, variables, outputs)
- [ ] State backend configured (S3 with DynamoDB locking)
- [ ] Module composition strategy defined (community modules for VPC, RDS, ECS)
- [ ] Lifecycle management configured (prevent_destroy, create_before_destroy)
- [ ] Plan -> Apply workflow tested for Laravel infrastructure

---

# Architecture Checklist

- [ ] HCL project structure designed (main.tf, variables.tf, outputs.tf, backend.tf)
- [ ] State management architecture defined (S3 backend, DynamoDB lock)
- [ ] Module composition strategy (community modules vs custom modules)
- [ ] Laravel infrastructure pattern defined (RDS + ElastiCache + ECS Fargate)
- [ ] Lifecycle rules determined (prevent_destroy for DB, create_before_destroy for ASG)

---

# Implementation Checklist

- [ ] `main.tf` created with provider, resources, and modules
- [ ] `backend.tf` configured with S3 bucket and DynamoDB table
- [ ] `variables.tf` created for environment-specific parameters
- [ ] `outputs.tf` created for endpoint URLs and resource IDs
- [ ] VPC module configured (subnets, NAT, security groups)
- [ ] RDS module configured (instance class, storage, backup)

---

# Performance Checklist

- [ ] RDS instance class sized for workload (IOPS consideration)
- [ ] ElastiCache Redis node type selected (memory and network)
- [ ] ECS Fargate task size tuned (CPU/memory per task)
- [ ] Auto-scaling configured for compute resources
- [ ] CloudFront CDN configured for static asset caching

---

# Security Checklist

- [ ] State file stored in encrypted S3 bucket
- [ ] DynamoDB table for state locking uses encryption
- [ ] Variables marked `sensitive` for secrets
- [ ] Security groups restrict ingress traffic
- [ ] IAM roles with least privilege for Terraform execution
- [ ] prevent_destroy on critical resources (database)

---

# Reliability Checklist

- [ ] State locking via DynamoDB prevents concurrent applies
- [ ] RDS Multi-AZ configured for production
- [ ] `create_before_destroy` for zero-downtime resource updates
- [ ] Backup retention policy configured for RDS
- [ ] `terraform plan` reviewed before every `terraform apply`

---

# Testing Checklist

- [ ] `terraform validate` passes with no errors
- [ ] `terraform plan` reviewed for expected changes
- [ ] Infrastructure deployed to dev environment
- [ ] State lock tested (concurrent apply blocked)
- [ ] `terraform destroy` and recreate tested

---

# Maintainability Checklist

- [ ] Terraform code organized with modules and clear naming
- [ ] `terraform fmt` applied for consistent formatting
- [ ] Variables documented with descriptions
- [ ] README with deployment workflow
- [ ] Module versions pinned

---

# Anti-Pattern Prevention Checklist

- [ ] No secrets in .tf files (use variables or Terraform Cloud)
- [ ] No hardcoded resource names
- [ ] No manual AWS console changes (drift)
- [ ] No running apply without plan review
- [ ] No single-AZ production resources

---

# Production Readiness Checklist

- [ ] State backend configured with locking
- [ ] RDS Multi-AZ configured
- [ ] `prevent_destroy` on database resources
- [ ] `create_before_destroy` for replacement resources
- [ ] Terraform plan reviewed by second person
- [ ] State backup via S3 versioning

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: Terraform HCL, modules, state, lifecycle designed
- [ ] Security requirements satisfied: encrypted state, sensitive vars, security groups
- [ ] Performance requirements satisfied: RDS/ElastiCache sizing, auto-scaling configured
- [ ] Testing requirements satisfied: validate, plan, dev deploy, state lock tested
- [ ] Anti-pattern checks passed: no secrets in files, no hardcoded names, no drift
- [ ] Production readiness verified: Multi-AZ, state backup, plan review process

---

# Related References

- Pulumi (alternative)
- Ansible (complementary)
- K8s (Terraform-provisioned clusters)
