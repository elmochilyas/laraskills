## Model Your Specific Workload
---
## Cost Optimization
---
Always calculate Lambda vs EC2 breakeven using your actual memory, duration, and traffic pattern; never use the reference 30M requests figure.
---
Breakeven shifts dramatically with memory and duration; a 512MB/1s function breakeven is ~7.5M requests, not 30M. Modeling with actual metrics prevents wrong platform choice.
---
Our profile: 512MB, 800ms avg, 15M req/month. Breakeven = ~8M req. Choose EC2.
---
Using the reference "30M requests at 256MB/500ms" for a 512MB/1s workload.
---
No common exceptions; always model your specific workload.
---
Wrong platform choice: either paying 2-3x too much on Lambda or over-provisioned on EC2.
---
## Include Operational Overhead in Comparison
---
## Cost Optimization
---
Always factor operational overhead (patching, monitoring, capacity planning) when comparing Lambda and EC2 total cost.
---
EC2 savings are partially offset by 5-10 hours/month DevOps overhead for patching and monitoring; Fargate partially reduces this. All-in comparison gives accurate picture.
---
Lambda: $1,200 compute + $0 ops = $1,200. EC2: $800 compute + $500 ops (engineer time) = $1,300.
---
Comparing Lambda $1,200 vs EC2 $800 without factoring engineer time for EC2 management.
---
Teams with fully automated CI/CD and immutable deployments where EC2 ops overhead is minimal.
---
Overestimating EC2 savings by 20-40% by ignoring ongoing operational costs.
---
## Use Fargate as Compromise
---
## Architecture
---
Prefer Fargate over Lambda for workloads between 5-50M requests/month where operational simplicity matters.
---
Fargate gives Lambda-like operational simplicity (no server management) at near-EC2 pricing; often the sweet spot for Laravel apps that have outgrown Lambda but are not at extreme scale.
---
10M req/month, 4 Fargate tasks (1 vCPU/2GB ARM) at ~$180/month.
---
Staying on Lambda at 30M req/month because "serverless is simpler."
---
Maximum cost optimization at extreme scale where EC2's 20-40% discount over Fargate justifies ops overhead.
---
Paying Lambda premium at scale or incurring EC2 operational overhead unnecessarily.
---
## Evaluate Provisioned Concurrency Trigger
---
## Cost Optimization
---
If Lambda cold starts are unacceptable and require Provisioned Concurrency, evaluate whether EC2/Fargate would be cheaper for the workload.
---
Provisioned Concurrency adds baseline cost that shifts the breakeven point; 10 provisioned 1GB functions cost ~$50/month — that baseline may make EC2 cheaper for the entire workload.
---
Need Provisioned Concurrency for 5 functions at 1GB each: ~$25/month baseline. EC2 t4g.small at $12/month might be cheaper.
---
Adding Provisioned Concurrency to Lambda without checking if EC2 would be cheaper with that baseline cost.
---
Extremely spiky traffic where Provisioned Concurrency is needed for <5 functions; model to confirm.
---
Paying for Provisioned Concurrency baseline when EC2 would be cheaper overall.
---
## Use 90-Day Cost Explorer Analysis
---
## Cost Optimization
---
Always analyze 90 days of actual cost and usage data before committing to a compute model change; never decide on hourly or daily data.
---
Breakeven analysis using theoretical traffic is unreliable; actual patterns include idle periods, spikes, and growth that change the math. 90-day window captures weekly and monthly cycles.
---
CloudWatch 90-day: average 200 req/s, peaks at 800 req/s at month-end. Model breakeven on this pattern.
---
Deciding Lambda vs EC2 based on 1 hour of peak traffic data.
---
Brand-new application with no traffic history; revisit after 90 days.
---
Wrong compute choice based on incomplete traffic data.
