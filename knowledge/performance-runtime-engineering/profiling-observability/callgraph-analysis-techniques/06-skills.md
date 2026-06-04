# Skill: Analyze Callgraphs to Identify Hot Paths with Top-Down and Bottom-Up Views

## Purpose
Analyze profiling callgraphs using top-down call trees and bottom-up callee maps to trace hot paths from entry point to the leaf function with highest exclusive time, accounting for weighted cost (cost × call count) to reveal loop-bound bottlenecks — enabling precise optimization target identification in 3-5 drill-down clicks.

## When To Use
- Investigating a specific slow endpoint identified by APM monitoring
- Determining whether bottleneck is database-bound, application-bound, or I/O-bound
- Comparing before/after optimization impact
- Onboarding to unfamiliar codebase — identify most expensive code paths

## When NOT To Use
- As replacement for flame graphs (flame graphs show aggregate across requests)
- Without a specific hypothesis about the slow endpoint
- When profiling overhead alters the performance profile

## Prerequisites
- Cachegrind file (Xdebug), Blackfire profile, or Tideways profile of the target endpoint
- KCacheGrind/QCacheGrind or profiling dashboard access
- Understanding of inclusive vs exclusive time

## Inputs
- Profile data for the slow endpoint
- Target optimization question ("why is /api/reports slow?")

## Workflow

### 1. Open Call Tree (Top-Down View)
- Open the profile in KCacheGrind or dashboard call tree
- Sort by "Inclusive Time" descending
- The top function is your entry point — note its total inclusive time
- This identifies which code path is slowest overall

### 2. Follow the Hot Path
- Double-click the most expensive child function
- Repeat: sort children by inclusive time, double-click most expensive
- Continue until you reach a leaf function with high exclusive (self) time
- Usually 3-5 clicks from entry point to root cause

### 3. Check Call Count and Weighted Cost
- View the "Calls" column alongside inclusive and exclusive time
- Calculate weighted cost = inclusive_time × call_count
- A 5ms function called 200 times = 1000ms — higher priority than 200ms × 1 call
- Identify loop-bound bottlenecks: N+1 queries, repeated service container resolution

### 4. Switch to Callee Map (Bottom-Up View)
- For each identified hot leaf, switch to callee map view
- See all callers of that function with their cost contribution
- If called from one place: optimize with index or query rewrite
- If called from multiple places: optimize with caching or materialized views

### 5. Validate with Source Code
- For the optimization target function, view source annotation
- Identify the exact line(s) causing high self time
- Apply fix (query optimization, caching, algorithm change)
- Re-profile with same tool and configuration
- Compare before/after: verify reduced exclusive time in target function

## Validation Checklist
- [ ] Call tree opened and sorted by inclusive time
- [ ] Hot path followed to leaf with high self time (3-5 clicks)
- [ ] Call count checked for loop-bound bottlenecks
- [ ] Callee map used for multi-caller analysis
- [ ] Source annotation viewed for exact line-level cost
- [ ] Fix applied and verified with new profile

## Related Rules
- Follow the hot path to leaf with high self time (`05-rules.md:1`)
- Check call count for weighted cost (`05-rules.md:27`)
- Use both top-down and bottom-up (`05-rules.md:53`)
- Same profiler for before/after (`05-rules.md:81`)
- Profile under realistic load (`05-rules.md:108`)

## Related Skills
- Inclusive vs Exclusive Time Analysis
- Flame Graph Generation and Interpretation
- Slow Query Identification from SQL
- Xdebug Profiling Setup and Analysis

## Success Criteria
- Hot path traced from entry to leaf with high self time
- Weighted cost calculated for all candidate functions
- Loop-bound bottlenecks identified via call count
- Callee map reveals multi-caller patterns
- Optimization target confirmed with source annotation
- Before/after profile validates the fix
