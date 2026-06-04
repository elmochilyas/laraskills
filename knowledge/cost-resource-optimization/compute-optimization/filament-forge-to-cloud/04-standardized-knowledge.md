# Filament Forge to Cloud Cost Reduction

## Metadata
- **ID**: KU-39-FILAMENT-MIGRATION
- **Subdomain**: compute-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Filament Forge to Cloud Migration
- **Version**: 1.0
- **Classification**: Speculative
- **Maturity**: Medium

## Overview
Filament (the Laravel admin panel framework) migrated from Forge (EC2) to Laravel Cloud (Fargate) and achieved 3x faster requests and 4x smaller replica footprint. The cost reduction came from Octane's throughput gains combined with Cloud's auto-scaling and auto-hibernation. This case study illustrates the compounding effect of platform + runtime optimization — the 4x replica reduction translated directly to 75% lower compute costs.

## Core Concepts
- **Before**: Forge on EC2 with PHP-FPM; 8-12 replicas to handle traffic
- **After**: Laravel Cloud with Octane (FrankenPHP); 2-3 replicas
- **3x speedup**: Octane's in-memory lifecycle eliminated per-request bootstrap overhead
- **4x replica reduction**: Each replica handles 4x throughput, reducing total compute by 75%
- **Compound effect**: Octane (3-10x throughput) × Graviton (20% cheaper) × Auto-scaling (right-sized)
- **Platform migration**: Moving from EC2 self-management to managed Fargate containers

## When To Use
- Evaluating Laravel Cloud as migration target from Forge/Vapor
- Apps with steady traffic that could benefit from Octane throughput improvements
- Teams considering the TCO of managed platform vs self-managed compute
- Applications where replica count is primarily constrained by request throughput
- Proof-of-concept for Octane migration to validate throughput gains in production

## When NOT To Use
- Apps already on Laravel Cloud with optimized configuration
- Workloads that are I/O bound rather than CPU bound (gains from Octane are smaller)
- Small apps with <$100/month compute costs (migration effort may not justify savings)
- Apps with complex Vapor-specific integrations (SQS batch event sources, etc.)
- Teams without capacity to test Octane compatibility (PHP extension conflicts)

## Best Practices
- **Measure before and after**: Instrument request throughput, p95 latency, and replica count before migration (WHY: the 3x/4x claims are specific to Filament's workload; your app may see different gains; measure to validate ROI of migration effort)
- **Migrate runtime first, platform second**: Test Octane on existing Forge/EC2 before moving to Cloud (WHY: isolates variables; confirms Octane gains without platform migration complexity; if Octane doesn't help, Cloud won't fix it)
- **Target fewer, larger replicas**: Filament went from 12 small replicas to 3 larger ones (WHY: Octane handles more requests per process; larger instances with Octane outperform many smaller PHP-FPM instances; fewer replicas also reduce ALB connection overhead)
- **Enable auto-scaling after migration**: Configure ECS Service Auto Scaling based on request count (WHY: right-sizing is a continuous process; auto-scaling adjusts to traffic patterns; Cloud's auto-hibernation scales to zero when idle)
- **Budget for migration TCO**: Include engineering hours, testing, and rollback capacity (WHY: migration saves 50-75% monthly but costs 2-4 weeks engineering time; breakeven is typically 2-4 months)

## Architecture Guidelines
- Start with Octane on existing Forge/EC2 deployment for validation
- Migrate one environment (staging) and run for 48h before production
- Use Cloud's auto-hibernation for non-production environments
- Configure Cloud spending limits (50/75/90% alerts) before migration
- Maintain rollback plan: keep Forge/EC2 running for 2 weeks post-migration

## Performance Considerations
- Octane throughput gains are largest for CPU-bound requests (API responses, view rendering)
- I/O bound requests (DB queries, external API calls) see smaller throughput improvements
- Cloud's auto-hibernation adds 500ms wake time for cold containers
- Filament's 3x gain may not apply to all Laravel applications; benchmark your workload
- Memory usage per Octane worker is typically 30-50% higher than PHP-FPM

## Security Considerations
- Cloud platform manages OS and runtime patching; reduces attack surface
- Container isolation between tenants on Fargate is AWS-managed
- Ensure Cloud deployment uses least-privilege IAM roles
- Review Cloud's data residency and encryption configuration
- Monitor Cloud deployment for unexpected auto-scaling events

## Common Mistakes
1. **Assuming Filament's results apply universally**: 3x throughput gain depends on workload pattern (Cause: case study generalizes well; Consequence: expecting 3x gain in I/O-heavy app and being disappointed; Better: benchmark Octane on your specific workload)
2. **Migrating platform and runtime simultaneously**: Moving to Cloud + Octane at same time (Cause: efficiency mindset; Consequence: cannot attribute cost changes to Octane vs Cloud factors; Better: migrate Octane first on Forge, then move to Cloud)
3. **Ignoring auto-hibernation wake time**: Cloud containers take 500ms to wake from idle (Cause: focused on cost math; Consequence: user-facing latency spikes during low-traffic periods; Better: set minimum replicas to avoid cold starts for user-facing APIs)
4. **Not accounting for Cloud premium**: Cloud includes Fargate premium + platform margin (Cause: comparing Forge EC2 cost only; Consequence: Cloud may cost more than properly right-sized Forge on EC2; Better: model TCO including engineering time, not just compute)

## Anti-Patterns
- **Rip-and-replace migration**: Moving all apps to Cloud simultaneously without validation
- **Cloud as silver bullet**: Expecting cost reduction without Octane optimization
- **No rollback plan**: Losing Forge/EC2 configuration after migration
- **Over-provisioning on Cloud**: Setting high minimum replicas negating auto-hibernation savings

## Examples
- **Pre-migration (Forge)**: 8 x t3.medium EC2 instances (2 vCPU, 4GB), 24 workers each, PHP-FPM, ~$1,200/month
- **Post-migration (Cloud)**: 2 x Fargate tasks (4 vCPU, 8GB ARM), Octane/FrankenPHP, auto-scaling, ~$400/month
- **Savings calculation**: ($1,200 - $400) / $1,200 = 67% cost reduction; breakeven at 3 months including migration effort

## Related Topics
- Laravel Octane Throughput (ku-38)
- Laravel Cloud vs Vapor (ku-27)
- PyleSoft Cost Reduction (ku-40)
- Trybe Cost Reduction (ku-41)

## AI Agent Notes
- Default: benchmark Octane on existing infrastructure before platform migration
- Compound optimization (runtime + platform + configuration) yields highest ROI
- Case study savings are workload-specific; always validate with own metrics
- Factor migration engineering cost into TCO calculation
- Use Cloud spending limits as safety net during migration
