# Skill: Monitor and Analyze OpCache Hit Rate for Performance Health

## Purpose

Track OpCache hit rate as a primary performance indicator, analyze trends, and trigger corrective action when hit rate degrades.

## When To Use

- Ongoing OpCache health monitoring
- Investigating performance degradation
- Validating OpCache configuration changes
- Capacity planning for application growth

## When NOT To Use

- When OpCache is not enabled (hit rate is meaningless)
- For development environments with frequent file changes
- For single-request CLI scripts

## Prerequisites

- OpCache enabled and configured
- Access to `opcache_get_status()` metrics
- Monitoring dashboard capability

## Inputs

- Current hit rate value
- Historical hit rate trend (daily, weekly)
- OpCache memory usage and cache_full status
- Deployment events (timestamps of recent deployments)

## Workflow (numbered steps)

1. Collect hit rate data: `$status = opcache_get_status(false)['opcache_statistics']; $hitRate = $status['hit_rate'];` — run every 60 seconds from monitoring script
2. Establish baseline hit rate: average over 7 days of steady-state operation (no deployments or changes)
3. Set alert thresholds: warning at <95%, critical at <90%, based on baseline minus 3% for normal deployment dips
4. When alert triggers, check: cache_full indicator, memory usage trend, recent deployments, file count changes
5. If cache_full=true: increase memory_consumption by 50%
6. If memory usage trend is rising but not full: plan memory increase at next maintenance window
7. If recent deployment: hit rate dip is normal — wait 30-60 minutes for cache to repopulate
8. If file count increased (new packages): recalculate max_accelerated_files and memory_consumption
9. If hit rate does not recover after 60 minutes post-deployment: investigate configuration issues
10. Document the hit rate investigation and resolution

## Validation Checklist

- [ ] Hit rate data collected at regular intervals
- [ ] Baseline established (7-day rolling average)
- [ ] Alert thresholds configured
- [ ] Alert response procedure defined
- [ ] cache_full and memory metrics correlated with hit rate
- [ ] Deployment-related dips distinguished from configuration issues
- [ ] Monthly trend analysis reviewed

## Common Failures

- **Not distinguishing deployment dips**: Hit rate naturally drops to 0% after opcache_reset() and climbs back — this is normal
- **Single-threshold alert**: A flat 95% threshold will fire during every deployment — use rolling average with deployment awareness
- **Ignoring gradual decline**: Hit rate dropping 0.5% per month indicates slow memory pressure from application growth
- **Not checking cache_full**: Hit rate can be >99% while cache_full=true — memory is full but eviction hasn't started yet

## Decision Points

- Hit rate >99%: healthy — continue monitoring
- Hit rate 95-99%: investigate — check memory, deployments, file count
- Hit rate 90-95%: degraded — increase OpCache memory or max files
- Hit rate <90%: critical — immediate intervention needed (memory increase or deployment rollback)
- cache_full = true: increase memory regardless of hit rate

## Performance Considerations

- Hit rate monitoring adds negligible overhead (<1ms per check)
- Every 1% hit rate decrease increases CPU by ~0.5-1%
- Post-deployment hit rate recovery: 30-120 seconds to climb from 0% to >99% under normal traffic
- Continuous hit rate <95% over 24 hours = significant performance degradation

## Security Considerations

- Hit rate data does not contain sensitive information
- Access to hit rate metrics should be restricted to operations team
- Deployment-related hit rate dips reveal deployment timing — protect this operational data

## Related Rules (from 05-rules.md)

- Monitor Hit Rate and Cache Full Indicator
- Size memory_consumption to Your Application
- Automate opcache_reset() in Every Deployment Pipeline

## Related Skills

- OpCache Lifecycle and Invalidation
- OpCache Memory Sizing
- OpCache Configuration Overview

## Success Criteria

- Hit rate monitoring implemented with dashboard and alerts
- Deployment-related dips distinguished from configuration issues
- Corrective actions defined for each hit rate threshold
- Monthly trend analysis identifies gradual degradation
