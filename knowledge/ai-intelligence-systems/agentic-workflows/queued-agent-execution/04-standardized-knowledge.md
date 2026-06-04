---
id: KU-015
title: "Queued Agent Execution"
subdomain: "agentic-workflows"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/03-agentic-workflows/queued-agent-execution/04-standardized-knowledge.md"
---

# Queued Agent Execution

## Overview

The Laravel AI SDK integrates natively with Laravel Queues via `->queue()` on any agent. This enables long-running AI tasks (document analysis, batch processing, multi-step workflows) to execute asynchronously without blocking HTTP workers. The `->queue()` method returns a promise-style interface with `->then()` and `->catch()` callbacks, and dispatches the agent execution to the default queue connection.

## Core Concepts

- `->queue($input)`: Dispatches agent execution to Laravel queue â€” returns immediately
- `->then($callback)`: Called on successful completion with `AgentResponse`
- `->catch($callback)`: Called on failure with `Throwable`
- Queue integration: Uses Laravel's Queue system â€” Redis, Database, SQS, etc.
- Scoping: Agent class + input serialized and dispatched to queue â€” agent must be serializable
- Promise-style API: Not real promises â€” fluent callbacks for completion/failure handling

## When To Use

- Production applications requiring Queued Agent Execution functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Fire-and-forget**: Call `queue()` without callbacks â€” agent runs, result is stored/lost
- **Notification on completion**: Use `->then()` to send notification (email, broadcast, webhook)
- **Chained processing**: Queue output triggers next agent in chain â€” `->then()` queues next agent
- **Error recovery**: `->catch()` sends alert, logs failure, retries with degraded model

- **Async/Await for AI**: Like JavaScript promises â€” dispatch agent, get notified when done. App remains responsive.
- **Queue job for AI**: Think of it as a specialized queued job with AI-specific callbacks and error handling.

## Architecture Guidelines

- **Decision**: SDK-managed queue job vs. custom job class â†’ SDK handles dispatch internally. Reason: Works with any agent without additional boilerplate.
- **Decision**: Promise-style callbacks vs. events â†’ Fluent callbacks. Reason: Familiar to JavaScript developers, keeps callback logic close to dispatch.
- **Decision**: Serialize full agent vs. re-instantiate from config â†’ Serialize agent (constructor params). Reason: Ensures agent context is preserved across queue boundary.

## Performance Considerations

- Queue job serialization adds ~10-50ms depending on agent complexity
- Worker concurrency affects throughput â€” allocate sufficient queue workers for AI workload
- Long-running agents (>30s) should use dedicated queue with `--queue=ai` for worker isolation
- Callback jobs add additional queue entries â€” 2 queue jobs per agent execution (main + callback)

- **Queue overhead**: ~50-200ms additional latency for job dispatch + serialization
- **Serialization limits**: Agent constructor parameters must be serializable (no closures, no resources)
- **Callback chaining complexity**: Multiple `->then()` calls can become hard to follow vs. explicit job classes

## Security Considerations

- Use dedicated queue connection for AI workloads â€” separate from email, notification queues
- Configure `queue.after_commit` on AI jobs â€” prevent job dispatch if transaction rolls back
- Monitor AI queue depth and worker saturation â€” long agent execution blocks other jobs
- Implement job middleware for AI queue: rate limiting, retry delay, failure handling
- Set `$tries` and `$timeout` on agent execution via attributes or config
- Log job UUID for tracing agent execution across queue and application logs

## Common Mistakes

- Using `queue()` for trivial agents (<2s) â€” synchronous `prompt()` is simpler for fast operations
- Not handling callback exceptions â€” `->catch()` is not set â†’ failures silently swallowed
- Serializing non-serializable constructor parameters (Eloquent models with loaded relations)
- Overloading a single queue with AI + non-AI jobs â€” AI jobs block throughput for other operations
- Forgetting to start queue workers in production â€” jobs queue but never execute

## Anti-Patterns

- **Job timeout**: Agent execution exceeds `$timeout` â€” job fails, optionally retries
- **Serialization failure**: Constructor parameter fails to serialize â€” job fails immediately
- **Queue backpressure**: All workers busy with long AI jobs â€” other jobs starve
- **Callback failure**: `->then()` callback throws â€” agent result lost, callback gets retried separately
- **Memory exhaustion**: Agent consumes too much memory during execution â€” worker OOM

## Examples

The following ecosystem packages provide reference implementations:

- Background document analysis and summarization
- Batch email classification and response generation
- Scheduled AI reporting (via Laravel Scheduler + queue)
- Webhook-triggered AI processing pipelines
- Multi-agent workflows where each agent runs asynchronously

## Related Topics

- KU-011: Agent Architecture Fundamentals
- KU-012: Multi-Agent Patterns
- KU-014: Durable Agent Runtime

## AI Agent Notes

- When asked about Queued Agent Execution, first determine the specific use case and requirements.
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

