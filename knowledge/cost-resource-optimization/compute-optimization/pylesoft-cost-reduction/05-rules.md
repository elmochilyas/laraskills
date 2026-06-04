## Model Vapor Lambda Multiplier First
---
## Cost Optimization
---
Always measure and apply your actual Vapor Lambda multiplier when projecting Cloud migration savings; never assume PyleSoft's 50% applies universally.
---
Vapor's 9x invocation multiplier is the primary savings driver; if your actual multiplier is lower (e.g., 6x), savings projection decreases proportionally.
---
Our Vapor bill: 108M Lambda invocations / 12M HTTP requests = 9x multiplier. Project 50% savings.
---
Assuming 50% savings for an app with different architecture and lower multiplier.
---
Very low traffic Vapor apps where multiplier impact is small.
---
Incorrect migration savings projection by 20-40%.
---
## Target >$2K/Month Vapor Spend
---
## Cost Optimization
---
Prioritize Cloud migration for Vapor deployments spending more than $2K/month; smaller deployments may not justify migration engineering cost.
---
PyleSoft saved $5,500/month on $11K spend; for a $2K/month app at 50% savings = $1K/month savings, payback is 3-4 months including 2-3 week migration effort.
---
$4K/month Vapor spend: projected $2K/month Cloud savings; 3-week migration effort; 1.5 month payback.
---
$800/month Vapor app: $400/month savings, 3-week migration effort, 7.5 month payback — not worth it.
---
Apps with high growth trajectory where savings compound as traffic scales.
---
Negative ROI on migration engineering time for low-spend Vapor deployments.
---
## Measure Hidden Vapor Costs
---
## Cost Optimization
---
Always include Vapor's full bill (CloudFront, API Gateway, Lambda) in pre-migration baseline; never compare only Lambda line items.
---
Vapor's total cost includes hidden services that Cloud bundles into container pricing; comparing only compute line items underestimates Vapor's true cost by 20-40%.
---
Pre-migration: $11K total bill (Lambda $6K + API Gateway $2K + CloudFront $1.5K + other $1.5K).
---
Comparing Vapor "$6K Lambda" to Cloud "$5.5K Fargate" — missing $5K in hidden Vapor costs.
---
No common exceptions; hidden services always inflate Vapor's total bill.
---
Comparing only a subset of Vapor costs, overestimating Cloud's savings by 30%.
---
## Test Octane Compatibility Pre-Migration
---
## Testing
---
Always validate Octane compatibility before committing to Cloud migration timeline.
---
Cloud uses Octane by default; if your app has Octane-incompatible packages, Cloud loses its performance advantage and a different migration target may be optimal.
---
Test Octane on staging Vapor or local FrankenPHP. Run 10K requests. All packages pass.
---
Committing to Cloud migration without Octane validation; discovering incompatibility during cutover.
---
Apps already Octane-compatible (running Octane on existing infrastructure).
---
Migration blocked by Octane issues, timeline extended by 2-4 weeks, or suboptimal performance on Cloud.
---
## Set Cloud Spending Limits
---
## Cost Optimization
---
Always configure Cloud spending limits and budget alerts before migrating production traffic.
---
Cloud auto-scaling during migration could increase costs unexpectedly; spending limits prevent surprise bills and alerts give time to diagnose scaling configuration.
---
Cloud budget: $3,000/month limit. Alerts at $1,500, $2,250, $2,700. Pre-configured before traffic cutover.
---
No spending limits; auto-scaling during initial traffic spike creates unexpected $6K bill.
---
Enterprise with dedicated budget management; spending limits still recommended as safety net.
---
Surprise bills from misconfigured auto-scaling during migration period.
---
## Measure Before-and-After Costs Precisely
---
## Monitoring
---
Always capture 30 days of Vapor's full bill before migration and 30 days of Cloud's full bill after; attribute every line item.
---
Only precise before-and-after measurement validates the migration ROI and identifies unexpected cost differences (e.g., increased data transfer, different storage costs).
---
Spreadsheet: pre-migration Vapor $11,000; post-migration Cloud $5,500; net savings $5,500/month.
---
Rough estimate: "Cloud is about half the cost."
---
No common exceptions; measurement is the only reliable validation.
---
Cannot validate migration ROI; may have hidden cost increases masked by overall "savings."
