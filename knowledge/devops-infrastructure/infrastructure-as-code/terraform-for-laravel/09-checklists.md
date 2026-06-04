# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 07-infrastructure-as-code
**Knowledge Unit:** terraform-for-laravel
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Terraform HCL code written to provision Laravel AWS infrastructure
- [ ] VPC with public/private subnets, NAT gateways, and route tables defined
- [ ] RDS instance provisioned for Laravel database
- [ ] ElastiCache Redis provisioned for cache and sessions
- [ ] ECS Fargate or EKS defined for Laravel compute
- [ ] State managed in S3 with DynamoDB locking

---

# Architecture Checklist

- [ ] Declarative infrastructure designed (desired state in HCL, Terraform reconciles)
- [ ] Resource dependencies managed implicitly via Terraform graph
- [ ] Module composition strategy defined (community modules for VPC, RDS, ECS)
- [ ] State management designed (S3 backend, DynamoDB locking)
- [ ] Lifecycle rules configured (prevent_destroy for DB, create_before_destroy for ASG)

---

# Implementation Checklist

- [ ] `main.tf` created with provider (aws) and region configuration
- [ ] VPC module configured (CIDR, subnets, NAT, Internet Gateway)
- [ ] RDS resource configured (engine, instance class, storage, backup)
- [ ] ElastiCache resource configured (Redis, node type, subnet group)
- [ ] ECS cluster and service defined (Fargate launch type, task definition)
- [ ] S3 bucket for file storage with CloudFront distribution

---

# Performance Checklist

- [ ] RDS storage type and IOPS sized for workload
- [ ] ElastiCache node type with sufficient memory for cache
- [ ] ECS Fargate CPU/memory per task tuned
- [ ] Auto-scaling target tracking policy configured
- [ ] CloudFront cache behaviors optimized for assets

---

# Security Checklist

- [ ] IAM roles with least privilege for each service
- [ ] Security groups restrict ingress (no public RDS/ElastiCache)
- [ ] Secrets in Terraform variables (marked sensitive)
- [ ] Encryption at rest for RDS, ElastiCache, S3
- [ ] S3 bucket policies block public access
- [ ] State file encrypted at rest (S3 SSE)

---

# Reliability Checklist

- [ ] RDS Multi-AZ enabled for production
- [ ] ECS service auto-healing (task replacement)
- [ ] ElastiCache replication group for HA
- [ ] Terraform state locking (concurrent apply prevention)
- [ ] Backup retention for RDS (>30 days production)

---

# Testing Checklist

- [ ] `terraform validate` passes
- [ ] `terraform plan` reviewed for expected changes
- [ ] Dev environment deployed and verified
- [ ] State lock tested (parallel applies blocked)
- [ ] Destroy and recreate tested

---

# Maintainability Checklist

- [ ] Terraform code organized with modules
- [ ] Variables documented with descriptions and defaults
- [ ] terraform fmt applied
- [ ] State backup via S3 versioning
- [ ] Module versions pinned

---

# Anti-Pattern Prevention Checklist

- [ ] No secrets in .tf files
- [ ] No hardcoded resource identifiers
- [ ] No manual cloud console changes (drift)
- [ ] No apply without plan review
- [ ] No single-AZ production resources

---

# Production Readiness Checklist

- [ ] S3 backend with DynamoDB locking configured
- [ ] RDS Multi-AZ enabled
- [ ] prevent_destroy on RDS and ElastiCache
- [ ] create_before_destroy for compute resources
- [ ] Monitoring (CloudWatch alarms) for critical resources
- [ ] Terraform plan reviewed before production apply

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: HCL, state backend, modules, lifecycle designed
- [ ] Security requirements satisfied: IAM, security groups, encrypted state, sensitive vars
- [ ] Performance requirements satisfied: RDS/ElastiCache sizing, auto-scaling, CDN
- [ ] Testing requirements satisfied: validate, plan, dev deploy, state lock verified
- [ ] Anti-pattern checks passed: no secrets in files, no drift, no plan-less applies
- [ ] Production readiness verified: Multi-AZ, backups, monitoring, rollback ready

---

# Related References

- Pulumi for Laravel (KU-019) -- IaC with programming languages
- Ansible Provisioning (KU-020) -- complementary configuration management
- AWS CDK / CloudFormation (KU-021) -- AWS-native IaC alternative
- Kubernetes for Laravel (KU-013) -- K8s provisioned by Terraform
- Environment & Secret Management (KU-021) -- secrets in Terraform
