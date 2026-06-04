# Skill: Deploy eBPF Profiling for Near-Zero Overhead System-Level CPU Sampling

## Purpose
Deploy eBPF-based profiling (Pyroscope, Parca, or bpftrace) for always-on system-level CPU monitoring with <0.5% overhead, scoping by PID or container ID, sampling at 99 Hz for 60+ seconds, pairing with PHP-level profilers for full call stack visibility, and managing data storage (~100MB/hour per 1000 processes) — capturing kernel-level stack traces that PHP-only profilers miss.

## When To Use
- Production environments where any profiling overhead is unacceptable
- Always-on continuous profiling for baseline CPU monitoring
- Debugging kernel-level issues (syscall overhead, I/O wait, context switching)
- Containerized environments where PHP extension installation is restricted
- Complementing PHP-level profilers (eBPF for system-level, Tideways/Blackfire for PHP-level)

## When NOT To Use
- When PHP function-level call stacks are required without JIT
- When memory profiling is needed (eBPF does not capture PHP memory allocation)
- On non-Linux systems (eBPF is Linux-specific)
- On kernels <4.9 without BPF support

## Prerequisites
- Linux kernel 4.9+ with BPF support
- CAP_BPF, CAP_PERFMON, or root privileges
- Pyroscope, Parca, or bpftrace installed
- PID or container ID of target PHP processes

## Inputs
- PHP-FPM process PIDs or container IDs
- Expected profiling duration (60+ seconds)
- Storage allocation for profiling data

## Workflow

### 1. Install eBPF Profiling Agent
- Install Pyroscope or Parca agent on target hosts
- Verify kernel BPF support: check if `CONFIG_BPF=y` in kernel config
- Ensure agent has required capabilities (CAP_BPF, CAP_PERFMON)
- For container environments: run agent as sidecar or DaemonSet

### 2. Configure PID or Container Scoping
- Use `--pid <PID>` to target specific PHP-FPM processes
- Use `--container-id <ID>` for Docker containers
- In Kubernetes: use Parca annotations for auto-discovery
- Never run unscoped eBPF on shared hosts — captures all system processes

### 3. Set Sampling Frequency and Duration
- Standard: 99 Hz for 60+ seconds (5940+ stack traces)
- Higher (199 Hz) for more detail at higher storage cost
- Lower (49 Hz) for reduced overhead on very large fleets
- Profile for 60+ seconds minimum — shorter durations produce noisy data

### 4. Generate and Interpret Flame Graphs
- View flame graph in Pyroscope/Parca UI
- Check colors: red/orange = CPU-bound, blue/teal = I/O-bound, gray = waiting
- Wide top frames = self-time hotspots (optimization target)
- Interpret with caution: eBPF sees JIT-compiled native code, not PHP opcode frames

### 5. Correlate with PHP Slow Log or APM
- Cross-reference wide eBPF frames with PHP-FPM slow log entries
- eBPF shows which function is hot but not which endpoint triggered it
- Pair with Tideways/Blackfire for full PHP call stack context
- For JIT-enabled PHP: eBPF sees native function names directly

### 6. Manage Data Storage
- Plan for ~100MB/hour per 1000 profiled processes
- Raw traces: 7 days retention
- Aggregated (1-min summaries): 90 days
- Configure cleanup policies in profiling agent

## Validation Checklist
- [ ] eBPF agent installed and running
- [ ] PID or container scoping configured
- [ ] Sampling frequency set to 99 Hz
- [ ] Flame graph generated showing CPU distribution
- [ ] eBPF data correlated with PHP slow log or APM
- [ ] Storage retention configured (7 days raw, 90 days aggregated)
- [ ] Agent running with minimal capabilities

## Related Rules
- eBPF complements PHP profilers, not a replacement (`05-rules.md:1`)
- PID/container scoping required (`05-rules.md:27`)
- Cross-reference with slow log/APM (`05-rules.md:51`)
- 60+ seconds at 99 Hz (`05-rules.md:77`)
- Manage storage — ~100MB/hour (`05-rules.md:101`)

## Related Skills
- Flame Graph Generation and Interpretation
- Production Guardrails and Profiling Cost
- Blackfire Installation and Triggered Profiling
- Tideways Setup — Continuous Monitoring

## Success Criteria
- eBPF agent deployed with <0.5% overhead on all target hosts
- PID/container scoping prevents cross-tenant data contamination
- Flame graphs produced and correlated with APM/slow log for context
- Storage managed with retention policies
- eBPF + PHP profiler combo strategy documented
