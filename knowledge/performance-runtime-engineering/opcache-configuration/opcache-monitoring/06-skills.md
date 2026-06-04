# Skill: Set Up OpCache Monitoring and Alerting

## Purpose

Implement continuous monitoring of OpCache hit rate, cache utilization, and memory pressure to detect and prevent performance degradation.

## When To Use

- Production OpCache deployment requires ongoing monitoring
- Setting up dashboards for PHP application performance
- Creating alerts for OpCache-related issues before they affect users

## When NOT To Use

- For development environments where monitoring is unnecessary
- Without first configuring OpCache optimally
- When the application is not yet deployed to production

## Prerequisites

- OpCache enabled and configured
- Metrics collection system (Prometheus, Datadog, New Relic, or custom)
- PHP script execution capability on production servers

## Inputs

- Current OpCache configuration values
- Monitoring system endpoint or API
- Alert thresholds (hit rate, memory usage, cache full)
- Server list for multi-instance deployments

## Workflow (numbered steps)

1. Create a monitoring script that calls `opcache_get_status(false)` and extracts key metrics: hit_rate, memory_usage (used/free/wasted), cache_full, num_cached_scripts, num_cached_keys, max_cached_keys
2. For Prometheus: expose these metrics via a /metrics endpoint in the application
3. For Datadog/New Relic: submit metrics via the agent API
4. Set up a dashboard showing: hit rate over time, memory usage (used/total), cache_full indicator, cached file count
5. Configure alerts: hit rate <95% (warning), hit rate <90% (critical), cache_full=true, free_memory <10% of total
6. For multi-server deployments, collect metrics from each server and aggregate
7. Set up weekly trend analysis: if memory usage grows >5% per week, plan for configuration increase
8. Integrate OpCache metrics into the existing application performance dashboard
9. Document the monitoring setup and alert thresholds

## Validation Checklist

- [ ] Metrics collection script created
- [ ] Metrics exposed to monitoring system
- [ ] Dashboard configured with key OpCache metrics
- [ ] Alerts created for hit rate, cache_full, and memory pressure
- [ ] Multi-server metrics aggregated
- [ ] Weekly trend analysis established
- [ ] Monitoring documented

## Common Failures

- **Monitoring only hit rate**: Hit rate can be >99% while cache_full=true — memory is full but hits still succeed until eviction
- **Not monitoring per server**: In multi-server deployments, one server may have issues while others are fine
- **Setting alerts too sensitive**: Hourly hit rate dips during deployments are normal — use rolling window thresholds
- **Ignoring wasted memory**: "Wasted" memory in opcache_get_status indicates fragmentation from file changes

## Decision Points

- Hit rate <95%: investigate OpCache configuration (memory, max files) or recent deployment
- cache_full = true: increase memory_consumption immediately
- free_memory <10%: schedule memory increase at next maintenance window
- Weekly memory growth >5%: application file count is increasing — plan for larger allocation

## Performance Considerations

- Monitoring scripts add minimal overhead (<1ms per call) to the monitoring endpoint
- opcache_get_status() is a read-only operation — does not affect cache behavior
- For high-traffic servers, sample metrics every 60 seconds rather than every request
- Ensure the monitoring endpoint is authenticated to prevent information disclosure

## Security Considerations

- OpCache status data includes file paths and script names — restrict access to monitoring dashboard
- The /metrics endpoint should require authentication or be internal-network-only
- opcache_get_status() data does not include sensitive application data

## Related Rules (from 05-rules.md)

- Monitor Hit Rate and Cache Full Indicator
- Monitor free_memory Weekly
- Automate opcache_reset() in Every Deployment Pipeline

## Related Skills

- OpCache Memory Sizing
- OpCache Max Accelerated Files Calculation
- OpCache Revalidation Configuration
- Profiling vs Monitoring

## Success Criteria

- OpCache metrics collected and displayed on dashboard
- Alerts configured for critical thresholds (hit rate, cache_full, memory)
- Multi-server monitoring in place
- Weekly trend analysis established
- Monitoring setup documented
