# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Graviton Price-Performance
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Default to Graviton for all new compute resources applied
- [ ] Build multi-arch Docker images applied
- [ ] Test with production traffic shadow before full cutover applied
- [ ] Staying on x86 by default prevented
- [ ] Mixing architectures without multi-arch builds prevented
- [ ] Assuming x86 compatibility issues without testing prevented
- [ ] Not updating CI/CD pipeline for ARM builds prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Use Graviton across all AWS compute services where available
- [ ] Architecture guideline: Build multi-arch CI/CD pipelines for container builds (buildx, manifest lists)
- [ ] Architecture guideline: Specify ARM architecture explicitly in CloudFormation/Terraform to prevent x86 default
- [ ] Architecture guideline: Migrate non-production environments first, monitor 48h, then production
- [ ] Architecture guideline: If using Laravel Vapor, enable Lambda ARM for 20% cost reduction per function

---

# Implementation Checklist

- [ ] Best practice applied: Default to Graviton for all new compute resources
- [ ] Best practice applied: Build multi-arch Docker images
- [ ] Best practice applied: Test with production traffic shadow before full cutover
- [ ] Best practice applied: Migrate RDS after compute
- [ ] Best practice applied: Use Amazon Linux 2023 for best Graviton performance
- [ ] Workflow step completed: Inventory current Graviton Price Performance resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Graviton3
- [ ] Graviton4
- [ ] PHP-FPM and Laravel Octane
- [ ] I/O-bound apps
- [ ] Graviton instances may have slightly less availability in older AWS regions

---

# Security Checklist

- [ ] Graviton uses the same AWS Nitro System as x86 instances for security isolation
- [ ] ARM architecture has different Spectre/Meltdown mitigations; AWS handles at hypervisor level
- [ ] PHP extension compatibility should be verified in CI/CD (some have x86 JIT assumptions)
- [ ] No known ARM-specific vulnerabilities affecting Laravel deployments
- [ ] All standard AWS encryption, IAM, and network security features work identically

---

# Reliability Checklist

- [ ] Mistake prevented: Assuming x86 compatibility issues without testing
- [ ] Mistake prevented: Not updating CI/CD pipeline for ARM builds
- [ ] Mistake prevented: Ignoring RDS Graviton migration
- [ ] Mistake prevented: Using x86-only Lambda layers

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Graviton Price Performance configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Staying on x86 by default
- [ ] Anti-pattern prevented: Mixing architectures without multi-arch builds
- [ ] Anti-pattern prevented: Ignoring Graviton for cost reports
- [ ] Anti-pattern prevented: Late adoption
- [ ] Common mistake prevented: Assuming x86 compatibility issues without testing
- [ ] Common mistake prevented: Not updating CI/CD pipeline for ARM builds
- [ ] Common mistake prevented: Ignoring RDS Graviton migration
- [ ] Common mistake prevented: Using x86-only Lambda layers

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

| Resource | Reference |
|---|---|
| Standardized Knowledge | ./04-standardized-knowledge.md |
| Rules | ./05-rules.md |
| Skills | ./06-skills.md |
| Decision Trees | ./07-decision-trees.md |
| Anti-Patterns | ./08-anti-patterns.md |
