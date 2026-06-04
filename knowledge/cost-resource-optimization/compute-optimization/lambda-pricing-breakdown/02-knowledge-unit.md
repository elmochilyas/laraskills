# K22: Lambda Pricing Breakdown

## Metadata
- **ID**: K22
- **Subdomain**: Compute Optimization
- **Topic**: Lambda Pricing Breakdown
- **Source**: AWS Documentation, Wring Blog (March 2026), CloudZero (2026)
- **Reliability**: High

## Executive Summary
Lambda pricing consists of request charges ($0.20/1M requests) and duration charges ($0.0000166667/GB-second) with a generous free tier. ARM/Graviton2 functions deliver ~34% cost reduction vs x86. Understanding the per-millisecond billing model is critical for determining when Lambda is cost-effective vs EC2 or Fargate.

## Core Concepts
- **Request pricing**: $0.20 per 1 million requests (first 1M/month free)
- **Duration pricing**: $0.0000166667 per GB-second (first 400,000 GB-s/month free)
- **ARM pricing**: ~20-34% cheaper than x86 for both request and duration components
- **Provisioned Concurrency**: Additional cost for pre-warmed environments; charged when enabled regardless of usage
- **Free tier**: 1M requests/month + 400,000 GB-s/month, never expires
- **Memory range**: 128MB to 10,240MB, billed in 1MB increments

## Mental Models
- **Pay-per-use vs flat-rate breakeven**: Lambda is cheaper for spiky workloads that scale to zero; EC2/Fargate win for steady 24/7 traffic above ~30M requests/month at 256MB/500ms avg duration
- **Memory as CPU throttle**: Higher memory allocation proportionally increases CPU allocation and per-second cost; the goal is to find the cost-optimal memory setting (typically 1-2x current usage)

## Internal Mechanics
Lambda bills in millisecond increments with 100ms minimum duration. Each additional 1MB of memory above 128MB increases both CPU allocation and cost proportionally. The GB-second metric multiplies allocated memory (GB) by execution time (seconds). Example: 256MB function running 500ms = 0.256 GB × 0.5s = 0.128 GB-seconds per invocation. At $0.0000166667/GB-s, that's $0.00000213 per invocation in duration costs.

## Patterns
- **Cost explorer tagging**: Tag Lambda functions by environment, team, and endpoint to identify cost drivers
- **Reserved Concurrency**: Prevents runaway costs from traffic spikes but doesn't save money directly
- **Savings Plans**: Compute Savings Plans apply to Lambda at up to 17% discount with 3-year commitment
- **Graviton migration**: Switching x86→ARM cuts duration cost by ~34% with no code changes for PHP/Python/Node

## Architectural Decisions
- Choose Lambda vs Fargate based on workload continuity, not just per-unit cost
- Use ARM/Graviton for all new Lambda functions unless native x86 binary dependencies exist
- Consider 15-minute execution time limit for long-running tasks — use Step Functions or Fargate instead

## Tradeoffs
- **Higher per-unit cost vs zero idle cost**: Lambda is ~2x more expensive per compute-hour than Fargate/EC2 but charges zero when idle — wins for spiky workloads
- **Cold start latency (100ms-1s) vs Provisioned Concurrency cost**: Pre-warming eliminates latency but adds baseline cost equivalent to running an EC2 instance
- **Simpler operations vs less control**: Lambda removes server management but limits runtime customization and debugging

## Performance Considerations
- Memory allocation directly impacts CPU: 1769MB gives 1 full vCPU equivalent; higher memory = faster execution but higher per-second cost
- 15-minute timeout limit; use Step Functions for orchestrating longer workflows
- Response streaming (2025+) reduces time-to-first-byte for large payloads at no additional cost

## Production Considerations
- Monitor Lambda throttles, iterator age (for stream sources), and concurrent execution count
- Set reserved concurrency per function to prevent one function consuming the account-level 1000 concurrency quota
- Use CloudWatch Lambda Insights for cost-per-invocation analysis
- Enable Lambda Powertools for structured logging and cost allocation

## Common Mistakes
- Not enabling ARM/Graviton architecture (leaving ~20-34% savings on table)
- Over-allocating memory without testing the cost-performance Pareto frontier
- Ignoring provisioned concurrency costs for always-warm functions that could run on Fargate cheaper
- Not factoring VPC networking cost (NAT Gateway, VPC endpoints) into Lambda total cost

## Failure Modes
- Runaway recursion: Lambda calling itself causing exponential cost spiral (always set reserved concurrency)
- Unthrottled event sources: SQS/DynamoDB Streams with high traffic can drive Lambda concurrency to account limits
- Deployment side effects: Every deployment triggers new execution environments, causing temporary cold-start spike

## Ecosystem Usage
- **Laravel Vapor**: Runs Laravel on Lambda; each HTTP request may count as 9+ Lambda invocations
- **Bref PHP runtime**: Open-source PHP on Lambda for custom Laravel deployments (1x invocation per request)
- **Laravel Octane on Lambda**: Possible via Bref but limited by 15-min timeout and cold-start overhead

## Related Knowledge Units
- K23: Lambda vs EC2 Breakeven Analysis
- K24: Fargate Pricing Analysis
- K26: Graviton Price-Performance
- K28: Vapor Lambda Invocation Multiplier

## Research Notes
Lambda pricing has remained stable since 2020. Key 2025-2026 changes: response streaming (no additional cost), enhanced monitoring costs separated from compute, and Compute Savings Plans expanded to cover Lambda. ARM functions now account for ~40% of new Lambda deployments. The pricing model remains the same, making the breakeven analysis timeless.
