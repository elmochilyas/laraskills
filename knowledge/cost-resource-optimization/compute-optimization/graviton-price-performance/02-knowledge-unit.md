# K26: Graviton Price-Performance

## Metadata
- **ID**: K26
- **Subdomain**: Compute Optimization
- **Topic**: Graviton Price-Performance
- **Source**: AWS Documentation, Benchmarks, Wring Blog (2026)
- **Reliability**: High

## Executive Summary
AWS Graviton (ARM) processors deliver 20-40% better price-performance than equivalent x86 instances for Laravel workloads. The savings apply across EC2 (20% cheaper), Fargate (20% cheaper), and Lambda (34% cheaper). PHP and Laravel have excellent ARM support as of PHP 8.0+, making Graviton the default recommendation for new deployments. Migration is typically zero code changes — just select the Graviton instance type.

## Core Concepts
- **EC2 savings**: t4g (Graviton) ~20% cheaper than t3 (x86) for same vCPU/memory
- **Fargate savings**: ARM Fargate = $0.03238/vCPU-hour vs x86 $0.04048 (~20% savings)
- **Lambda savings**: ARM functions cost ~34% less than x86; same price for requests, cheaper for duration
- **RDS savings**: db.r7g instances ~20% cheaper than db.r7i (x86) for same class
- **ElastiCache savings**: cache.r7g nodes ~20% cheaper than cache.r7i
- **PHP compatibility**: PHP 8.0+ has first-class ARM support; Laravel runs identically

## Mental Models
- **ARM as default, x86 as exception**: Start with Graviton; switch to x86 only if binary compatibility requires it
- **Two engines, same car**: Graviton and x86 deliver the same experience; one is just more fuel-efficient
- **Incumbency tax**: x86's historical dominance means a 20% premium for older architecture

## Internal Mechanics
Graviton processors (Graviton2/Graviton3/Graviton4) use 64-bit ARM Neoverse cores custom-designed by AWS. Graviton3 offers 25% faster integer performance than Graviton2. Graviton4 (2024+) offers 30% better performance than Graviton3 with up to 96 vCPUs. For PHP, the compiled binary differences are handled by the Amazon Linux distribution — application code is identical.

## Patterns
- **Greenfield**: Always use Graviton for new deployments
- **Brownfield migration**: Test with one instance first, then migrate ASG. 90% of workloads migrate without issues
- **Container strategy**: Build multi-arch Docker images (docker buildx) that run on both ARM and x86
- **CI/CD pipeline**: Build and test on ARM to catch compatibility issues early

## Architectural Decisions
- Use Graviton for: EC2 web servers, Fargate tasks, Lambda functions, ElastiCache nodes, RDS instances
- Stay x86 for: Workloads with native x86 binary dependencies, Windows workloads, some legacy .NET apps
- Multi-arch builds: Support both during migration window for rollback safety
- Migrate staging first, then production after 48h of observation

## Tradeoffs
- **20% cost savings vs migration risk**: Graviton migration is low-risk for PHP/Laravel but requires testing
- **Better performance-per-watt vs fewer native extensions**: Most PHP extensions are pure PHP or support ARM
- **Future-proof vs short-term friction**: x86 reservation lock-in makes switching harder over time

## Performance Considerations
- Graviton3: 25% faster integer, 2x faster floating point than Graviton2
- Graviton4: 30% better than Graviton3, up to 96 vCPUs
- PHP-FPM and Laravel Octane: No performance regression vs x86 at same clock speed
- I/O-bound apps: Same performance; CPU-bound apps: Graviton often faster due to better architecture

## Production Considerations
- Use Amazon Linux 2023 (ARM-optimized) for best Graviton performance
- Enable multi-arch builds in CI/CD pipeline before migration
- Test with production traffic shadow for 48h before full cutover
- If using RDS, also consider Graviton RDS instances for uniform architecture

## Common Mistakes
- Assuming x86 compatibility issues without testing (most PHP/Laravel apps work fine on ARM)
- Not updating CI/CD pipeline for ARM builds before migration
- Using x86-only RDS or ElastiCache alongside Graviton compute (still saves, but can optimize further)
- Ignoring Lambda@Edge: ARM support limited to specific regions for edge functions

## Failure Modes
- Rare: PHP extension compiled for x86 only (ffmpeg, imagick in some configurations) — use Docker multi-stage or PECL
- Redis/ValKey compatibility: works identically on ARM; no known issues
- Lambda SnapStart: Java-only currently; not relevant for PHP/Laravel
- Graviton instances may have slightly less availability in older regions

## Ecosystem Usage
- **Laravel Forge**: Supports Graviton instances via t4g naming convention
- **Laravel Cloud**: Fargate ARM by default for all containers
- **Laravel Vapor**: Lambda ARM available; 20% cost reduction
- **RDS Graviton**: db.r7g/r6g instances for Aurora and RDS PostgreSQL/MySQL

## Related Knowledge Units
- K22: Lambda Pricing Breakdown
- K24: Fargate Pricing Analysis
- K16: ElastiCache Graviton Savings

## Research Notes
Graviton adoption in 2026: ~40% of new EC2 instances in AWS are Graviton. AWS projects >60% by 2027. x86 reservation discounts are narrowing as Graviton adoption increases. For Laravel, PHP 8.x series has excellent ARM support. Graviton4 is the current generation as of 2026, offering the best price-performance ratio. Graviton-based development environments (Apple Silicon Macs are ARM) also simplify local testing.
