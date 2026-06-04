# Skill: Eliminate Coordinated Omission Using Open-Loop Benchmark Tools

## Purpose
Eliminate coordinated omission bias from latency benchmarks by using open-loop tools (wrk2 with `--rate`, k6 constant arrival rate) instead of closed-loop tools (ab, wrk) — capturing true latency distribution including queuing delay, which closed-loop tools systematically underestimate by 30-60%.

## When To Use
- All latency benchmarks where tail latency accuracy is critical
- Capacity testing to find the true saturation point
- CI benchmark gates that must detect regressions reliably
- Comparing configurations where accurate latency measurements matter

## When NOT To Use
- Maximum throughput discovery (closed-loop wrk is appropriate for peak RPS)
- Quick smoke tests where approximate results are acceptable
- When the tool does not support open-loop mode

## Prerequisites
- wrk2 or k6 installed on the load generator
- Understanding of closed-loop vs open-loop mechanics
- Target system running in an isolated environment

## Inputs
- Target endpoint URL
- Expected throughput range (to set appropriate `--rate` values)
- Load generator specifications (CPU cores for thread count)

## Workflow

### 1. Identify Closed-Loop Bias Risk
- Check if current benchmarks use ab, wrk (without `--rate`), or other closed-loop tools
- Closed-loop tools hide queuing delay above ~50% utilization
- If any latency benchmark uses closed-loop, results are systematically optimistic
- Plan to replace closed-loop tools with wrk2 or k6 for latency measurement

### 2. Install and Configure wrk2
- Install wrk2 (different from wrk — separate tool/fork)
- Set thread count (`-t`) to match load generator CPU cores
- Set connection count (`-c`) high enough to sustain target rate
- Always include `--rate` flag for open-loop mode

### 3. Run Open-Loop Benchmark Progression
- Start below expected capacity: `wrk2 -t4 -c64 -d30s -R 500 --latency`
- Increase rate gradually: 1000, 2000, 3000 RPS
- Identify saturation point: where p99 latency doubles from baseline
- At saturation: open-loop reveals true queuing delay; closed-loop would hide it

### 4. Compare Open-Loop vs Closed-Loop Results
- Run same benchmark with wrk (closed-loop) at the saturation rate
- Compare p99 latency: closed-loop is typically 30-60% lower
- The difference is the hidden queuing delay — real users experience open-loop latency
- Document both results to demonstrate the bias

### 5. Report Loop Type in All Benchmark Results
- Always document whether open-loop or closed-loop was used
- For open-loop: report the target rate (`--rate` value)
- For closed-loop: note that results are only valid for throughput, not latency
- Never compare latency across different loop types

## Validation Checklist
- [ ] Open-loop tool used for all latency benchmarks (wrk2 with `--rate` or k6)
- [ ] Closed-loop tool used only for maximum throughput discovery
- [ ] Loop type documented in all benchmark reports
- [ ] Saturation point identified by gradual rate increase
- [ ] Latency verified with open-loop before capacity decisions

## Related Rules
- Never use tools with coordinated omission (`05-rules.md:1`)
- Open-loop for latency (`05-rules.md:25`)

## Related Skills
- wrk/wrk2 Usage and Lua Scripting
- Benchmarking Concepts
- Metrics Definition and Interpretation

## Success Criteria
- All latency benchmarks use open-loop tools
- Coordinated omission bias eliminated from all measurements
- Loop type documented in all reports
- Saturation point identified with accurate latency data
- Capacity decisions based on open-loop latency data
