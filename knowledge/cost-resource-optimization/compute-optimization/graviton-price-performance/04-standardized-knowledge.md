# Graviton Price-Performance

## Metadata
- **ID**: KU-26-GRAVITON-PRICE-PERFORMANCE
- **Subdomain**: compute-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Graviton Price-Performance
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
AWS Graviton (ARM) processors deliver 20-40% better price-performance than equivalent x86 instances for Laravel workloads. The savings apply across EC2 (20% cheaper), Fargate (20% cheaper), and Lambda (34% cheaper). PHP and Laravel have excellent ARM support as of PHP 8.0+, making Graviton the default recommendation for new deployments. Migration is typically zero code changes — just select the Graviton instance type.

## Core Concepts
- **EC2 savings**: t4g (Graviton) ~20% cheaper than t3 (x86) for same vCPU/memory specification
- **Fargate savings**: ARM Fargate = $0.03238/vCPU-hour vs x86 $0.04048 (~20% savings)
- **Lambda savings**: ARM functions cost ~34% less than x86; same price for requests, cheaper for duration
- **RDS savings**: db.r7g instances ~20% cheaper than db.r7i (x86) for same class
- **ElastiCache savings**: cache.r7g nodes ~20% cheaper than cache.r7i
- **PHP compatibility**: PHP 8.0+ has first-class ARM support; Laravel runs identically on ARM and x86
- **Generations**: Graviton2 (2020), Graviton3 (2022, +25% performance), Graviton4 (2024, +30% over G3)

## When To Use
- All new EC2, Fargate, Lambda, RDS, and ElastiCache deployments (greenfield)
- Existing brownfield deployments: migrate staging first, then production after validation
- CI/CD pipelines: build and test on ARM to catch compatibility issues early
- Multi-arch Docker images: support both ARM and x86 during migration window
- Any Laravel app running PHP 8.0+ with standard PHP extensions

## When NOT To Use
- Workloads with native x86 binary dependencies (some compiled PHP extensions)
- Windows workloads (Graviton is Linux-only)
- Some legacy .NET or Java applications with x86-specific optimizations
- Lambda@Edge in regions without ARM support (limited availability)
- Third-party services that provide x86-only agent binaries (APM agents, etc.)

## Best Practices
- **Default to Graviton for all new compute resources**: EC2, Fargate, Lambda, RDS, ElastiCache, OpenSearch (WHY: 20-34% cost reduction at identical performance; no code changes required for Laravel; migration effort is minimal)
- **Build multi-arch Docker images**: Use `docker buildx` for ARM + x86 images (WHY: enables rollback to x86 if issues arise; Fargate can use either architecture; CI/CD builds once, deploys to both)
- **Test with production traffic shadow before full cutover**: Route 10% traffic to Graviton for 48h (WHY: catches edge cases with PHP extensions or third-party services; production traffic exposes issues staging doesn't)
- **Migrate RDS after compute**: Both compute and database on Graviton for uniform architecture (WHY: eliminates cross-architecture compatibility questions; both save 20% independently)
- **Use Amazon Linux 2023 for best Graviton performance**: OS optimized for ARM Neoverse cores (WHY: kernel and libraries compiled with ARM optimizations; up to 5% additional performance over generic Linux)

## Architecture Guidelines
- Use Graviton across all AWS compute services where available
- Build multi-arch CI/CD pipelines for container builds (buildx, manifest lists)
- Specify ARM architecture explicitly in CloudFormation/Terraform to prevent x86 default
- Migrate non-production environments first, monitor 48h, then production
- If using Laravel Vapor, enable Lambda ARM for 20% cost reduction per function

## Performance Considerations
- Graviton3: 25% faster integer performance, 2x faster floating-point than Graviton2
- Graviton4: 30% better performance than Graviton3, up to 96 vCPUs
- PHP-FPM and Laravel Octane: identical or better performance vs x86 at same clock speed
- I/O-bound apps: no performance difference; CPU-bound apps: Graviton often faster
- Graviton instances may have slightly less availability in older AWS regions

## Security Considerations
- Graviton uses the same AWS Nitro System as x86 instances for security isolation
- ARM architecture has different Spectre/Meltdown mitigations; AWS handles at hypervisor level
- PHP extension compatibility should be verified in CI/CD (some have x86 JIT assumptions)
- No known ARM-specific vulnerabilities affecting Laravel deployments
- All standard AWS encryption, IAM, and network security features work identically

## Common Mistakes
1. **Assuming x86 compatibility issues without testing**: Most PHP/Laravel apps work unchanged on ARM (Cause: past experience with ARM in different ecosystems; Consequence: missing 20%+ savings due to unfounded fear; Better: test staging on Graviton for 48h; 90% of apps have zero issues)
2. **Not updating CI/CD pipeline for ARM builds**: Pipeline only produces x86 Docker images (Cause: default CI/CD configuration; Consequence: no ARM images available for deployment; Better: add `docker buildx` to pipeline before migration)
3. **Ignoring RDS Graviton migration**: Saving 20% on compute but keeping x86 RDS (Cause: database migration considered separate; Consequence: missing additional 20% RDS savings; Better: plan RDS Graviton migration alongside compute; db.r7g series supports both MySQL and PostgreSQL)
4. **Using x86-only Lambda layers**: Third-party Lambda layers may not have ARM versions (Cause: layer provider hasn't published ARM variant; Consequence: Lambda function fails on ARM; Better: check layer ARN supports arm64 before enabling ARM Lambda)

## Anti-Patterns
- **Staying on x86 by default**: "We've always used x86" with no Graviton evaluation
- **Mixing architectures without multi-arch builds**: Single-arch images that only work on one platform
- **Ignoring Graviton for cost reports**: Reporting 20% higher costs than necessary by using x86
- **Late adoption**: Waiting until x86 becomes more expensive as Graviton subsidies end

## Examples
- **EC2 migration**: t3.medium ($30/month) → t4g.medium ($24/month) = 20% savings; same vCPU/memory; zero code changes
- **Fargate migration**: x86 1vCPU/2GB ($35.90/month) → ARM ($26.15/month) = 27% savings; rebuild container image
- **Lambda migration**: 1M requests/month, 256MB, 500ms avg duration: x86 ($4.72) → ARM ($3.43) = 27% savings

## Related Topics
- Lambda Pricing Breakdown (ku-22)
- Fargate Pricing Analysis (ku-24)
- ElastiCache Graviton Savings (ku-16)
- Lambda vs EC2 Breakeven (ku-23)

## AI Agent Notes
- Default: use Graviton for all new compute resources
- Graviton migration is the highest-ROI single change for AWS cost optimization
- Test first on staging; 90%+ of Laravel workloads migrate with zero issues
- Build multi-arch Docker images for rollback safety
- Also migrate RDS and ElastiCache for additional savings
