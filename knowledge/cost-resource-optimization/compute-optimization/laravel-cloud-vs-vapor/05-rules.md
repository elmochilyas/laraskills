## Model TCO Including Hidden Costs
---
## Cost Optimization
---
Always model total cost of ownership including Vapor's Lambda multiplier, API Gateway, and CloudFront costs when comparing Vapor to Cloud; never compare compute pricing alone.
---
Vapor's apparent Lambda cost is only part of the bill; Cloud bundles infrastructure into container pricing. Raw compute comparison understates Vapor's total cost by 30-50%.
---
TCO: Vapor $3,500 (Lambda + API Gateway + CloudFront + 9x multiplier) vs Cloud $2,000 (Fargate bundled).
---
Comparing Vapor's "$1,200 Lambda" to Cloud's "$2,000 Fargate" — Vapor actually costs $3,500 total.
---
No common exceptions; hidden costs always apply to Vapor.
---
Underestimating Vapor's total cost by 30-50%, leading to wrong platform choice.
---
## Test Octane Before Cloud Migration
---
## Testing
---
Always test Octane compatibility on existing infrastructure before migrating to Laravel Cloud.
---
Cloud's cost advantage partly comes from Octane's throughput gains; if your app doesn't work with Octane, Cloud's cost math changes. Isolate variables: test Octane first, then migrate platform.
---
Deploy Octane on Forge/EC2 staging; run 10K test requests; validate package compatibility.
---
Migrating to Cloud + Octane simultaneously, discovering Octane incompatibility on day 1.
---
Apps already Octane-compatible; still test on Cloud staging before production.
---
Migration failure requiring rollback, 2-4 weeks of wasted engineering time.
---
## Use Cloud Auto-Hibernation for Staging
---
## Cost Optimization
---
Always enable auto-hibernation for non-production environments on Laravel Cloud.
---
Cloud containers hibernate when idle; staging environment used 8h/day costs ~1/3 of always-on. Can save $50-200/month per non-production environment.
---
Cloud: staging min_containers=0, auto-hibernation enabled, used 8AM-6PM weekdays.
---
Running staging containers 24/7 on Cloud "to keep warm."
---
Performance testing environments that must remain warm; still configure for off-hours.
---
50-70% higher non-production costs than necessary.
---
## Configure Cloud Spending Limits
---
## Cost Optimization
---
Always set hard monthly spending limits with 50/75/90% alerts on Laravel Cloud before production traffic.
---
Cloud's auto-scaling can increase spend during traffic spikes; spending limits prevent surprise bills and alerts give time to react before hitting the ceiling.
---
Cloud budget: $500/month limit. Alerts at $250 (50%), $375 (75%), $450 (90%).
---
No spending limits; traffic spike causes $5,000 Cloud bill.
---
Enterprise with dedicated budgets and capacity planning; still set alerts for safety.
---
Surprise bills from auto-scaling events, reactive budget management.
---
## Prefer Cloud for New Projects
---
## Architecture
---
Default to Laravel Cloud for new Laravel projects in 2026; use Forge+EC2 only for extreme scale (>$20K/month) where maximum cost optimization is needed.
---
Cloud provides managed Fargate with Octane, auto-hibernation, and predictable pricing; the 2026 Laravel ecosystem recommends Cloud as the primary hosting platform.
---
New SaaS product: Laravel Cloud Starter at $5/month.
---
Launching new project on Forge+EC2 because "it's cheaper at scale."
---
Maximum cost optimization at extreme scale (>$20K/month) where Forge+EC2 with Graviton + Savings Plans wins.
---
Higher operational overhead, missing Cloud features, harder future migration.
---
## Use Fargate Spot for Cloud Workers
---
## Cost Optimization
---
Always use Fargate Spot for Laravel Cloud queue workers, not On-Demand containers.
---
Cloud supports Fargate Spot for workers; 70% discount with no impact on job processing since queue workers handle interruptions gracefully.
---
Cloud worker config: 70% Spot, 30% On-Demand, auto-scaling on queue depth.
---
Running all Cloud workers on On-Demand containers.
---
Paying 3-4x more for queue processing capacity than necessary.
