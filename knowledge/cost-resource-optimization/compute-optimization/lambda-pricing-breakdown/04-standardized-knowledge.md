# Lambda Pricing Breakdown

## Metadata
- **ID**: KU-22-LAMBDA-PRICING
- **Subdomain**: compute-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Lambda Pricing Breakdown
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Lambda pricing consists of request charges ($0.20/1M requests) and duration charges ($0.0000166667/GB-second) with a generous free tier (1M requests + 400,000 GB-s/month, never expires). ARM/Graviton functions deliver ~34% cost reduction vs x86. Understanding the per-millisecond billing model is critical for determining when Lambda is cost-effective vs EC2 or Fargate. Lambda's true cost often includes hidden components: VPC networking, Provisioned Concurrency, and data transfer.

## Core Concepts
- **Request pricing**: $0.20 per 1 million requests (first 1M/month free)
- **Duration pricing**: $0.0000166667 per GB-second (first 400,000 GB-s/month free)
- **ARM pricing**: ~20-34% cheaper than x86 for both request and duration components
- **Provisioned Concurrency**: Additional cost for pre-warmed environments; charged when enabled regardless of usage
- **Free tier**: 1M requests/month + 400,000 GB-s/month, never expires
- **Memory range**: 128MB to 10,240MB, billed in 1MB increments
- **Minimum bill**: 100ms minimum duration per invocation

## When To Use
- Spiky, low-volume APIs and webhooks under 5M requests/month
- Event-driven architectures (S3 events, SQS, DynamoDB Streams, EventBridge)
- CRON/scheduled tasks with irregular execution patterns
- Short-running functions under 15-minute timeout
- Workloads with significant idle periods where scale-to-zero saves compute cost
- Prototypes and low-traffic applications leveraging the generous free tier

## When NOT To Use
- Steady 24/7 workloads with predictable traffic above 5M requests/month
- Functions needing >15-minute execution time (use Fargate or Step Functions)
- Workloads with strict cold-start latency requirements (user-facing APIs at peak traffic)
- Heavy computation that runs continuously (EC2/Fargate cheaper per compute-hour)
- VPC-connected functions with high data transfer (NAT Gateway costs add up)

## Best Practices
- **Always use ARM/Graviton architecture**: Switch from x86 for ~34% duration cost reduction (WHY: PHP/Laravel runs identically on ARM; no code changes needed; the only reason to stay x86 is native binary extensions)
- **Right-size memory allocation**: Find cost-optimal memory (not maximum performance) (WHY: higher memory costs more per second but may reduce duration; test at 128MB, 256MB, 512MB, 1024MB; compute cost per invocation at each level; the cheapest option is rarely the lowest or highest memory)
- **Use Compute Savings Plans for Lambda**: 1-3 year commitment for up to 17% discount (WHY: Lambda is eligible for Compute Savings Plans; if you have baseline Lambda usage, commit to it; 17% discount with no downside — Savings Plans cover any compute usage)
- **Avoid Provisioned Concurrency as default**: Only use when cold starts are unacceptable AND traffic is consistent (WHY: Provisioned Concurrency charges even when functions aren't invoked; 10 provisioned 1GB functions = ~$50/month baseline — that's the cost of a t4g.small EC2 instance running 24/7)
- **Set reserved concurrency per function**: Prevent runaway costs from traffic spikes (WHY: one function can consume the account-level 1000 concurrency quota; reserved concurrency caps per-function usage; also serves as cost control — unexpected traffic spike can't exceed reserved limit)

## Architecture Guidelines
- Lambda for event-driven, short-lived, variable-load workloads
- EC2/Fargate for long-running, steady-state, latency-sensitive workloads
- Tag Lambda functions by environment, team, and endpoint for cost allocation
- Use AWS Lambda Powertools for structured logging and cost attribution
- Implement idempotency in all Lambda functions to handle retry-induced cost spikes

## Performance Considerations
- Memory allocation directly impacts CPU: 1769MB gives 1 full vCPU equivalent
- 15-minute timeout limit; use Step Functions for orchestrating longer workflows
- Response streaming (2025+) reduces time-to-first-byte for large payloads
- Cold starts: 200-1000ms for PHP/Bref; SnapStart available for Java/.NET only
- Higher memory = faster execution but higher per-second cost; find cost-optimal point

## Security Considerations
- Lambda@Edge executes at CloudFront edge locations; data in transit through AWS backbone
- VPC-connected Lambda requires NAT Gateway for internet access (adds cost and complexity)
- Lambda function IAM roles should follow least privilege per function
- Environment variables can be encrypted with KMS at no additional Lambda cost
- Lambda function URL exposes HTTPS endpoint; configure auth (IAM or resource-based policy)

## Common Mistakes
1. **Not enabling ARM/Graviton architecture**: Defaulting to x86 leaves 20-34% savings unclaimed (Cause: "works on x86, don't change it"; Consequence: paying ~34% more for duration than necessary; Better: enable ARM in Lambda console; PHP/Python/Node functions work identically)
2. **Over-allocating memory without testing**: Setting 1024MB "to be safe" when 256MB suffices (Cause: memory doesn't seem expensive individually; Consequence: 4x higher duration cost for no performance gain; Better: test at multiple memory levels; compute cost per invocation; pick cheapest that meets latency SLA)
3. **Ignoring VPC networking costs**: Thinking Lambda cost = request + duration only (Cause: AWS docs separate compute and networking charges; Consequence: surprise $50-200/month NAT Gateway + data transfer bill; Better: evaluate VPC endpoints for S3/DynamoDB, or minimize Lambda VPC connections)
4. **Not factoring Lambda@Edge cost**: CloudFront Lambda@Edge charges per invocation at edge (Cause: Lambda@Edge has different pricing than regional Lambda; Consequence: 2-3x higher per-request cost for edge functions; Better: use CloudFront Functions for simple header manipulation; only use Lambda@Edge for complex logic)

## Anti-Patterns
- **Runaway recursion**: Lambda calling itself causes exponential cost spiral
- **Unthrottled event sources**: SQS with high traffic drives concurrency to account limits
- **Lambda for everything**: Using Lambda for long-running, steady-state workloads
- **Vapor cost trap**: Not realizing single HTTP request = 9+ Lambda invocations in Vapor

## Examples
- **Light API endpoint**: 256MB, 200ms avg duration, 1M req/month; cost = $0.20 (requests) + $0.83 (duration) = $1.03/month (mostly covered by free tier)
- **Medium API endpoint**: 512MB, 500ms avg duration, 10M req/month; cost = $2.00 + $20.80 = $22.80/month; ARM reduces to ~$15.00
- **Heavy data processing**: 2048MB, 10s avg duration, 500K req/month; cost = $0.10 + $166.67 = $166.77/month; evaluate Fargate alternative

## Related Topics
- Lambda vs EC2 Breakeven (ku-23)
- Fargate Pricing Analysis (ku-24)
- Graviton Price-Performance (ku-26)
- Vapor Lambda Invocation Cost (ku-28)

## AI Agent Notes
- Default: enable ARM for all Lambda functions
- Default: set reserved concurrency per function
- Memory right-sizing yields 30-60% cost reduction vs naive allocation
- Include VPC networking costs in total Lambda cost calculation
- Lambda is not always cheapest; evaluate at >5M requests/month
