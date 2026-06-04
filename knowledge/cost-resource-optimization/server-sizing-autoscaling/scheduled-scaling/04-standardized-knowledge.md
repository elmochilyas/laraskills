# Scheduled Scaling

## Metadata
- **ID**: KU-50-SCHEDULED-SCALING
- **Subdomain**: server-sizing-autoscaling
- **Domain**: cost-resource-optimization
- **Topic**: Scheduled Scaling
- **Version**: 1.0
- **Classification**: Emerging
- **Maturity**: Medium

## Overview
Scheduled scaling reduces staging/development environment costs by 50-70% by automatically scaling compute down during off-hours. A typical schedule: scale down to 1-2 instances at 8PM, scale up at 6AM weekdays; scale down completely on weekends. For a staging environment costing $500/month running 24/7, scheduled scaling reduces cost to $150-250/month with no functional impact. This is the simplest, highest-ROI cost optimization for non-production environments.

## Core Concepts
- **Cost reduction**: 50-70% for staging environments
- **Schedule examples**: Scale down 8PM-6AM weekdays, all-day weekends, holidays
- **Implementation**: AWS Auto Scaling scheduled actions, CloudFormation, Terraform
- **Warm-up time**: Account for 5-15 minutes before instances serve traffic
- **Zero-cost weekends**: Scale staging to 0 on weekends (recreate on Monday)

## When To Use
- Staging and development environments that don't need 24/7 availability
- Production environments with predictable traffic patterns (business hours apps)
- CI/CD environments needed only during working hours
- Demo/training environments with known usage windows
- Cost-sensitive teams where every dollar of infrastructure waste is visible

## When NOT To Use
- Production environments with unpredictable traffic patterns (use predictive scaling)
- Global applications serving users across all time zones (24/7 traffic)
- Applications with long warm-up times (>15 minutes) making scale-down risky
- Critical systems requiring immediate availability at any time (incident response)
- Environments where teams work across multiple time zones (overlapping coverage needed)

## Best Practices
- **Scale down to minimum capacity, not zero (for staging)**: Keep 1 instance running during off-hours for emergency access (WHY: scaling to 0 means no access for urgent hotfixes; 1 tiny instance costs <$15/month for 24/7 availability; team can SSH in when needed)
- **Schedule scale-up 15 minutes before work starts**: Account for instance launch + warm-up time (WHY: EC2 instances take 1-3 min to launch, application takes 30-120s to warm up; scaling at 9AM means instances ready at 9AM, not 9:15AM; schedule for 8:45AM)
- **Use cron expressions for complex schedules**: Terraform `aws_autoscaling_schedule` with recurrence for weekdays-only scaling (WHY: manual schedules break on holidays; cron-based automation runs reliably; `? * 1-5 * *` for weekdays only)
- **Tag instances by schedule**: Apply tags like `ScaleDown: 8PM` and `ScaleUp: 6AM` for visibility (WHY: teams need to know why instances are terminating; schedule tags provide transparency; prevents "server terminated, who did it?")
- **Test schedule changes in non-production first**: Validate new schedules before applying to production (WHY: misconfigured schedule could scale down production during business hours; test in staging, verify with CloudWatch Events)

## Architecture Guidelines
- AWS Auto Scaling scheduled actions for EC2 and ECS
- CloudWatch Events / EventBridge Scheduler for more complex scheduling
- Terraform `aws_autoscaling_schedule` resource for IaC management
- Combine with lifecycle hooks for graceful shutdown before scale-in
- For Kubernetes, use KEDA `ScaledObject` with cron triggers
- For Laravel Cloud, use environment scaling schedules (platform feature)

## Performance Considerations
- Scheduled scaling provides instant capacity at scheduled time; no ML warm-up required
- Instance launch time: 1-5 minutes (EC2), 30-60 seconds (Fargate)
- Application warm-up: 30-120s for Laravel (Octane faster, FPM slower)
- Scale-in cooldown: set 300 seconds to prevent rapid flip-flopping
- No adaptation to changing patterns; schedule is static until manually updated

## Security Considerations
- Scheduled scaling events logged in CloudTrail; audit who created/modified schedules
- Ensure scale-down events don't terminate instances mid-deployment (use lifecycle hooks)
- Scheduled scaling for security testing environments: isolate from production
- Auto Scaling group termination policies affect which instances are terminated
- Protect critical instances with termination protection

## Common Mistakes
1. **Scaling to 0 with no emergency access**: Staging scales to 0 on weekends; team can't deploy hotfix Saturday (Cause: maximum cost savings mentality; Consequence: blocked deploys during outages; Better: keep 1 t4g.nano running for emergency SSH access at $5/month)
2. **Not accounting for timezone differences**: 8PM ET scale-down terminates instances at 8PM PT too (Cause: UTC-based schedules without timezone mapping; Consequence: West coast team loses access at 5PM PT; Better: use UTC schedules and account for timezone offsets per team)
3. **No warm-up buffer**: Scale-up at 9AM for 9AM start, instances not ready until 9:05AM (Cause: setting schedule to exact work start; Consequence: first 5 minutes of work sees errors; Better: schedule 15 minutes before need)
4. **Forgetting holiday schedules**: Staging scales up on Christmas day (Cause: weekday-based schedule; Consequence: compute running when no one works; Better: add holiday schedule overrides, or use predictive scaling that learns holidays)

## Anti-Patterns
- **24/7 staging**: Most common waste; $250-500/month for zero off-hours benefit
- **No schedule at all**: Every non-production environment running full tilt constantly
- **Manual scale-up/down**: Relying on humans to remember is unreliable
- **Production-only thinking**: Only applying cost optimization to production, ignoring 3x waste in staging

## Examples
- **Staging (4 x m7g.large, ~$500/month)**: Weekdays 6AM-8PM, scale to 1 instance off-hours ($75), weekends to 1 instance ($25); Total = $150/month; Savings = $350/month (70%)
- **Dev/QA (2 x t4g.medium, ~$60/month)**: Business hours only, scale to 0 off-hours; Total = $24/month; Savings = $36/month (60%)
- **Production with known off-peak (10 instances, ~$1200/month)**: Scale to 4 at 10PM, back to 10 at 6AM; Total = $800/month; Savings = $400/month (33%)

## Related Topics
- Predictive Scaling (ku-37)
- Octane Sizing for Laravel (ku-38)
- Auto Scaling Policies

## AI Agent Notes
- Default: schedule scaling for all non-production environments
- Keep 1 tiny instance for emergency access (don't scale to 0)
- Schedule scale-up 15 min before need
- Account for timezone and holiday schedules
- 50-70% savings on staging costs
