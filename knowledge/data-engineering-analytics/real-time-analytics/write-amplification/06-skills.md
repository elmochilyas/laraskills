# Skills: Write Amplification in ClickHouse MV Chains

## Skill: Measuring and Reducing Write Amplification
**Purpose:** Quantify and minimize write amplification in ClickHouse analytics pipelines.
**When to use:** Performance tuning and cost optimization for ClickHouse pipelines.
**Steps:**
1. Measure baseline insert throughput without MVs/projections
2. Add each MV one at a time, measuring throughput impact
3. Calculate amplification factor = (data written) / (source data inserted)
4. Consolidate MVs where possible
5. Replace trigger-based MVs with WAL-backed MVs
6. Replace real-time MVs with refreshable MVs where acceptable
7. Verify storage cost reduction after optimization
