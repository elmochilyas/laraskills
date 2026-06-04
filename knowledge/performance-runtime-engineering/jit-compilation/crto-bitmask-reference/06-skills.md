# Skill: Decode and Configure JIT Using the CRTO Bitmask

## Purpose

Interpret PHP's JIT CRTO (Compile, Register, Trigger, Optimize) bitmask to select the exact JIT compilation mode that matches a workload's characteristics.

## When To Use

- Tuning JIT beyond the default tracing (1254) or function (1205) modes
- Understanding why a specific JIT mode performs differently on a given workload
- Experimenting with JIT flags for CPU-bound batch processing

## When NOT To Use

- For initial JIT setup (use default 1254 and adjust later if needed)
- Without first profiling the workload to understand its CPU-bound proportion
- When OpCache is not yet optimally configured

## Prerequisites

- Understanding of JIT concepts (tracing vs function, guard elimination, hot paths)
- Profiling data showing workload's CPU-bound proportion and code patterns
- Access to php.ini for JIT configuration

## Inputs

- Workload profile: loop-heavy, function-call-heavy, or mixed
- Current JIT configuration and benchmark baseline
- PHP version (bitmask flags vary between versions)

## Workflow (numbered steps)

1. Document the current JIT CRTO bitmask value (e.g., opcache.jit=1254)
2. Decode the four digits: Compile (1=tracing, 2=function), Register (2=default), Trigger (5=PGO threshold), Optimize (4=useSSA)
3. For loop-heavy CPU-bound workloads: compile mode 1 (tracing) captures loop patterns better
4. For method/function-call-heavy workloads: compile mode 2 (function) compiles entire functions
5. For maximum optimization (at higher compile cost): optimize flag 5 (use all optimizations including SSA)
6. Apply the new bitmask and run a before/after benchmark comparison
7. If throughput improves >5%, keep the new mode; otherwise revert to 1254
8. Document the selected bitmask and the rationale based on workload characteristics

## Validation Checklist

- [ ] CRTO bitmask decoded and understood for current configuration
- [ ] Workload profile (loop vs function heavy) matched to compile mode
- [ ] Before/after benchmark completed for each tested mode
- [ ] Selected mode documented with performance data
- [ ] JIT buffer utilization monitored after mode change

## Common Failures

- **Changing mode without benchmarking**: Different modes have different compilation overhead — always measure before committing
- **Assuming higher optimization always wins**: Higher optimize flags increase compilation time and memory — may not amortize for short-lived workers
- **Ignoring PHP version differences**: Bitmask behavior changes between PHP versions — check the version's documentation

## Decision Points

- Tracing JIT (1xxx): best for loop-heavy workloads with predictable iteration patterns
- Function JIT (2xxx): best for workloads dominated by function/method calls
- PGO trigger (xx5x): balances compilation overhead with hot-path detection
- Optimize with SSA (xxx4/xxx5): use SSA for best optimization but higher memory usage

## Performance Considerations

- Each optimization level adds compilation time — higher levels require more calls to amortize
- Tracing JIT has lower initial overhead but may miss optimization opportunities in non-loop code
- Function JIT compiles more aggressively — uses more buffer space but may provide better optimization for some workloads
- Maximum optimization (1235) compiles everything — may cause buffer thrashing on large applications

## Security Considerations

- JIT mode changes do not affect PHP's security model
- Higher optimization levels do not introduce security vulnerabilities
- Some bytecode optimizations may change error reporting behavior in edge cases

## Related Rules (from 05-rules.md)

- Use Tracing JIT (1254) as Default
- Monitor JIT Buffer Utilization
- Configure OpCache Before JIT

## Related Skills

- JIT Mode Comparison
- JIT Configuration for Production
- Workload Benefit Assessment

## Success Criteria

- CRTO bitmask rationale documented for the selected mode
- Workload profile (loop vs function) guides compile mode selection
- Before/after benchmark confirms mode provides benefit
- JIT buffer utilization stays below 80% with selected mode
