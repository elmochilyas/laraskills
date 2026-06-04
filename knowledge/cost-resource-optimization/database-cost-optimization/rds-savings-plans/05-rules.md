## Prefer Database Savings Plans Over RIs
---
## Cost Optimization
---
Prefer RDS Database Savings Plans over RDS Reserved Instances for new commitments; use RIs only when maximum discount is needed for static workloads.
---
SPs apply across instance families and regions with up to 60% discount; RIs lock to specific instance class. The 6% difference in max savings (60% vs 66%) is worth the flexibility for most teams.
---
Multi-DB fleet: 3 x r6g.large + 2 x r7g.xlarge. SP at 80% coverage, ready to switch families.
---
Buying RIs for a fleet that expects Graviton migration from r6g to r7g next year.
---
Static, single-instance deployment with no expected changes for 3 years; RIs at 66% beat SPs at 60%.
---
Locked into instance family, forfeited RI value if migration needed, less flexibility.
---
## Commit to 80-90% of Minimum Hourly Spend
---
## Cost Optimization
---
Always commit to 80-90% of your minimum hourly database spend when purchasing Database Savings Plans; never cover 100%.
---
SPs are $/hour commitment; unused commitment is forfeited. Covering 80-90% of minimum hourly usage ensures high utilization while leaving room for traffic variation and growth.
---
Minimum hourly spend: $0.50/hour. Commit: $0.40/hour (80% coverage).
---
Committing to $1.00/hour SP when minimum spend is $0.50/hour — $0.50/hour wasted.
---
Very stable workloads with no traffic variation; 95% coverage may be acceptable.
---
10-20% of SP commitment forfeited as unused, paying for compute not consumed.
---
## Let Existing RIs Expire, Replace With SPs
---
## Cost Optimization
---
Let existing RDS Reserved Instances expire naturally and replace them with Database Savings Plans; never modify or cancel RIs early.
---
RIs are paid upfront; canceling forfeits remaining value. Let existing RIs expire; repurchase as SPs for better flexibility going forward.
---
RI expires in 6 months: let expire, purchase SP at 80% of current minimum spend.
---
Canceling existing RI with 18 months remaining to switch to SP — forfeiting 18 months of prepaid value.
---
RIs with <30 days remaining; early cancellation cost is minimal; evaluate SP replacement.
---
Forfeited RI prepaid value, negative ROI from early cancellation fees.
---
## Use 3-Year Term for Stable Production
---
## Cost Optimization
---
Purchase 3-year Database Savings Plans for stable production databases; use 1-year for uncertain workloads.
---
3-year SP provides 60% savings vs 30% for 1-year. Production databases rarely change dramatically; 3-year commitment is low risk.
---
Production Aurora db.r7g.large with no expected changes: 3-year SP at 60% savings.
---
Startup with uncertain database requirements: 3-year SP; 6 months later, need to switch to different instance.
---
Uncertain database future, expected migration, or startup less than 2 years old.
---
Committed to 3 years of spend that may become redundant after migration.
---
## Combine SP With On-Demand for Burst
---
## Cost Optimization
---
Always combine Database Savings Plans with On-Demand pricing for burst capacity; never cover 100% of peak with SP.
---
SP + On-Demand cost is lower than 100% SP with unused commitment or 100% On-Demand with no commitment. Set SP at 80% of peak, not 100%.
---
Baseline: $0.40/hour SP. Peak burst: $0.10/hour On-Demand. Total: $0.50/hour.
---
$0.50/hour SP covering 100% of peak; traffic drops 20%, $0.10/hour SP wasted.
---
Steady workloads with zero traffic variation; even then, 95% SP coverage is safer than 100%.
---
Unused SP commitment during traffic troughs; paying for compute not consumed.
