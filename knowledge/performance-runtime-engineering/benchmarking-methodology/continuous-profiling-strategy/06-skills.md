# Skill: Implement Continuous Profiling with Adaptive Sampling and Alert Integration

## Purpose
Deploy always-on low-frequency profiling (1-5 Hz) across all production hosts to establish baseline behavior, with automatic burst sampling (50-100 Hz) triggered by SLO breach alerts — enabling differential flame graph analysis during incidents while keeping overhead below 2% during normal operation.

## When To Use
- Production performance monitoring with minimal overhead
- Incident response — capturing diagnostic data during SLO breaches
- Capacity planning — identifying growth trends in resource consumption
- Regression investigation — comparing profiles before and after deployments

## When NOT To Use
- Development profiling where high overhead is acceptable (use Xdebug)
- Systems where profiling is not permitted by security policy
- Very small deployments where profiling infrastructure overhead is disproportionate

## Prerequisites
- Profiling tool: Pyroscope, Parca, or Tideways installed on all hosts
- Alerting system capable of triggering webhooks on SLO breach
- Storage for profile data (30+ days retention)
- Understanding of flame graph interpretation

## Inputs
- List of production hosts to profile
- SLO breach alert definitions
- Expected baseline profiles (normal CPU, memory patterns)
- Health check endpoint patterns to exclude from profiling

## Workflow

### 1. Install Profiling Agent on All Hosts
- Choose tool: Pyroscope (open source), Parca (eBPF-based), or Tideways (always-on APM)
- Configure always-on sampling at 1-5 Hz (<2% CPU overhead)
- For eBPF-based tools: install kernel module or ensure CAP_BPF capability
- For agent-based tools: install PHP extension and configure endpoint
- Verify profiling agent is running and collecting data

### 2. Establish Baseline Profiles
- Run continuous profiling at 1-5 Hz for 1-2 weeks to establish normal behavior
- Create baseline flame graphs per endpoint (categorized by URL pattern)
- Document normal CPU distribution, memory allocation patterns, lock contention
- Store baseline profiles for comparison during incidents

### 3. Exclude Health Checks and Monitoring Traffic
- Configure profiling tool to filter out health check endpoints
- Exclude load balancer pings, monitoring probes, and cron jobs
- Profile only user-facing traffic to keep data representative
- Verify filtered profiles show user-facing code paths

### 4. Configure Adaptive Sampling Based on Error Budget Burn Rate
- Normal operation (budget >50%): 1 Hz baseline
- Budget 20-50%: 5 Hz increased vigilance
- Budget 10-20%: 10 Hz, alert operations
- Budget <10%: 50 Hz burst on canary hosts
- SLO breach: 100 Hz on all affected hosts

### 5. Integrate Burst Sampling with Alerting
- Configure monitoring system to send webhook on SLO breach
- Webhook triggers profiling agent to increase sampling rate on affected hosts
- Capture flame graphs from the first moment of degradation
- Include profile links in alert notifications for immediate investigation

### 6. Perform Differential Analysis During Incidents
- Compare burst profile against baseline profile
- Identify what changed: new slow code path, increased contention, memory leak onset
- Use flame graph diffing tools (Pyroscope diff view, Parca comparison)
- Document findings in incident post-mortem

### 7. Store Profiles for Historical Comparison
- Retain raw profiles for 7 days (high detail)
- Retain aggregated profiles for 30+ days (trend analysis)
- Configure automated cleanup to manage storage costs
- Enable week-over-week and month-over-month comparison

## Validation Checklist
- [ ] Profiling agent installed on all production hosts at 1-5 Hz
- [ ] Baseline profiles established (1-2 weeks of data)
- [ ] Health check endpoints excluded from profiling
- [ ] Adaptive sampling configured by error budget burn rate
- [ ] Burst sampling triggered automatically by SLO breach alerts
- [ ] Profile data stored for 30+ days
- [ ] Differential analysis performed during incidents

## Related Rules
- Adaptive sampling (`05-rules.md:1`)
- Baseline profiles before incidents (`05-rules.md:27`)
- Exclude health checks (`05-rules.md:53`)
- Integrate burst profiling with alerting (`05-rules.md:77`)
- Store profiles 30+ days (`05-rules.md:103`)

## Related Skills
- SLO Definition and Error Budgets
- Performance Regression Detection
- Flame Graph Interpretation
- Profiling Observability

## Success Criteria
- Baseline profiles established for all production hosts
- Profiling overhead <2% during normal operation
- Burst profiling captures diagnostic data automatically during SLO breaches
- Differential analysis identifies root cause within minutes
- Historical profiles enable week-over-week trend analysis
