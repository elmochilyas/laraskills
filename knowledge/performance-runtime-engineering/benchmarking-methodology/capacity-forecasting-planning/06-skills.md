# Skill: Forecast Infrastructure Capacity with Growth Modeling and Safety Margins

## Purpose
Project future infrastructure requirements based on traffic growth trends, calculate worker scaling needs, model multiple growth scenarios, and establish procurement timelines — preventing reactive capacity management and production saturation.

## When To Use
- Annual infrastructure budgeting and procurement planning
- Before major traffic events (product launches, marketing campaigns)
- When current infrastructure approaches 70% utilization during peak hours
- Monthly capacity review cycles

## When NOT To Use
- Flat or declining traffic services
- Very early-stage products without stable traffic patterns
- Environments with auto-scaling that handles all capacity needs

## Prerequisites
- 3+ months of traffic data (RPS, latency, worker count)
- Current worker RSS baseline (P95 after 30+ minutes steady state)
- Database max_connections and current utilization
- Server specifications (CPU, RAM per server)

## Inputs
- Current peak traffic (P95 daily peak RPS)
- Monthly traffic growth rate (from historical data)
- RPS per worker from benchmarks
- P95 worker RSS
- Database connection budget

## Workflow

### 1. Measure Current Peak Traffic
- Use P95 daily peak RPS — never use average traffic
- Average is typically 30-50% of peak — sizing for average guarantees saturation
- Collect 30+ days of data to identify weekly and seasonal patterns
- Record the peak RPS, corresponding latency, and worker count

### 2. Calculate Projected Traffic
- Determine monthly growth rate from historical data
- Apply: `projected_peak_RPS = current_peak_RPS × (1 + growth_rate)^months`
- Model three scenarios: best case (half growth), expected case (current growth), worst case (double growth)
- Plan procurement for expected case, budget approval for worst case

### 3. Calculate Required Workers
- Measure RPS per worker from benchmarks: `RPS_per_worker = total_RPS / worker_count`
- Apply safety factor: `required_workers = projected_RPS / (RPS_per_worker × safety_factor)`
- Safety factors: 1.2× normal, 1.5× critical, 2× no auto-scaling
- Calculate required RAM: `RAM = required_workers × P95_RSS × 1.5`

### 4. Include Database Connection Budget
- Calculate connections per worker (DB read + write + Redis + other)
- Compute total connections: `required_workers × connections_per_worker`
- Verify against: `database_max_connections × 0.8`
- If connection-limited, cap workers and add servers

### 5. Determine Procurement Timeline
- Calculate current headroom: `(capacity - demand) / capacity × 100`
- Below 30% headroom: investigate capacity increase
- Below 15% headroom: critical — plan immediate upgrade
- Set upgrade deadline: when headroom reaches 10% at projected growth
- Subtract 2 months procurement lead time for order deadline

### 6. Review Monthly
- Compare forecast vs actual traffic every month
- Adjust growth rate based on latest data
- Recalculate upgrade timeline
- Document changes and communicate to stakeholders

## Validation Checklist
- [ ] P95 daily peak traffic measured (not average)
- [ ] Growth rate calculated from 3+ months of data
- [ ] Three scenarios modeled (best, expected, worst)
- [ ] Required workers calculated with safety margin
- [ ] Database connection budget included
- [ ] Procurement timeline with 2-month lead time buffer
- [ ] Monthly review scheduled

## Related Rules
- Forecast from peak traffic (`05-rules.md:1`)
- Include safety margins (`05-rules.md:27`)
- 6-month forecasts with monthly review (`05-rules.md:52`)
- Budget database connections (`05-rules.md:79`)
- Three growth scenarios (`05-rules.md:106`)

## Related Skills
- Metrics Definition and Interpretation
- Worker RSS Capacity Ceiling
- PM Max Children P95 Calculation
- Horizontal Scaling Architecture

## Success Criteria
- 6-month forecast completed with expected/best/worst case scenarios
- Upgrade deadline calculated with procurement lead time buffer
- Database connection budget included as primary constraint
- Monthly review cadence established
- Infrastructure ordered before headroom drops below 15%
