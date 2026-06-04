# Decomposition: Context Switching

## Topic Overview
Context switching occurs when the CPU switches between processes (PHP workers, database connections, background tasks). Each switch has overhead: saving/loading registers, flushing TLBs, updating page tables. For Laravel servers, excessive context switching from over-allocated workers reduces effective throughput by 20-50%, meaning the same workload requires more servers. Proper worker sizing minimizes context switching overhead.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-08-context-switching/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Context Switching
- **Purpose:** Context switching occurs when the CPU switches between processes (PHP workers, database connections, background tasks). Each switch has overhead: saving/loading registers, flushing TLBs, updating page tables. For Laravel servers, excessive context switching from over-allocated workers reduces effective throughput by 20-50%, meaning the same workload requires more servers. Proper worker sizing minimizes context switching overhead.
- **Difficulty:** Foundation
- **Dependencies:** - Worker Pool Sizing (ku-07), - Queue Worker Scaling (ku-10), - Server Provisioning (ku-02)

## Dependency Graph
**Depends on:**
- Worker Pool Sizing (ku-07)
- Queue Worker Scaling (ku-10)
- Server Provisioning (ku-02)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Context switch monitoring: Any server with constrained CPU or over-allocated workers
- Worker count reduction: When run queue length > 2 on production web servers
- Nice for queue workers: Lower priority for batch jobs to prioritize web responses
- CPU pinning: For Octane or dedicated processing servers
- I/O-heavy pool sizing: Can safely exceed CPU cores because workers yield during I/O
**Out of scope:**
- Ignoring context switching: Not relevant for under-utilized servers (<50% CPU)
- CPU pinning for shared servers: Fixed CPU affinity interferes with hypervisor scheduling
- Aggressive nicing: Setting all non-web processes to lowest priority may starve critical background tasks
- Overly complex optimization: For servers with 1000 req/s or less, focus on application-level optimization first
- Related topics covered in other Knowledge Units within this domain.

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

No Knowledge Unit is overloaded

No major concept is missing

Boundaries are clear

Future phases can operate on individual units

The structure can scale without reorganization