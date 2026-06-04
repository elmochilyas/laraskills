## Enable ARM/Graviton for All Lambda Functions
---
## Cost Optimization
---
Always enable ARM/Graviton architecture for all Lambda functions; never default to x86.
---
ARM/Graviton provides ~34% duration cost reduction with identical PHP/Laravel execution performance; no code changes required.
---
Lambda function: Architecture = arm64, same code, 34% lower cost.
---
Lambda function left at default x86 architecture.
---
Lambda functions using x86-only Lambda layers (third-party binaries, some APM agents).
---
34% higher duration costs than necessary for every Lambda invocation.
---
## Right-Size Memory Allocation
---
## Performance
---
Always test Lambda function at multiple memory levels (128MB, 256MB, 512MB, 1024MB) and choose the cheapest per-invocation cost that meets latency SLA.
---
Higher memory costs more per second but reduces duration; the cheapest option is rarely the lowest or highest memory. Testing 4 levels identifies the cost-optimal point.
---
256MB: $0.0000012/invocation. 512MB: $0.0000010/invocation (faster, cheaper). Choose 512MB.
---
Setting 1024MB "to be safe" without testing lower memory levels.
---
Functions with such low traffic that optimization effort exceeds savings.
---
4x higher duration cost than necessary for no performance gain at 1024MB.
---
## Set Reserved Concurrency Per Function
---
## Reliability
---
Always set reserved concurrency on each Lambda function to cap unexpected cost spikes; never leave functions unlimited.
---
One function can consume the account-level 1000 concurrency quota; reserved concurrency caps per-function usage and serves as cost control — a traffic spike can't exceed the limit.
---
Production API function: reserved concurrency = 50. Dev function: reserved concurrency = 5.
---
No reserved concurrency on any function; one spike consumes all account concurrency.
---
Functions with built-in throttling upstream (API Gateway with Usage Plans).
---
Runaway costs from traffic spikes, other functions starved of concurrency.
---
## Avoid Provisioned Concurrency as Default
---
## Cost Optimization
---
Never enable Provisioned Concurrency unless cold starts are unacceptable AND traffic is consistent enough to justify baseline cost.
---
Provisioned Concurrency charges even when functions aren't invoked; 10 provisioned 1GB functions = ~$50/month baseline — that's the cost of a t4g.small EC2 instance running 24/7.
---
No Provisioned Concurrency for variable-traffic APIs; only for latency-sensitive steady-traffic functions.
---
10 provisioned functions for an API that receives 100 requests/hour.
---
User-facing APIs with strict sub-100ms latency SLA and consistent traffic patterns.
---
$50/month baseline cost for zero traffic periods; EC2 would be cheaper.
---
## Use Compute Savings Plans for Lambda
---
## Cost Optimization
---
Always purchase Compute Savings Plans for baseline Lambda usage; never pay full On-Demand Lambda pricing for predictable workloads.
---
Lambda is eligible for Compute Savings Plans; 1-3 year commitment provides up to 17% discount on all Lambda usage with no downside — Savings Plans cover any compute usage if Lambda needs change.
---
$200/month baseline Lambda compute: commit to $170/month Savings Plan, save $30/month.
---
Running predictable Lambda workloads without any commitment discount.
---
Zero or very low Lambda usage where commitment analysis is not cost-effective.
---
17% higher Lambda costs than necessary.
---
## Include VPC Networking Costs in Total
---
## Cost Optimization
---
Always include NAT Gateway ($32/month + $0.045/GB) and data transfer costs when calculating total Lambda cost for VPC-connected functions.
---
Lambda cost in AWS docs shows only compute + requests; VPC-connected Lambda requires NAT Gateway for internet access, adding $50-200/month that can exceed the compute cost itself.
---
Evaluate VPC endpoints for S3/DynamoDB to avoid NAT Gateway; consider Lambda in public subnet if no VPC access needed.
---
Calculating Lambda cost as only request + duration, ignoring $150/month NAT Gateway bill.
---
Lambda functions that don't need VPC or internet access (can run in public/default workspace).
---
Hidden $50-200/month costs that make Lambda more expensive than EC2 for VPC workloads.
