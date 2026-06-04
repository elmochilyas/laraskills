---
id: KU-014
title: "Durable Agent Runtime"
subdomain: "agentic-workflows"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/03-agentic-workflows/durable-agent-runtime/04-standardized-knowledge.md"
---

# Durable Agent Runtime

## Overview

Durable agent runtimes (AgentGraph, Conductor) enable agent workflows to survive process restarts, server crashes, and long pauses. They achieve this through checkpointing â€” persisting the agent's full state at each step boundary. This enables pause/resume, fork/replay from any checkpoint, and human-in-the-loop interruptions that last hours or days.

## Core Concepts

- **Checkpointing**: Serialized snapshot of agent state (memory, stack, variables) at execution boundaries
- **Durable execution**: Workflow resumes from last checkpoint after crash â€” no progress lost
- **Pause/Resume**: Agent pauses at defined points (e.g., waiting for human input), resumes later
- **Fork/Replay**: Clone a checkpoint, replay from that point with different inputs â€” debugging and what-if analysis
- **State schema**: Typed definition of what state is preserved across checkpoints
- **Idempotency**: Replaying a checkpoint produces the same result â€” deterministic nodes

## When To Use

- Production applications requiring Durable Agent Runtime functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Every-node checkpoint**: Save state before each step â€” maximum durability, maximum overhead
- **Interval checkpoint**: Save every N nodes â€” reduces overhead, loses at most N steps on crash
- **Manual checkpoint**: Developer inserts checkpoint markers at critical boundaries only â€” fine-grained control
- **Deterministic replay**: For nodes that call external APIs (non-deterministic), cache API responses in checkpoints â€” replay uses cached responses, not real API calls

- **Database transaction log for AI**: Like PostgreSQL WAL â€” every state change is logged, enabling rollback and recovery.
- **Video game save point**: The agent state is saved at checkpoints. Crash? Load the last save. Want to try a different approach? Fork from a checkpoint.
- **Laravel queue with replay**: Like failed queue jobs that you can retry, but with full agent state preserved.

## Architecture Guidelines

- **Decision**: Full state serialization vs. event sourcing â†’ Full state snapshot. Reason: Simpler implementation, faster recovery (no event replay). Tradeoff: Larger storage per checkpoint, potential data duplication.
- **Decision**: DB persistence vs. Redis â†’ DB default (PostgreSQL). Reason: ACID, joins, no data loss. Redis for performance-critical paths with acceptable data loss.
- **Decision**: Deterministic vs. flexible node execution â†’ Flexible (nodes can be non-deterministic). Reason: Most real agents call external APIs. Tradeoff: Replay may produce different results.

## Performance Considerations

- Serialization overhead: 5-50ms per checkpoint (JSON) depending on state size
- State size: grows with conversation history â€” implement pruning or summary compression
- Storage: 10,000 workflows Ã— 20 steps Ã— 10KB = ~2GB â€” manageable but requires monitoring
- Recovery: load single row â€” <10ms typically
- Fork/replay: clone checkpoint row, create new execution ID

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Every-node checkpoint | Zero progress lost | N* overhead per workflow |
| Full state snapshot | Fast recovery | Larger storage, duplication |
| DB checkpoint storage | Durable, queryable | Slower than Redis |
| Deterministic replay | Predictable debugging | API response caching complexity |

## Security Considerations

- Implement state TTL â€” workflows that completed or abandoned longer than X days, delete checkpoints
- Monitor checkpoint storage growth â€” alert on per-workflow state size anomalies
- Version state schemas â€” deploy schema migrations for existing checkpoints
- Implement workflow-level timeout â€” abandon workflows exceeding max duration
- Log checkpoint operations (save, load, fork) for observability
- Test crash recovery â€” simulate worker kill, verify resume

## Common Mistakes

- Checkpointing sensitive data (PII, API keys) in state â€” always implement state sanitization before serialization
- Non-deterministic tool calls that break replay â€” cache external API responses in state
- Infinite checkpoint growth â€” conversation state accumulates every step without pruning
- Not testing crash recovery paths â€” discover broken resume during production outage
- Over-checkpointing fast nodes â€” serialization overhead > execution time for trivial operations

## Anti-Patterns

- **Checkpoint corruption**: State fails to deserialize after code update â€” implement migration or fallback to initial state
- **Recovery loop**: Crash occurs at same node repeatedly â€” implement max retries per node
- **Storage exhaustion**: Unmonitored checkpoint growth fills disk â€” implement TTL and alerting
- **Inconsistent state**: Non-atomic checkpoint + crash produces partial state â€” checkpoint in transactions
- **Fork explosion**: Unbounded forking for debugging consumes storage â€” limit forks per workflow

## Examples

The following ecosystem packages provide reference implementations:

- Long-running research workflows that iterate for hours
- Customer onboarding with multi-day approval cycles
- Compliance workflows requiring audit trails of every agent decision
- High-value transactions where crash recovery is critical
- Debugging complex multi-agent interactions via checkpoint replay

## Related Topics

- KU-012: Multi-Agent Patterns
- KU-013: Graph-Based Workflows
- KU-015: Queued Agent Execution

## AI Agent Notes

- When asked about Durable Agent Runtime, first determine the specific use case and requirements.
- Reference the core concepts as foundational understanding before diving into implementation.
- Consider the architecture guidelines when designing the solution.
- Review common mistakes and anti-patterns to avoid pitfalls.
- Check related topics for complementary knowledge units.

## Verification

- [ ] Core concepts are understood and applied correctly.
- [ ] Best practices from the patterns section are followed.
- [ ] Architecture guidelines are implemented.
- [ ] Performance implications are accounted for in the design.
- [ ] Security considerations are addressed.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.

