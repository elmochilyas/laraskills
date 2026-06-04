# KU-12-PERFORMANCE-VS-COST: Performance vs Cost

## Metadata
- **ID**: KU-12-PERFORMANCE-VS-COST
- **Subdomain**: Compute Optimization
- **Topic**: Performance vs Cost
- **Source**: Compute Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Performance and cost are inversely related: higher performance typically costs more. The engineering challenge is finding the optimal point where marginal cost equals marginal benefit. For Laravel applications, this involves choosing between compute options (Lambda vs EC2 vs Fargate), optimization levels (OPcache vs JIT vs Octane), and instance sizes. The "knee" of the cost-performance curve is the sweet spot where additional spending yields diminishing returns.

## Core Concepts
- **Cost-performance curve**: Mapping of compute spend to throughput/latency
- **Breakeven point**: Where one solution becomes cheaper than another at given throughput
- **Lambda vs EC2 breakeven**: Lambda is cheaper for low-traffic (<100 req/s); EC2 is cheaper for high-traffic (1000+ req/s)
- **diminishing returns**: 80% of optimization achieved with 20% of the effort; last 20% costs 80% more
- **Opportunity cost**: Engineering time spent on optimization vs feature development
- **Total cost of ownership (TCO)**: Compute + operational overhead + engineering time

## Mental Models
- Always measure first; never recommend optimization without profiling data
- Use breakeven analysis for Lambda vs EC2/Fargate decisions
- Default: OPcache + PHP-FPM tuning as first optimization (highest ROI)
- Octane only after confirming PHP-FPM optimization is exhausted

## Internal Mechanics
- OPcache: single config change, 50-70% CPU reduction, zero risk
- PHP-FPM tuning: config change, 10-30% throughput improvement
- Octane: code changes, 2-5x throughput, operational complexity
- Octane + JIT: PHP config, 20-30% additional CPU improvement for CPU-bound workloads
- Lambda: zero operations, but 200ms cold start penalty for VPC-connected functions
- EC2 + Octane: maximum performance, requires server management or ASG/AMI automation

## Patterns
- Measure before optimizing
- Use break-even analysis for compute decisions
- Target the 80/20 rule
- Set performance budgets
- Calculate cost per request

## Architectural Decisions
- Low traffic (<100 req/s): Lambda + API Gateway + RDS Proxy (burst-friendly, zero idle cost)
- Medium traffic (100-1000 req/s): Fargate + ALB + RDS/Aurora (balanced cost and control)
- High traffic (1000+ req/s): EC2 + ALB + RDS + ElastiCache (maximum price-performance)
- Use RIs at scale: When monthly compute > $1000, purchase 3-year RIs
- Benchmark before migration: Run 24-hour load test with k6/locust before switching compute platforms

## Tradeoffs
**When To Use:**
- Performance optimization: When response time exceeds SLOs (e.g., p95 > 500ms)
- Cost optimization: When compute spend is material (>10% of revenue or budget)
- Breakeven analysis: When choosing between compute options (Lambda vs EC2, RDS vs Aurora)
- Cost-performance tradeoff: When deciding if Octane migration is worth the engineering effort
- Optimization budget: 1 hour of engineer time = ~$100; if optimization saves $10/month, ROI is 10 months

**When NOT To Use:**
- Over-optimizing: Don't spend $10K engineering time to save $50/month compute cost
- Premature optimization: Don't optimize before measuring (you don't know where the bottleneck is)
- Optimizing for theoretical peak: Design for P95/P99 traffic, not hypothetical maximum
- Performance at any cost: Don't double compute budget for 10% latency improvement unless latency directly impacts revenue

## Performance Considerations
- OPcache: single config change, 50-70% CPU reduction, zero risk
- PHP-FPM tuning: config change, 10-30% throughput improvement
- Octane: code changes, 2-5x throughput, operational complexity
- Octane + JIT: PHP config, 20-30% additional CPU improvement for CPU-bound workloads
- Lambda: zero operations, but 200ms cold start penalty for VPC-connected functions
- EC2 + Octane: maximum performance, requires server management or ASG/AMI automation

## Production Considerations
- Performance optimization should not bypass security controls (e.g., caching authenticated data)
- Cost optimization should not reduce security budget (WAF, Shield, GuardDuty)
- Third-party performance services (Blackfire, Tideways) need IAM access; scope appropriately
- Load testing tooling should not trigger security alarms (whitelist during tests)

## Common Mistakes
- **Optimizing before measuring**: Spending 40 hours on Octane migration when the bottleneck is a missing database index (Cause: assuming performance "must be PHP's fault"; Consequence: wasted engineering time, no measurable improvement; Better: profile first, find real bottleneck, apply targeted fix)
- **Ignoring breakeven points**: Using Lambda for high-traffic API servicing 5000 req/s (Cause: "serverless is always cheaper" assumption; Consequence: paying $5000/month vs $1500/month for EC2; Better: calculate breakeven at projected throughput)
- **Over-engineering for theoretical scale**: Designing for 1M req/s when current traffic is 100 req/s (Cause: "future-proofing"; Consequence: paying 10x for unused capacity; engineering time wasted on unscalable abstractions; Better: design for 5x current load, re-architect when growing)

## Failure Modes
- **Premium tier for no reason**: Using r7g.metal when m7g.large handles load (waste)
- **Optimization paralysis**: Never shipping features because "we need to optimize first"
- **Vanity metrics**: Optimizing for "requests per second" when actual bottleneck is feature velocity
- **Ignoring operations cost**: Self-managed Kafka cluster saves $200/month but requires 10 hours/week of engineer time

## Ecosystem Usage
- **Lambda vs EC2 comparison**: 500 req/s, 500ms average duration: Lambda = $1,234/month; EC2 (3 x m7g.large) = $216/month. Breakeven at ~150 req/s
- **Fargate vs EC2**: 1000 req/s, 4GB containers: Fargate = $1,200/month; EC2 (3 x m7g.xlarge) = $750/month. EC2 wins by 37%
- **OPcache ROI**: 1 config change, 5 minutes to implement, 50% CPU reduction = $200/month savings on 4 x m7g.large

## Related Knowledge Units
- VM Sizing (ku-01)
- Octane Resource Usage (ku-05)
- Server Provisioning (ku-02)
- Lambda Pricing

## Research Notes
Derived from Compute Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.