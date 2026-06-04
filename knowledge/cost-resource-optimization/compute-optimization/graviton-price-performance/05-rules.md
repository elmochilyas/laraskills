## Default to Graviton for All New Compute
---
## Cost Optimization
---
Always select Graviton (ARM) instance types for all new EC2, Fargate, Lambda, RDS, and ElastiCache deployments.
---
Graviton delivers 20-34% cost reduction across compute services with identical Laravel performance; migration is typically zero code changes for PHP 8.x+.
---
EC2: m7g.large. Fargate: ARM64 architecture. Lambda: arm64. RDS: db.r7g.large.
---
Deploying new instances on m7i/x86 "because we've always used Intel."
---
Workloads with native x86 binary dependencies or Windows workloads (Graviton is Linux-only).
---
20-34% higher compute costs across all services, compounding with every deployment.
---
## Build Multi-Arch Docker Images
---
## Maintainability
---
Always build multi-arch Docker images using `docker buildx` during Graviton migration; never create single-architecture images.
---
Multi-arch images enable rollback to x86 if ARM issues arise and allow Fargate to use either architecture; build once, deploy to both.
---
`docker buildx build --platform linux/amd64,linux/arm64 --push .`
---
Single-arch x86 Docker images during ARM migration; Fargate can't deploy to ARM.
---
100% ARM-proven workloads with confirmed compatibility after 30-day monitoring.
---
No rollback path, can't deploy to ARM Fargate, CI/CD pipeline changes needed later.
---
## Test Graviton With Traffic Shadowing
---
## Testing
---
Always route 10% of traffic to Graviton instances for 48 hours before full production cutover.
---
Production traffic exposes edge cases with PHP extensions or third-party services that staging doesn't; gradual rollout catches issues before full migration.
---
ALB: route 10% traffic to Graviton target group. Monitor error rates for 48h.
---
Migrating 100% of traffic to Graviton Amazon-style "just flip the switch."
---
Teams with no canary deployment capability; still test in staging with production data.
---
Full production outage from untested ARM compatibility issue.
---
## Migrate RDS After Compute
---
## Architecture
---
Always migrate database to Graviton (db.r7g) after compute migration, not before or simultaneously.
---
Both compute and database on Graviton provides uniform architecture and independent 20% savings; sequential migration isolates variables and allows rollback.
---
Week 1: EC2 → m7g. Week 3: RDS → db.r7g. Monitor each step independently.
---
Migrating RDS to Graviton before compute, then having to rollback compute but not database.
---
Greenfield deployments where both can be Graviton from day one.
---
Rollback complexity, inability to attribute issues to compute vs database migration.
---
## Use Amazon Linux 2023 for Best Performance
---
## Performance
---
Prefer Amazon Linux 2023 as the OS for Graviton instances; it includes ARM-optimized kernel and libraries.
---
Amazon Linux 2023 is compiled with ARM Neoverse core optimizations, providing up to 5% additional performance over generic Linux distributions.
---
Launch template: Amazon Linux 2023 AMI on m7g.large.
---
Ubuntu on Graviton instance without ARM-optimized kernel.
---
Applications with specific OS dependencies not available on Amazon Linux 2023 (e.g., certain PECL extensions).
---
3-5% performance left on the table; missing ARM-specific optimizations.
