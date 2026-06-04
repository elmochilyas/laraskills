# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 07-infrastructure-as-code
**Knowledge Unit:** pulumi-for-laravel
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Pulumi installed and CLI configured (TypeScript/Python/Go)
- [ ] Pulumi project created with stack configuration (dev/staging/production)
- [ ] AWS Native provider configured for infrastructure resources
- [ ] VPC, RDS, ElastiCache, ECS/EKS, S3, CloudFront defined in code
- [ ] OIDC authentication configured for CI/CD deployment
- [ ] State backend configured (Pulumi Cloud, S3, or self-managed)

---

# Architecture Checklist

- [ ] Program structure designed (index.ts, stacks, Pulumi.yaml)
- [ ] Stack management strategy defined (dev/staging/prod, stack references)
- [ ] Component resources created (reusable infrastructure patterns as classes)
- [ ] AWS Native provider used for 1:1 CloudFormation resource mapping
- [ ] OIDC authentication architecture for CI/CD vs static credentials
- [ ] State backend selected (Pulumi Cloud recommended, S3 alternative)

---

# Implementation Checklist

- [ ] `pulumi new` executed for project type (aws-typescript)
- [ ] Stack configuration files created (`Pulumi.dev.yaml`, `Pulumi.prod.yaml`)
- [ ] VPC and networking resources defined (subnets, security groups, NAT)
- [ ] RDS instance defined for Laravel database
- [ ] ElastiCache Redis defined for cache and sessions
- [ ] ECS Fargate service or EKS cluster defined for compute

---

# Performance Checklist

- [ ] RDS instance class sized for expected workload
- [ ] ElastiCache node type selected (cache size, network throughput)
- [ ] ECS Fargate CPU/memory configurations tuned per task
- [ ] Auto-scaling configured for ECS service
- [ ] CloudFront distribution caching optimized for static assets

---

# Security Checklist

- [ ] IAM roles scoped with least privilege
- [ ] Security groups restricted (no public DB access)
- [ ] Secrets managed via Pulumi config (`pulumi config set --secret`)
- [ ] Encryption at rest for RDS and ElastiCache
- [ ] S3 bucket policies block public access
- [ ] OIDC for CI/CD (no long-lived AWS credentials)

---

# Reliability Checklist

- [ ] RDS Multi-AZ configured for production
- [ ] ECS service auto-healing (task replacement on failure)
- [ ] CloudFront origin failover configured
- [ ] ElastiCache replication group for high availability
- [ ] Pulumi stack export backed up for disaster recovery

---

# Testing Checklist

- [ ] `pulumi preview` reviewed before apply
- [ ] Stack deployed to dev environment and verified
- [ ] Resource creation validated in AWS Console
- [ ] OIDC authentication tested in CI/CD pipeline
- [ ] Destroy and recreate tested for empty state

---

# Maintainability Checklist

- [ ] Pulumi code organized with component resources
- [ ] Stack config files documented with purpose of each setting
- [ ] README with deployment instructions (pulumi up, preview)
- [ ] State file backup strategy documented
- [ ] Pulumi version pinned in project

---

# Anti-Pattern Prevention Checklist

- [ ] No hardcoded AWS resource names (use Pulumi auto-naming)
- [ ] No secrets in stack config files (use --secret flag)
- [ ] No manual AWS Console changes outside Pulumi (drift)
- [ ] No single-AZ for production workloads
- [ ] No public RDS or ElastiCache endpoints

---

# Production Readiness Checklist

- [ ] `pulumi preview` shows expected changes before apply
- [ ] RDS Multi-AZ configured
- [ ] ElastiCache replication configured
- [ ] OIDC authentication working in CI/CD
- [ ] State backup configured (Pulumi Cloud or S3 versioning)
- [ ] Rollback via `pulumi up` with previous stack state

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: Pulumi program, stacks, components designed
- [ ] Security requirements satisfied: IAM, security groups, secrets, OIDC
- [ ] Performance requirements satisfied: RDS/ElastiCache sizing, auto-scaling
- [ ] Testing requirements satisfied: preview, dev deploy, OIDC test
- [ ] Anti-pattern checks passed: no secrets in config, no public endpoints, no drift
- [ ] Production readiness verified: Multi-AZ, state backup, rollback ready

---

# Related References

- Terraform for Laravel (KU-018) -- primary IaC alternative
- Ansible Provisioning (KU-020) -- complementary tool for config management
- AWS CDK / CloudFormation (KU-021) -- AWS-native IaC
- Kubernetes for Laravel (KU-013) -- K8s provisioned by Pulumi
