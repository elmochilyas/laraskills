# Skill: Identify Slow SQL Queries via Profiling Tools with Total Cost Analysis

## Purpose
Identify slow database queries from profiling tool data (Blackfire, Tideways) by sorting by total cost (execution_time × call_count), detecting N+1 patterns invisible to MySQL slow query log, cross-referencing with call stacks for context, and checking row counts for excessive data volume — enabling optimization of the highest-impact queries first.

## When To Use
- Investigating endpoint latency where database time is suspected as the bottleneck
- Detecting N+1 query patterns invisible to database slow query logs
- Prioritizing query optimizations by total cost
- Validating query optimization impact before/after deployment

## When NOT To Use
- When only database-level profiling is needed (use MySQL slow query log)
- When profiling tool does not capture query parameters

## Prerequisites
- Profiling tool configured to capture SQL queries (Blackfire, Tideways)
- Profile generated for the slow endpoint
- Access to profiling dashboard with SQL analysis

## Inputs
- Profile of slow endpoint with SQL capture enabled
- MySQL slow query log for cross-reference
- List of candidate slow queries

## Workflow

### 1. Access SQL Analysis in Profiling Dashboard
- Open profiling dashboard (Blackfire SQL tab, Tideways tracepoints)
- View captured SQL queries with duration, row count, and parameters
- Group queries by fingerprint (normalized SQL without parameters)
- Note: profiling tools see ALL queries, not just those over a threshold

### 2. Sort by Total Cost (Not Per-Query Duration)
- Calculate total cost = average_duration × call_count
- Sort descending by total cost
- Prioritize the top 3-5 queries by total cost
- A 5ms query × 200 calls = 1000ms — higher priority than 200ms × 1 call

### 3. Detect N+1 Patterns
- Look for same query fingerprint with different parameters, many calls
- Check if calls originate from the same stack trace (loop in application code)
- Blackfire highlights N+1 queries automatically
- Fix N+1 with eager loading (Eloquent `with()`), batching, or caching

### 4. Cross-Reference with MySQL Slow Query Log
- Compare profiling SQL data with MySQL slow query log
- Profiling catches N+1 (invisible to slow log — each query is fast individually)
- Slow query log catches chronic slow queries (profiling may miss due to sampling)
- Both sources together provide complete coverage

### 5. Check the Call Stack for Each Query
- For each flagged query, review its call stack
- Same query fingerprint may be called from different endpoints
- Acceptable in admin report (2s), catastrophic in API endpoint (200ms)
- Optimize for the most impactful calling context

### 6. Check Row Count Alongside Duration
- Review average row count for each flagged query
- High row count with moderate duration = data volume bottleneck
- Example: 10,000 rows at 50ms — serialization adds 500ms elsewhere
- Add LIMIT, pagination, or filter conditions to reduce data volume

### 7. Validate Before/After
- Run profile before optimization
- Apply optimization (index, query rewrite, eager loading, LIMIT)
- Re-profile with same tool and configuration
- Confirm total cost decreased and endpoint improved

## Validation Checklist
- [ ] Profiling tool configured to capture SQL queries
- [ ] Queries sorted by total cost (execution_time × call_count)
- [ ] N+1 patterns identified and prioritized
- [ ] MySQL slow query log cross-referenced
- [ ] Call stack reviewed for query context
- [ ] Row count checked for data volume issues
- [ ] Optimization validated with before/after profile

## Related Rules
- Prioritize by total cost (`05-rules.md:1`)
- Cross-reference with MySQL slow log (`05-rules.md:27`)
- Check call stack for context (`05-rules.md:54`)
- Check row count for data volume (`05-rules.md:81`)
- Profile before/after optimization (`05-rules.md:108`)

## Related Skills
- Inclusive vs Exclusive Time Analysis
- Callgraph Analysis Techniques
- Database Query Benchmarking Integration
- N+1 Detection and Prevention

## Success Criteria
- Top 3-5 queries identified by total cost (duration × call count)
- N+1 patterns detected and prioritized for eager loading fix
- Profiling data cross-referenced with MySQL slow query log
- Row count assessed for data volume issues
- Optimization validated with before/after profile showing reduced total cost
