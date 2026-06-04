## Right-Size Before Buying RIs
---
## Cost Optimization
---
Always right-size database instances using 4 weeks of CloudWatch metrics before purchasing Reserved Instances; never buy RIs first.
---
RI locks you into a specific instance class for 1-3 years; over-provisioned instance with RI means paying for unused capacity for the entire term. Right-sizing typically saves 30-50% before RI discount.
---
4-week monitoring: avg CPU 25%, avg mem 40%. Downsize from r6g.xlarge to r6g.large. Then buy RI.
---
Buying 3-year RI for r6g.xlarge without monitoring; actual usage shows r6g.large sufficient.
---
No common exceptions; right-sizing before RI is always optimal.
---
Paying RI price for capacity you don't need; locked into over-provisioned instance for 1-3 years.
---
## Start With 1-Year Partial Upfront
---
## Cost Optimization
---
Use 1-year Partial Upfront RIs for new or uncertain workloads; graduate to 3-year after traffic patterns are proven.
---
1-year Partial Upfront gives 55% savings vs 66% for 3-year All Upfront. After 1 year of proven traffic, migrate to Database Savings Plans for more flexibility.
---
New app with unknown traffic: 1-year Partial Upfront RI. After 1 year: switch to Database Savings Plans.
---
3-year All Upfront for a newly launched application with unproven traffic.
---
Proven workload with >12 months of stable traffic history.
---
3-year commitment on workload that may not exist in 12 months; forfeited RI value.
---
## Use Regional Scope
---
## Architecture
---
Always select Regional (not Zonal) scope for RDS Reserved Instances unless capacity reservation is required.
---
Zonal RIs lock to one AZ; if AZ runs out of capacity or you need to move, Zonal RI is wasted. Regional RIs auto-apply to whatever AZ the instance runs in.
---
RI scope: Regional. Database can be in any AZ.
---
Zonal RI in us-east-1a; months later, need to move to us-east-1b for capacity — RI wasted.
---
Large instances in capacity-constrained regions where AZ reservation is critical.
---
Zonal RI wasted if AZ migration needed; Regional RI provides full flexibility.
---
## Combine RIs With On-Demand Buffer
---
## Cost Optimization
---
Cover 80-90% of baseline database capacity with RIs; leave 10-20% on On-Demand for traffic spikes.
---
Covering 100% with RI risks unused commitment if traffic drops; 80-90% of minimum hourly usage is safer. On-Demand covers traffic spikes. Better to buy RIs after growth, not before.
---
80% RI coverage at baseline $200/month. 20% On-Demand buffer for spikes.
---
100% RI coverage; traffic grows 20%, excess is full On-Demand with 0% discount.
---
Stable workloads with no expected traffic variation; 95% RI coverage still recommended.
---
Unused RI commitment during traffic troughs or full-price On-Demand for overflow during peaks.
---
## Don't Buy RIs for Serverless v2
---
## Cost Optimization
---
Never purchase RDS Reserved Instances for Aurora Serverless v2 databases — they do not apply.
---
RDS RIs apply only to provisioned instances; Serverless v2 is billed On-Demand only. Any RI purchase for Serverless v2 will go completely unused.
---
Serverless v2 database: use auto-pause for dev/test; no RI needed.
---
Buying RI "for the Aurora cluster" that is running Serverless v2.
---
Serverless v2 is not covered by any commitment model as of 2026.
---
RI goes completely unused; 100% of commitment value forfeited.
