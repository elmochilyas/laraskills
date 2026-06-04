# Skill: Analyze Inclusive vs Exclusive Time to Distinguish Delegation from Self-Time

## Purpose
Apply inclusive/exclusive time analysis to profiling data using the 20% heuristic (self/inclusive <20% = optimize callees; >20% = optimize the function), account for call count weight to reveal loop-bound bottlenecks, and extend the same analysis to memory allocation — ensuring optimization effort targets the leaf function with highest self-time rather than delegator functions.

## When To Use
- Determining whether to optimize a function or its callees
- Identifying the true root cause of a bottleneck
- Evaluating whether a wide frame in a flame graph is self-time or delegation
- Profiling memory allocation to trace where memory is actually consumed

## When NOT To Use
- When profiling data is not available
- As replacement for business logic understanding

## Prerequisites
- Profile data with inclusive/exclusive breakdown (cachegrind, Blackfire, Tideways)
- KCacheGrind/QCacheGrind or profiling dashboard

## Inputs
- Profile of target endpoint
- Candidate functions sorted by inclusive time

## Workflow

### 1. Identify Bottlenecks by Inclusive Time
- Sort functions by inclusive time descending
- The top functions are the slowest code paths — these are your bottlenecks
- Record total inclusive time for each candidate

### 2. Calculate Self/Inclusive Ratio
- For each candidate, check self (exclusive) time
- Calculate ratio: `self_time / inclusive_time × 100`
- Apply 20% heuristic:
  - Ratio <20%: function delegates to children — drill into callees
  - Ratio >20%: function does meaningful work — optimize directly
- Example: 500ms inclusive, 5ms self = 1% — pure delegator, optimize children

### 3. Check Call Count for Weighted Cost
- View "Calls" column alongside time metrics
- Calculate weighted cost: `cost × call_count`
- 5ms function × 200 calls = 1000ms — higher priority than 200ms × 1 call
- Loop-bound bottlenecks (N+1 queries, repeated calls) are invisible in per-call analysis

### 4. Follow Hot Path to Leaf with Highest Self Time
- Start from entry point (high inclusive, low self = delegator)
- Expand most expensive child → repeat
- Stop at leaf with high self/inclusive ratio >20%
- That leaf is your optimization target

### 5. Apply Same Analysis to Memory
- Check inclusive memory (function + callees) vs exclusive memory (function only)
- High inclusive + low exclusive = data passes through the function — optimize callees
- High inclusive + high exclusive = function allocates directly — optimize function
- Example: 200MB inclusive, 2MB self → query returns too many rows

### 6. Validate with Before/After Profile
- Apply optimization to target function
- Re-profile with same tool and configuration
- Verify reduced exclusive time in target function
- Confirm inclusive time of the endpoint decreased proportionally

## Validation Checklist
- [ ] Functions sorted by inclusive time descending
- [ ] Self/inclusive ratio calculated for top 5 functions
- [ ] 20% heuristic applied — target identified
- [ ] Call count checked for loop-bound bottlenecks
- [ ] Hot path followed to leaf with highest self time
- [ ] Memory inclusive/exclusive analyzed if relevant
- [ ] Fix validated with before/after profile

## Related Rules
- 20% heuristic: self/inclusive ratio (`05-rules.md:1`)
- Always check call count (`05-rules.md:27`)
- Inclusive for identification, exclusive for targeting (`05-rules.md:53`)
- Memory inclusive/exclusive analysis (`05-rules.md:80`)

## Related Skills
- Callgraph Analysis Techniques
- Flame Graph Generation and Interpretation
- Slow Query Identification from SQL
- Xdebug Profiling Setup and Analysis

## Success Criteria
- Top bottlenecks identified by inclusive time
- Optimization target identified by self/inclusive >20% ratio
- Loop-bound bottlenecks surfaced via weighted cost
- Memory analysis applied when profiling memory allocation
- Fix verified with before/after profile showing reduced exclusive time
