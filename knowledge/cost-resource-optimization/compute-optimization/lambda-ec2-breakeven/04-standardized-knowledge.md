# Lambda vs EC2 Breakeven Analysis

## Metadata
- **ID**: KU-23-LAMBDA-EC2-BREAKEVEN
- **Subdomain**: compute-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Lambda vs EC2 Breakeven Analysis
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: Medium-High

## Overview
The breakeven between Lambda and EC2 occurs at approximately 30 million requests per month at 256MB memory and 500ms average duration. Below this volume, Lambda's scale-to-zero makes it cheaper; above it, EC2's flat-rate pricing wins. The crossover shifts with memory allocation, execution duration, and utilization patterns. At 256MB/500ms, the breakeven is ~30M req/month; longer durations or higher memory push the breakeven lower.

## Core Concepts
- **Breakeven formula**: Lambda cost = request cost + duration cost; EC2 cost = instance hourly rate × hours running
- **Crossover point**: ~30M requests/month at 256MB/500ms avg (1,500 compute-seconds/minute)
- **Key variable**: Utilization percentage — Lambda idle costs $0; EC2 costs the same at 1% or 100% utilization
- **Memory sensitivity**: Doubling memory to 512MB halves the breakeven (~15M requests)
- **Duration sensitivity**: Doubling execution time to 1000ms halves breakeven proportionally
- **Hybrid**: Auto-scale EC2 for baseline + Lambda for overflow (complex but most cost-efficient)

## When To Use
- Lambda for APIs under 5M requests/month, CRON jobs, event handlers, variable workloads
- EC2/Fargate for baseline production web serving above 20M requests/month
- Fargate as middle ground: no server management with more predictable billing than Lambda
- Breakeven analysis before committing to any compute model at scale (>$1K/month)

## When NOT To Use
- Comparing peak-only Lambda cost to average EC2 cost (ignores EC2 headroom requirement)
- Assuming Lambda's per-GB-second rate is the only cost (Provisioned Concurrency, VPC networking add costs)
- Traffic growing above breakeven without switching from Lambda to EC2 (costs grow linearly with no ceiling)
- Using Lambda for workloads with consistent >30M requests/month at the reference profile

## Best Practices
- **Model your specific workload**: Calculate Lambda cost at your memory and duration, not the reference profile (WHY: breakeven shifts dramatically with memory and duration; a 512MB/1s function breakeven is ~7.5M requests, not 30M; model with your actual metrics)
- **Include operational overhead in comparison**: Lambda reduces patching, monitoring, and capacity planning (WHY: EC2 savings are partially offset by 5-10 hours/month DevOps overhead for patching and monitoring; Fargate partially reduces this)
- **Use 90-day Cost Explorer analysis**: Track actual utilization before committing to either model (WHY: breakeven analysis using theoretical traffic is unreliable; actual traffic patterns include idle periods, spikes, and growth that change the math)
- **Consider Fargate as compromise**: Serverless containers with predictable billing (WHY: Fargate gives Lambda-like operational simplicity at near-EC2 pricing; often the sweet spot for Laravel apps between 5-50M requests/month)
- **Test with Provisioned Concurrency**: If cold starts are unacceptable, evaluate whether Provisioned Concurrency cost pushes you to EC2 (WHY: Provisioned Concurrency adds baseline cost that changes breakeven; 10 provisioned 1GB functions cost ~$50/month)

## Architecture Guidelines
- Use Lambda for: APIs under 5M req/month, CRON jobs, event handlers, webhooks, SQS consumers
- Use EC2/Fargate for: production web serving above 20M req/month, long-running processes
- Use Fargate Spot for: queue workers regardless of volume (70% discount, worker-friendly)
- Provisioned Concurrency should trigger EC2/Fargate evaluation (if you need it, EC2 may be cheaper)
- Monitor cost per request monthly; set alerts when approaching breakeven thresholds

## Performance Considerations
- Lambda cold starts add 200-1000ms for PHP (Bref/Laravel) — problematic for user-facing endpoints
- EC2 gives full CPU control; Lambda shares CPU proportional to memory allocation
- Memory cap of 10,240MB per Lambda function; EC2 instances offer up to 768GB
- Fargate tasks have 30-120s startup time but no cold starts once running
- Lambda duration at 128MB is much slower than at 1769MB (1 full vCPU); cost-optimal memory may not be performance-optimal

## Security Considerations
- Lambda VPC functions need NAT Gateway for internet access (~$32/month + $0.045/GB) — shifts breakeven
- EC2 security groups provide network isolation; Lambda functions share AWS-managed infrastructure
- Lambda function IAM roles are per-function; EC2 instance profiles apply to all processes on the instance
- Both support encryption at rest and in transit; Lambda has simpler key management
- EC2 provides more granular network controls (VPC endpoints, subnet routing, NACLs)

## Common Mistakes
1. **Comparing peak-only Lambda cost to average EC2 cost**: EC2 needs headroom for traffic spikes (Cause: traffic is averaged in comparison; Consequence: underestimating EC2 capacity needed — 3 t4g.small for "average" but need 5 for peak; Better: model EC2 at peak capacity, not average)
2. **Forgetting EC2 includes OS overhead**: OS patching, monitoring agents, and logging consume resources (Cause: comparing Lambda and EC2 at "same compute"; Consequence: EC2 instance's usable compute is ~80% of total; Lambda has no OS overhead; Better: factor 15-20% overhead for EC2 OS/agents)
3. **Not factoring Lambda VPC networking costs**: NAT Gateway adds $32/month + $0.045/GB (Cause: Lambda initially developed without VPC support; Consequence: hidden $50-200/month for VPC-connected Lambda; Better: evaluate VPC endpoints vs NAT Gateway vs Lambda in public subnet)
4. **Ignoring Compute Savings Plans discounts**: Savings Plans reduce Lambda cost 17% and EC2 cost up to 66% (Cause: comparing list prices; Consequence: breakeven analysis is incorrect by 20-50%; Better: model both with expected commitment discounts applied)

## Anti-Patterns
- **Lambda-only architecture at scale**: 100% serverless for high-traffic Laravel apps
- **EC2 over-provisioned "for safety"**: Running 10 instances when 3 would handle peak traffic
- **Vapor lock-in without breakeven review**: Staying on Vapor (Lambda) as traffic grows past breakeven
- **Ignoring Fargate option**: Jumping from Lambda to EC2 without evaluating Fargate middle ground

## Examples
- **Breakeven at 256MB/500ms**: Lambda at 30M req = $68.40; EC2 (2.5 t4g.small) = ~$30/month; crossover ~13M req
- **Breakeven at 512MB/1000ms**: Lambda at 7.5M req = $34.20; EC2 (2 t4g.small) = ~$24/month; crossover ~5M req
- **With Provisioned Concurrency**: 10 provisioned functions (256MB) add ~$50/month baseline; shifts EC2 crossover ~20% lower

## Related Topics
- Lambda Pricing Breakdown (ku-22)
- Fargate Pricing Analysis (ku-24)
- Graviton Price-Performance (ku-26)
- Laravel Cloud vs Vapor (ku-27)

## AI Agent Notes
- Default: model your specific memory/duration, not the reference profile
- Breakeven analysis must include operational overhead, not just raw compute
- Fargate often wins for Laravel workloads in the 5-50M req/month range
- Include Provisioned Concurrency costs if cold starts are unacceptable
- Re-evaluate quarterly as traffic patterns change
