# Knowledge Unit: Graph-Based Workflows

## Metadata

- **ID:** KU-013
- **Subdomain:** Agent Architecture & Orchestration
- **Slug:** graph-workflows
- **Version:** 1.0.0
- **Maturity:** Emerging (v0.x)
- **Status:** Published

## Executive Summary

Graph-based workflow engines (LaraGraph, AgentGraph) extend multi-agent patterns to durable, stateful, multi-step processes with checkpoints, parallel fan-out, loops, and human-in-the-loop approval gates. Unlike simple linear chains, graph workflows support branching, conditional routing, retries, and long-running sessions with persistence. These are the PHP equivalents of LangGraph (Python).

## Core Concepts

- **Graph**: Directed graph of nodes (steps) and edges (transitions)
- **Nodes**: Individual processing steps — can be agents, tools, or custom PHP callables
- **Edges**: Define flow — conditional, unconditional, parallel fan-out/fan-in
- **State**: Shared state object passed through the graph — serialized for persistence
- **Checkpoints**: Snapshots of graph state at node boundaries — enables pause/resume/replay
- **Human-in-the-loop**: Pause execution at specific nodes for human approval or input
- **Durable execution**: Graph state persists to database — survives process restarts

## Mental Models

- **State machine for AI**: Each node is a state, edges are transitions with conditions. The graph machine executes the workflow deterministically.
- **Directed acyclic graph (DAG) for AI workflows**: Like Airflow or Laravel workflows — define steps, dependencies, conditional branching, and error handling.
- **Finite state machine**: The graph has defined states (nodes) and transitions (edges) — the runtime tracks which state is active and what comes next.

## Internal Mechanics

LaraGraph and AgentGraph implement similar architectures:
1. Build: Define nodes (each with a handler) and edges (source → target, with optional condition function)
2. Compile: Validate graph structure — detect cycles (if not allowed), unreachable nodes, missing edges
3. Execute: Runtime traverses graph, executing nodes in order, evaluating edge conditions
4. State management: Each node receives shared state, can read/write typed properties
5. Checkpointing: After each node execution, state is serialized and stored (DB or Redis)
6. Resume: On restart, load latest checkpoint and continue from that node

AgentGraph adds durable runtime with checkpointing support, human-in-the-loop approval nodes, and parallel branching.

## Patterns

- **Sequential pipeline**: Linear chain of nodes — simple, predictable
- **Conditional branching**: Edge evaluator function routes to different nodes based on state
- **Parallel fan-out**: One node fans out to N parallel nodes, fan-in node waits for all to complete
- **Loop with guard**: Iterate over a node until a condition is met (with max iteration guard)
- **Approval gate**: Pause at approval node, wait for human input via API/webhook, continue or abort
- **Error subgraph**: On error, route to error handling subgraph instead of aborting

## Architectural Decisions

- **Decision**: Explicit graph vs. implicit (code-defined) → Both LaraGraph and AgentGraph use explicit graph definition. Reason: Visualizable, debuggable, serializable, supports checkpointing.
- **Decision**: State schema vs. free-form array → Typed state objects. Reason: Serialization, validation, checkpointing reliability.
- **Decision**: Synchronous vs. async execution → Both supported. Synchronous for predictable flows; async for long-running workflows with queue workers.

## Tradeoffs

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Graph complexity vs. flexibility | Handles complex branching | Overhead for simple linear flows |
| Checkpoint overhead | Enables resume/replay | Disk space, serialization cost |
| Explicit graph definition | Inspectable, testable | More code than ad-hoc orchestration |
| Durable execution | Survives crashes | Slower than in-memory execution |

## Performance Considerations

- Checkpoint serialization adds latency per node boundary — batch checkpoint every N nodes for high-throughput workflows
- State object size grows as workflow progresses — prune unnecessary state before checkpointing
- Parallel fan-out execution bounded by queue worker concurrency
- Graph compilation is done once per workflow definition — cache compiled graph

## Production Considerations

- Define max execution time per workflow — prevent runaway graph traversal
- Implement dead letter queues for failed workflows — inspect and retry
- Monitor checkpoint storage size — growing state objects indicate missing cleanup
- Version graph definitions — breaking changes to state schema require migration
- Test graph edges exhaustively — conditional branches are common failure points
- Human-in-the-loop requires webhook/API — implement timeout for approval waiting

## Common Mistakes

- Using graph workflows when a simple chain would suffice (over-engineering)
- Not defining max iterations on loops — infinite loops consume tokens indefinitely
- Ignoring state schema evolution — changing state object breaks existing checkpoints
- Conditional edges that don't cover all cases — workflow gets stuck
- Parallel nodes with shared mutable state — race conditions in state updates

## Failure Modes

- **Stuck workflow**: No edge condition matches current state — design catch-all edge
- **Checkpoint corruption**: State fails to deserialize — implement migration strategies
- **Human-in-the-loop timeout**: Approval never arrives — implement timeout and default action
- **Resource leak**: Each checkpoint retains connections/file handles — release resources before checkpointing
- **Deadlock**: Sub-graph waiting for sub-graph that never completes — implement workflow-level timeout

## Ecosystem Usage

- Multi-step document processing pipelines (extract → classify → redact → store → notify)
- Customer onboarding workflows with human approval gates
- Long-running research agents with iterative refinement
- Automated content moderation with escalation flows

## Related Knowledge Units

- KU-012: Multi-Agent Patterns
- KU-014: Durable Agent Runtime
- KU-015: Queued Agent Execution

## Research Notes

- `cainydev/laragraph`: v0.x, GitHub (Mar 2026) — focuses on typed-state graphs with conditions
- `heinergiehl/agent-graph`: MVP, GitHub (May 2026) — adds durable runtime, checkpoints, human-in-the-loop
- Both are emerging packages (<1.0) — API breaking changes expected
- No standard protocol for graph workflow definition in PHP — each package has its own schema
- Cross-package migration would require adapter layer
