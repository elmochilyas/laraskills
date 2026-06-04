## Measure Your Own Lambda Multiplier
---
## Cost Optimization
---
Always measure your actual Vapor Lambda multiplier before projecting savings; never assume Trybe's 9x figure applies to your app.
---
The 9x multiplier is an estimate; queue-heavy apps have higher multipliers, API-only apps have lower. Your actual multiplier determines your savings percentage.
---
30-day measurement: 45M Lambda invocations / 5M HTTP requests = 9x multiplier. Project 40% savings.
---
Assuming 9x for an API-only app with minimal workers; actual multiplier is 5x.
---
No common exceptions; measurement is the only way to know.
---
Incorrect savings projection by 20-50%, wrong migration ROI calculation.
---
## Target >$10K/Month Vapor Spend First
---
## Cost Optimization
---
Prioritize Cloud migration for Vapor deployments spending more than $10K/month; highest absolute savings per migration effort.
---
Trybe at $50K+/month saved $20K+/month; a $15K/month Vapor app at 40% savings = $6K/month; payback at 2 weeks engineering = 1 month.
---
$25K/month Vapor: projected $10K/month savings; 3-week migration; <2 month payback.
---
$2K/month Vapor: $800/month savings, 3-week migration, 7.5 month payback.
---
Apps with high growth trajectory where savings will compound as traffic scales.
---
Negative or marginal ROI on migration engineering for low-spend Vapor deployments.
---
## Use Private Cloud for High Volume
---
## Architecture
---
Prefer Laravel Private Cloud (dedicated Fargate) for workloads exceeding 100M requests/month; standard Cloud may suffice below that.
---
At 500M req/month, noisy-neighbor risk on shared Fargate is real; Private Cloud provides resource isolation and performance predictability.
---
>200M req/month: Private Cloud with dedicated Fargate cluster.
---
Standard Cloud at 500M req/month experiencing noisy-neighbor latency issues.
---
Workloads with low traffic where standard Cloud auto-hibernation provides sufficient isolation.
---
Performance variability from shared Fargate resources, unpredictable response times.
---
## Mandate Octane at Scale
---
## Architecture
---
Always require Octane for Laravel deployments exceeding 50M requests/month; PHP-FPM is uneconomical at this scale.
---
Octane's 3-10x throughput improvement is mandatory for cost-effective compute at extreme scale; the container savings from Octane make the difference between sustainable and unsustainable costs.
---
500M req/month: Cloud with Octane + FrankenPHP + Graviton + Savings Plans.
---
PHP-FPM at 500M req/month requiring 10x more containers than Octane equivalent.
---
Workloads with Octane-incompatible packages that cannot be migrated; evaluate platform alternatives.
---
5-10x more containers than necessary, unsustainable compute costs, unnecessary scaling challenges.
---
## Build Cost Model With Upper and Lower Bounds
---
## Cost Optimization
---
Always model Lambda and Fargate costs with upper (peak) and lower (trough) traffic bounds; Lambda grows super-linearly, Fargate grows linearly.
---
Lambda cost = request cost + (volume × duration × memory), which is super-linear due to multiplier; Fargate cost = container count × container price, which is linear. Savings increase with volume.
---
Lambda: $50K. Fargate: $30K. As traffic grows, Lambda at $100K vs Fargate at $55K. Savings increase.
---
Single-point cost comparison without modeling growth trajectory.
---
Choosing Lambda at scale when Fargate would be increasingly cheaper with growth.
