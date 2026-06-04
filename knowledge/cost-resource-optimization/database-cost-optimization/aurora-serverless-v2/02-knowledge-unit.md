# K06: Aurora Serverless v2 Pricing

## Metadata
- **ID**: K06
- **Subdomain**: Database Cost Optimization
- **Topic**: Aurora Serverless v2 Pricing
- **Source**: AWS Documentation, CloudBurn, CloudZero (2026)
- **Reliability**: High

## Executive Summary
Aurora Serverless v2 costs $0.12/ACU-hour (Standard) or $0.156/ACU-hour (I/O-Optimized) with minimum capacity of 0.5 ACU (~$43/month minimum). Each ACU provides approximately 2GB memory with proportional CPU. While promising for variable workloads, the pricing model has pitfalls: minimum ACU settings, no RI equivalents, and the trap of setting min ACU too low causing buffer pool thrashing. For dev/test, setting min ACU to 0 enables auto-pause, dropping compute charges to zero.

## Core Concepts
- **ACU-hour**: $0.12 (Standard), $0.156 (I/O-Optimized) per ACU-hour in us-east-1
- **1 ACU**: ~2GB memory + proportional CPU + networking
- **Min capacity**: 0.5 ACU (~$43/month minimum if kept alive)
- **Auto-pause**: Set min 0 ACU for dev/test; compute drops to $0 when idle
- **No RI available**: Serverless v2 discounts only via On-Demand pricing
- **Scale speed**: Up/down in seconds, not minutes

## Mental Models
- **Serverless v2 as thermostat**: Set the range (min/max ACU), not the exact temperature; the system adjusts automatically
- **Pool analogy**: ACU minimum is the pool's depth Ã¢â‚¬â€ too shallow and you hit bottom (buffer pool thrashing)

## Internal Mechanics
ACUs scale near-instantly based on CPU and connection load. The cluster writer handles writes/reads; readers scale independently. Storage is Aurora's distributed storage layer (separate cost). Scaling from 0.5 to 256 ACUs in seconds. No cold start on scale-up. The minimum ACU should be set to hold the working set in memory (typically 4-16 ACUs for production).

## Patterns
- **Dev/test**: Set min 0 ACU auto-pause; cost = storage only ($0.10/GB-month)
- **Variable production**: Set min ACU to working set size (monitor buffer pool hit ratio)
- **Hybrid**: Provisioned writer (RI-eligible) + Serverless v2 readers (flexible read scaling)
- **I/O-Optimized**: Switch when I/O charges exceed 25% of compute; no downtime to switch

## Architectural Decisions
- Choose Serverless v2 when: peak-to-trough ratio > 3:1, unpredictable traffic, dev/test
- Stay Provisioned when: steady workload, need RIs, peak-to-trough ratio < 2:1
- Set minimum ACU to at least 4 for production to prevent buffer pool thrashing
- Never set min ACU to 0.5 for production (insufficient for any working set)

## Tradeoffs
- **Flexibility vs RI discount**: Serverless v2 has no RI equivalent; provisioned with RI is 30-66% cheaper at steady state
- **Auto-scaling vs cost control**: Auto-scaling prevents over-provisioning but makes costs less predictable
- **I/O-Optimized vs Standard**: I/O-Optimized is 30% more expensive compute but eliminates per-I/O charges

## Performance Considerations
- Scale-up is near-instant; scale-down is slower (minutes)
- Buffer pool hit ratio drops if min ACU is too low Ã¢â€ â€™ increased I/O charges
- Connection pooling recommended (RDS Proxy or PgBouncer) for frequent connect/disconnect patterns
- Cold start: Serverless v2 does NOT have cold starts (always warm at configured min)

## Production Considerations
- Monitor ServerlessDatabaseCapacity and ACUUtilization metrics
- Right-size min ACU: start at 4 ACU, monitor buffer pool hit ratio (>95% target), adjust up if needed
- Use Aurora Standard for dev/test; evaluate I/O-Optimized for production with high I/O
- Aurora Platform Version 4: 27% faster completion, 28% lower cost vs v3

## Common Mistakes
- Setting min ACU to 0.5 for production (causes buffer pool thrashing, increased I/O costs)
- Not auto-pausing dev/test instances (wasting compute on idle databases)
- Choosing Serverless v2 for steady workloads (provisioned + RI is 30-60% cheaper)
- Ignoring the minimum ACU charge when comparing costs

## Failure Modes
- Scaling delays during rapid traffic spikes (takes seconds, not instant)
- No RI available Ã¢â€ â€™ full On-Demand pricing at all times
- Write-heavy workloads may not benefit from read auto-scaling
- RDS Proxy minimum 8 ACU charge (~$300/month) negates Serverless v2 cost advantage for small workloads

## Ecosystem Usage

- **Laravel Forge**: Supports Aurora and RDS provisioning via UI; manages database user creation and SSL\n- **Laravel Vapor**: Aurora Serverless v2 is the default database option for Vapor-deployed applications\n- **Laravel Cloud**: Postgres with Neon integration for development branching\n- **Laravel Telescope**: Uses database for monitoring; ensure Telescope-specific database has adequate IOPS

## Related Knowledge Units
- K07: Aurora Serverless v2 Breakeven
- K09: Aurora Platform v4
- K34: RDS Proxy Pricing
- K05: RDS Reserved Instances

## Research Notes
Aurora Serverless v2 pricing ($0.12/ACU-hour) has remained stable since launch. The key 2025-2026 development is Aurora I/O-Optimized configuration, which switches from per-I/O billing to higher compute with unlimited I/O. For Laravel apps with moderate I/O, Standard is usually cheaper. For analytics-heavy workloads with high I/O, I/O-Optimized wins. Aurora Platform v4 (April 2026) brought significant performance and cost improvements.
