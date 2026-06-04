# KU-03-PREDICTIVE-AUTOSCALING: Predictive Autoscaling

## Metadata
- **ID**: KU-03-PREDICTIVE-AUTOSCALING
- **Subdomain**: Server Sizing & Autoscaling
- **Topic**: Predictive Autoscaling
- **Source**: Server Sizing & Autoscaling, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Predictive autoscaling uses machine learning to forecast daily and weekly traffic patterns, proactively adjusting capacity before load arrives. For Laravel applications with predictable patterns (business-hours SaaS, weekday traffic peaks, end-of-month processing), predictive scaling eliminates the lag between traffic increase and capacity addition. This reduces both over-provisioning (capacity sitting idle) and under-provisioning (traffic outstripping capacity). Combined with dynamic (reactive) scaling, it's the most cost-effective autoscaling strategy.

## Core Concepts
- **Predictive scaling**: ML-based forecasting of future load; scales proactively
- **Dynamic scaling**: Reactive scaling based on current metrics (CPU, request count)
- **Forecast-only mode**: Only predict; don't scale (visualize predictions before enabling)
- **Forecast-and-scale mode**: Predict and adjust capacity automatically
- **Scaling model**: AWS uses 14 days of historical data to build the forecast model
- **Max capacity behavior**: How predictive scaling interacts with ASG max capacity
- **Buffer time**: How far ahead predictive scaling acts (5-30 minutes)
- **Cooldown interaction**: Predictive scaling doesn't use cooldown (proactive actions bypass cooldown)

## Mental Models
- Default: predictive + dynamic combined
- Default: 2 weeks of data before enabling; 1 week of forecast-only
- Default: max capacity budget cap (1.5-2x expected peak)
- Use scheduled actions for known events (not predictive)

## Internal Mechanics
- Predictive scaling acts 15-30 minutes before forecasted peak (enough for 2-5 minute boot time)
- Dynamic scaling catches up in 2-5 minutes if traffic exceeds prediction
- Predictive scaling eliminates cold-start capacity lag entirely
- No cooldown needed (predictive actions are scheduled, not reactive)
- Prediction accuracy improves over time (more data = better model)

## Patterns
- Enable predictive scaling after 2+ weeks of traffic data
- Use forecast-only mode first
- Combine predictive + dynamic scaling
- Set max capacity buffer
- Monitor forecast accuracy
- Integrate with scheduled events
- Use custom schedules for special days

## Architectural Decisions
- Predictive scaling enabled on primary ASG (web tier)
- Forecast-only for 1 week -> evaluate -> enable forecast-and-scale
- Combine with target tracking dynamic scaling (reactive safety net)
- Scale types: "ForecastOnly" initially, "ForecastAndScale" after validation
- Set max capacity = 1.5x-2x baseline peak (budget cap)
- Monitor with CloudWatch metrics: PredictedCapacity, ActualCapacity
- Review predictive model monthly; adjust if traffic patterns change

## Tradeoffs
**When To Use:**
- Predictable daily/weekly traffic: SaaS apps with business hours, enterprise apps with weekday traffic
- Known seasonal patterns: Month-end processing, quarterly reporting, annual sales events
- Apps with scaling lag: If new instances take 5+ minutes to warm up, predictive scaling eliminates that wait
- Cost-sensitive apps: Reducing over-provisioning by matching capacity to forecasted demand
- AWS Auto Scaling: ASGs with target tracking or step scaling; predictive scaling is an add-on

**When NOT To Use:**
- Unpredictable traffic: Apps with random spikes (gaming, flash sales, news events); predictive doesn't help
- No historical data: New apps (<2 weeks old) don't have enough data for accurate predictions
- Constant traffic: 24/7 predictable load; dynamic scaling handles it; predictive adds no value
- Very small ASGs: <4 instances baseline; predictive scaling may over-react on small groups
- Single-region only: Predictive works per-region; multi-region needs separate models

## Performance Considerations
- Predictive scaling acts 15-30 minutes before forecasted peak (enough for 2-5 minute boot time)
- Dynamic scaling catches up in 2-5 minutes if traffic exceeds prediction
- Predictive scaling eliminates cold-start capacity lag entirely
- No cooldown needed (predictive actions are scheduled, not reactive)
- Prediction accuracy improves over time (more data = better model)

## Production Considerations
- Predictive scaling uses CloudWatch metrics; no data leaves AWS
- ASG max capacity acts as budget cap regardless of predictions
- IAM roles for ASG apply to all instances launched by predictive scaling
- CloudTrail logs all scaling actions (predictive and dynamic)
- Budget alerts on scaling group costs (emergency stop if cost exceeds threshold)

## Common Mistakes
- **Not using forecast-only mode**: Enabling predictive scaling to take action immediately (Cause: eager to see benefits; Consequence: inaccurate predictions cause over-provisioning on day 1; Better: run forecast-only for 1 week, validate, then enable actions)
- **Replacing dynamic scaling with predictive**: Using only predictive (no dynamic fallback) (Cause: "ML handles everything" assumption; Consequence: unexpected traffic spike not in pattern causes under-provisioning; Better: predictive + dynamic = both proactive and reactive)
- **No schedule override for known events**: Predictive scaling sees marketing campaign as anomaly, doesn't scale (Cause: relying solely on ML; Consequence: under-provisioned during known high-traffic event; Better: create scheduled scaling action for known events)
- **Insufficient historical data**: Enabling predictive on 3-day-old ASG (Cause: assumption 3 days of data is enough; Consequence: predictions have no pattern to learn from; Better: wait 14+ days of traffic data)
- **Ignoring forecast reports**: Enabling predictive and never checking if predictions match reality (Cause: set-and-forget; Consequence: perpetually inaccurate predictions; Better: weekly review of PredictedCapacity vs ActualCapacity)

## Failure Modes
- **Predictive-only scaling**: No dynamic fallback; unexpected traffic = outage
- **Predictive scaling without max capacity**: Unbounded scaling on incorrect prediction
- **Using predictive for one-off events**: ML needs repeated patterns; use scheduled scaling for events
- **Enabling without historical data**: Predictions from 3 days of data are essentially random

## Ecosystem Usage
- **SaaS app (predictable weekday traffic)**: Predictive scale: 15 instances at 8 AM, 25 at 10 AM peak, 15 at 2 PM, 5 at 6 PM; dynamic scaling adds 2-3 more if traffic exceeds forecast
- **Business-hours app with known patterns**: Mon-Fri: predict scale-out from 2 to 8 instances between 8-10 AM; predict scale-in after 5 PM; weekends: predict 2 instances
- **Before predictive**: Traffic spikes at 9 AM, ASG scales out by 9:05 AM, instances boot by 9:10 AM -> traffic served 10 minutes late
- **After predictive**: Capacity at 8:45 AM predicted 9 AM spike; instances ready when traffic arrives -> zero latency increase

## Related Knowledge Units
- Horizontal Scaling (ku-01)
- Auto Scaling Policies (ku-03 in compute-commitment)
- Scheduled Scaling (ku-04 in compute-commitment)

## Research Notes
Derived from Server Sizing & Autoscaling, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.