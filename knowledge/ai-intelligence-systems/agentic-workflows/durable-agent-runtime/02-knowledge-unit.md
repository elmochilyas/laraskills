# Knowledge Unit: Durable Agent Runtime

## Metadata

- **ID:** KU-014
- **Subdomain:** Agent Architecture & Orchestration
- **Slug:** durable-agent-runtime
- **Version:** 1.0.0
- **Maturity:** Emerging (MVP)
- **Status:** Published

## Executive Summary

Durable agent runtimes (AgentGraph, Conductor) enable agent workflows to survive process restarts, server crashes, and long pauses. They achieve this through checkpointing — persisting the agent's full state at each step boundary. This enables pause/resume, fork/replay from any checkpoint, and human-in-the-loop interruptions that last hours or days.

## Core Concepts

- **Checkpointing**: Serialized snapshot of agent state (memory, stack, variables) at execution boundaries
- **Durable execution**: Workflow resumes from last checkpoint after crash — no progress lost
- **Pause/Resume**: Agent pauses at defined points (e.g., waiting for human input), resumes later
- **Fork/Replay**: Clone a checkpoint, replay from that point with different inputs — debugging and what-if analysis
- **State schema**: Typed definition of what state is preserved across checkpoints
- **Idempotency**: Replaying a checkpoint produces the same result — deterministic nodes

## Mental Models

- **Database transaction log for AI**: Like PostgreSQL WAL — every state change is logged, enabling rollback and recovery.
- **Video game save point**: The agent state is saved at checkpoints. Crash? Load the last save. Want to try a different approach? Fork from a checkpoint.
- **Laravel queue with replay**: Like failed queue jobs that you can retry, but with full agent state preserved.

## Internal Mechanics

Durable runtime lifecycle:
1. Agent receives task → creates initial state
2. Before each node execution, serialize state to DB
3. Execute node (agent call, tool call, etc.)
4. After node completion, serialize updated state (including tool results, conversation tokens)
5. If crash occurs between step 3-4 → on restart, load state from step 2 checkpoint, re-execute node
6. Human-in-the-loop: pause after checkpoint, wait for external signal, resume

Checkpoint storage options: PostgreSQL (default), Redis (faster, less durable), or custom driver.

## Patterns

- **Every-node checkpoint**: Save state before each step — maximum durability, maximum overhead
- **Interval checkpoint**: Save every N nodes — reduces overhead, loses at most N steps on crash
- **Manual checkpoint**: Developer inserts checkpoint markers at critical boundaries only — fine-grained control
- **Deterministic replay**: For nodes that call external APIs (non-deterministic), cache API responses in checkpoints — replay uses cached responses, not real API calls

## Architectural Decisions

- **Decision**: Full state serialization vs. event sourcing → Full state snapshot. Reason: Simpler implementation, faster recovery (no event replay). Tradeoff: Larger storage per checkpoint, potential data duplication.
- **Decision**: DB persistence vs. Redis → DB default (PostgreSQL). Reason: ACID, joins, no data loss. Redis for performance-critical paths with acceptable data loss.
- **Decision**: Deterministic vs. flexible node execution → Flexible (nodes can be non-deterministic). Reason: Most real agents call external APIs. Tradeoff: Replay may produce different results.

## Tradeoffs

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Every-node checkpoint | Zero progress lost | N* overhead per workflow |
| Full state snapshot | Fast recovery | Larger storage, duplication |
| DB checkpoint storage | Durable, queryable | Slower than Redis |
| Deterministic replay | Predictable debugging | API response caching complexity |

## Performance Considerations

- Serialization overhead: 5-50ms per checkpoint (JSON) depending on state size
- State size: grows with conversation history — implement pruning or summary compression
- Storage: 10,000 workflows × 20 steps × 10KB = ~2GB — manageable but requires monitoring
- Recovery: load single row — <10ms typically
- Fork/replay: clone checkpoint row, create new execution ID

## Production Considerations

- Implement state TTL — workflows that completed or abandoned longer than X days, delete checkpoints
- Monitor checkpoint storage growth — alert on per-workflow state size anomalies
- Version state schemas — deploy schema migrations for existing checkpoints
- Implement workflow-level timeout — abandon workflows exceeding max duration
- Log checkpoint operations (save, load, fork) for observability
- Test crash recovery — simulate worker kill, verify resume

## Common Mistakes

- Checkpointing sensitive data (PII, API keys) in state — always implement state sanitization before serialization
- Non-deterministic tool calls that break replay — cache external API responses in state
- Infinite checkpoint growth — conversation state accumulates every step without pruning
- Not testing crash recovery paths — discover broken resume during production outage
- Over-checkpointing fast nodes — serialization overhead > execution time for trivial operations

## Failure Modes

- **Checkpoint corruption**: State fails to deserialize after code update — implement migration or fallback to initial state
- **Recovery loop**: Crash occurs at same node repeatedly — implement max retries per node
- **Storage exhaustion**: Unmonitored checkpoint growth fills disk — implement TTL and alerting
- **Inconsistent state**: Non-atomic checkpoint + crash produces partial state — checkpoint in transactions
- **Fork explosion**: Unbounded forking for debugging consumes storage — limit forks per workflow

## Ecosystem Usage

- Long-running research workflows that iterate for hours
- Customer onboarding with multi-day approval cycles
- Compliance workflows requiring audit trails of every agent decision
- High-value transactions where crash recovery is critical
- Debugging complex multi-agent interactions via checkpoint replay

## Related Knowledge Units

- KU-012: Multi-Agent Patterns
- KU-013: Graph-Based Workflows
- KU-015: Queued Agent Execution

## Research Notes

- `heinergiehl/agent-graph`: Only PHP package with durable checkpointing (MVP status)
- AgentGraph uses PostgreSQL for checkpoint storage with JSONB state column
- No PHP package supports event sourcing for agent state (unlike LangGraph Python)
- Fork/replay for debugging is a unique feature — not commonly available in PHP ecosystem
- Human-in-the-loop: agent pauses, sends notification (email/webhook), waits for approval API call, resumes
