# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 07-infrastructure-as-code
**Knowledge Unit:** terraform-aws-laravel
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Pulumi project initialized with TypeScript/Python/Go for Laravel infrastructure
- [ ] Stack configuration created (dev, staging, production environments)
- [ ] AWS Native provider configured for resource definitions
- [ ] Component resources created for reusable infrastructure patterns
- [ ] OIDC authentication set up for CI/CD pipeline (no static keys)
- [ ] CI/CD integration configured (preview on PR, apply on merge)

---

# Architecture Checklist

- [ ] Program structure designed (Pulumi.yaml, index.ts, stacks)
- [ ] Stack management strategy defined (per-environment config, stack references)
- [ ] AWS Native provider chosen for CloudFormation resource parity
- [ ] Component resource architecture (TypeScript/Python classes for reusable patterns)
- [ ] OIDC architecture for automated deployment from CI
- [ ] State backend selected (Pulumi Cloud, S3, or self-managed)

---

# Implementation Checklist

- [ ] Pulumi project created (`pulumi new aws-typescript`)
- [ ] Stack config files created (`Pulumi.dev.yaml`, `Pulumi.prod.yaml`)
- [ ] VPC and networking components defined
- [ ] RDS instance for Laravel database provisioned
- [ ] ElastiCache Redis for cache and sessions
- [ ] Compute resources (ECS Fargate or EKS) defined

---

# Performance Checklist

- [ ] RDS instance class sized for workload (e.g., db.t3.medium for production)
- [ ] ElastiCache node type selected for performance
- [ ] ECS Fargate CPU/memory tuned per task
- [ ] Auto-scaling configured for compute tasks
- [ ] CloudFront distribution configured for asset optimization

---

# Security Checklist

- [ ] IAM roles scoped with least privilege
- [ ] Security groups allow only necessary traffic
- [ ] Secrets managed with `pulumi config set --secret`
- [ ] Encryption at rest for RDS, ElastiCache, S3
- [ ] S3 bucket policies block public access
- [ ] OIDC for CI/CD prevents long-lived credential exposure

---

# Reliability Checklist

- [ ] RDS Multi-AZ for production
- [ ] ECS auto-healing (task replacement)
- [ ] ElastiCache replication group for HA
- [ ] Pulumi state backups enabled (S3 versioning)
- [ ] Rollback via previous stack deployment

---

# Testing Checklist

- [ ] `pulumi preview` reviewed before each apply
- [ ] Dev stack deployed and verified
- [ ] Resource creation validated in AWS Console
- [ ] OIDC auth tested in CI pipeline
- [ ] `pulumi destroy` and recreate tested

---

# Maintainability Checklist

- [ ] Component resources documented with purpose
- [ ] Stack configs documented with parameter explanations
- [ ] Deployment guide in README
- [ ] State backup strategy documented
- [ ] Pulumi version pinned

---

# Anti-Pattern Prevention Checklist

- [ ] No hardcoded resource names (use Pulumi naming)
- [ ] No secrets in plain stack config
- [ ] No manual AWS changes outside Pulumi
- [ ] No single-AZ production resources
- [ ] No public database endpoints

---

# Production Readiness Checklist

- [ ] RDS Multi-AZ enabled
- [ ] ElastiCache replication configured
- [ ] OIDC CI/CD auth verified
- [ ] State backup configured
- [ ] Monitoring alarms for critical resources
- [ ] Rollback via previous deployment

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: program, stacks, components designed
- [ ] Security requirements satisfied: IAM, security groups, secrets, OIDC
- [ ] Performance requirements satisfied: RDS/ElastiCache sizing, auto-scaling
- [ ] Testing requirements satisfied: preview, dev deploy, OIDC test
- [ ] Anti-pattern checks passed: no secrets in config, no public endpoints
- [ ] Production readiness verified: Multi-AZ, state backup, rollback ready

---

# Related References

- Terraform (alternative)
- Ansible (complementary)
- K8s (infra provisioning for clusters)
