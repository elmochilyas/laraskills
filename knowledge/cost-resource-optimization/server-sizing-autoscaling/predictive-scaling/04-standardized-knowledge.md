# Predictive Scaling

## Metadata
- **ID**: KU-37-PREDICTIVE-SCALING
- **Subdomain**: server-sizing-autoscaling
- **Domain**: cost-resource-optimization
- **Topic**: Predictive Scaling
- **Version**: 1.0
- **Classification**: Emerging
- **Maturity**: Medium-High

## Overview
AWS Predictive Scaling uses ML-based forecasting to proactively scale resources before traffic arrives, reducing overprovisioning by 30-50% compared to reactive step scaling. It analyzes 14 days of historical traffic data to forecast demand 48 hours ahead. For Laravel apps with cyclical traffic patterns (daily peaks, weekly cycles), predictive scaling eliminates the lag between traffic increase and scale-up, reducing both overprovisioning (during troughs) and underprovisioning (during ramp-ups).

## Core Concepts
- **Forecast model**: ML-based, 14-day lookback, 48-hour forecast
- **Scaling modes**: Forecast only (predict), Forecast and scale (predict + react)
- **vs Step scaling**: Step scaling reacts to current metrics; predictive acts before metrics change
- **vs Scheduled scaling**: Scheduled is manual; predictive is automated based on observed patterns
- **Coverage**: EC2 Auto Scaling Groups, ECS Service Auto Scaling

## When To Use
- Laravel apps with predictable traffic patterns (daily peaks, weekday/weekend cycles)
- Applications with scaling delays causing user-facing latency during traffic ramp-ups
- Deployments where 30-50% reduction in overprovisioning provides significant cost savings
- E-commerce, B2B, or SaaS apps with regular business-hour traffic patterns
- Teams that have 14+ days of historical traffic data for model training

## When NOT To Use
- New applications without 14 days of traffic history (use scheduled or step scaling initially)
- Apps with random, non-cyclical traffic patterns (ML model can't predict random traffic)
- Very low-traffic apps (<100 req/s) where overprovisioning cost is minimal
- Applications with frequent traffic pattern changes (weekly pattern shifts invalidate model)
- Environments where scaling decisions must be 100% deterministic (use scheduled scaling)

## Best Practices
- **Use predictive scaling as primary, step scaling as fallback**: Combine both for proactive + reactive coverage (WHY: Predictive handles expected traffic; step scaling handles unexpected spikes; together they provide complete coverage without manual intervention)
- **Start with "Forecast only" mode for 2 weeks**: Observe predictions without acting on them (WHY: ensures the ML model is accurate for your specific traffic pattern; false predictions in "forecast and scale" mode could waste capacity; monitor forecast accuracy metrics)
- **Provide 14+ days of clean historical data**: Remove anomalous data (deploy days, holiday traffic) from training (WHY: predictive scaling uses 14-day lookback; atypical data skews the model; holiday traffic on a non-holiday model causes overprediction)
- **Set max capacity bounds**: Always configure minimum and maximum capacity limits (WHY: prevents runaway scaling from model error; max capacity acts as cost control; set max to 2x expected peak for safety)
- **Monitor forecast accuracy**: Use CloudWatch metrics `ForecastAcc` (forecast accuracy) to track model performance (WHY: accuracy below 80% indicates model drift; retrain or switch to step scaling; accuracy degrades as traffic patterns change)

## Architecture Guidelines
- Predictive scaling for primary traffic patterns; step scaling with target tracking as safety net
- Scheduled scaling for known events (marketing campaigns, product launches, maintenance windows)
- Predictive scaling works with EC2 Auto Scaling and ECS Service Auto Scaling
- For Laravel Octane apps, pair predictive scaling with worker pool warm-up
- Use CloudWatch metrics (CPU, request count, memory) as input for predictive model
- Enable scale-in protection to prevent terminating instances with active connections

## Performance Considerations
- Predictive scaling adds capacity 30 minutes before predicted load; eliminates cold-start latency
- ML model requires 14 days of data; new apps use scheduled/step scaling during ramp-up
- Model refreshes daily; takes 24 hours to incorporate new patterns
- Forecast accuracy: 85-95% for stable cyclical patterns; lower for changing patterns
- Capacity changes are pre-computed; no scaling delay for predicted load changes

## Security Considerations
- Predictive scaling uses CloudWatch metrics which can be affected by compromised resources
- Ensure Auto Scaling groups use instance metadata service (IMDSv2) for security
- Scaling events generate CloudTrail events for audit trail
- Set CloudWatch alarms on scaling activity to detect anomalous scaling events
- Use service-linked roles for Auto Scaling; AWS-managed permissions

## Common Mistakes
1. **Using reactive scaling only**: Traffic spikes take 2-5 minutes to scale; users experience errors (Cause: "predictive is complex, step scaling works"; Consequence: latency spikes during traffic ramp-ups; Better: combine predictive + step scaling)
2. **Not providing clean training data**: Model trains on 14 days including deployment failure or DDoS (Cause: using raw data without filtering anomalies; Consequence: model predicts future based on anomaly; overpredicts or underpredicts capacity; Better: remove anomalous periods from training)
3. **No max capacity bound**: Model overpredicts and scales to 50 instances (Cause: trusting ML model completely; Consequence: 5x normal capacity running for hours until model corrects; Better: set max capacity to 2x expected peak)
4. **Switching from scheduled directly to predictive**: Removing deterministic control for ML without validation period (Cause: wanting fully automated scaling; Consequence: ML errors cause cost spikes or under-scaling; Better: run "forecast only" mode for 2 weeks first)

## Anti-Patterns
- **Predictive scaling for random traffic**: ML can't predict what's truly random
- **No reactive fallback**: Unexpected traffic spike with predictive-only causes under-scaling
- **Scheduled scaling after predictive**: Overriding ML predictions with fixed schedules defeats purpose
- **Predictive scaling without training data**: Model needs 14 days; doesn't work for new apps

## Examples
- **B2B Laravel app (8AM-6PM peak weekdays)**: Predictive scaling adds capacity 30 min before 8AM, scales down at 5:30PM; saves 40% vs 24/7 capacity
- **E-commerce (weekly cycle, weekend peaks)**: Predictive model detects weekend pattern; scales up Friday PM, down Monday AM; 30-50% savings vs always-on
- **New app (no history)**: Scheduled scaling for launch week; enable predictive after 14 days; transition to predictive + step scaling

## Related Topics
- Scheduled Scaling (ku-50)
- Octane Sizing for Laravel (ku-38)
- Auto Scaling Policies

## AI Agent Notes
- Default: combine predictive + step scaling
- Use "Forecast only" mode for 14-day validation
- Set max capacity bound (2x expected peak)
- Requires 14 days of historical data
- Monitor forecast accuracy; retrain if <80%
