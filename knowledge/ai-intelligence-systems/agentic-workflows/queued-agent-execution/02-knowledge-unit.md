# Knowledge Unit: Queued Agent Execution

## Metadata

- **ID:** KU-015
- **Subdomain:** Agent Architecture & Orchestration
- **Slug:** queued-agent-execution
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

The Laravel AI SDK integrates natively with Laravel Queues via `->queue()` on any agent. This enables long-running AI tasks (document analysis, batch processing, multi-step workflows) to execute asynchronously without blocking HTTP workers. The `->queue()` method returns a promise-style interface with `->then()` and `->catch()` callbacks, and dispatches the agent execution to the default queue connection.

## Core Concepts

- `->queue($input)`: Dispatches agent execution to Laravel queue — returns immediately
- `->then($callback)`: Called on successful completion with `AgentResponse`
- `->catch($callback)`: Called on failure with `Throwable`
- Queue integration: Uses Laravel's Queue system — Redis, Database, SQS, etc.
- Scoping: Agent class + input serialized and dispatched to queue — agent must be serializable
- Promise-style API: Not real promises — fluent callbacks for completion/failure handling

## Mental Models

- **Async/Await for AI**: Like JavaScript promises — dispatch agent, get notified when done. App remains responsive.
- **Queue job for AI**: Think of it as a specialized queued job with AI-specific callbacks and error handling.

## Internal Mechanics

When `->queue()` is called:
1. SDK serializes the agent instance (constructor parameters) and input
2. Dispatches a queued job (internal `ProcessAgentJob`) to Laravel queue
3. Returns `PendingAgentExecution` — fluent object with `->then()` / `->catch()` methods
4. Queue worker picks up the job → deserializes agent → calls `->prompt()` → stores result
5. After completion, executes `->then()` callback (or `->catch()` on failure)
6. Callbacks are themselves queued — executed by queue worker after main job completes

## Patterns

- **Fire-and-forget**: Call `queue()` without callbacks — agent runs, result is stored/lost
- **Notification on completion**: Use `->then()` to send notification (email, broadcast, webhook)
- **Chained processing**: Queue output triggers next agent in chain — `->then()` queues next agent
- **Error recovery**: `->catch()` sends alert, logs failure, retries with degraded model

## Architectural Decisions

- **Decision**: SDK-managed queue job vs. custom job class → SDK handles dispatch internally. Reason: Works with any agent without additional boilerplate.
- **Decision**: Promise-style callbacks vs. events → Fluent callbacks. Reason: Familiar to JavaScript developers, keeps callback logic close to dispatch.
- **Decision**: Serialize full agent vs. re-instantiate from config → Serialize agent (constructor params). Reason: Ensures agent context is preserved across queue boundary.

## Tradeoffs

- **Queue overhead**: ~50-200ms additional latency for job dispatch + serialization
- **Serialization limits**: Agent constructor parameters must be serializable (no closures, no resources)
- **Callback chaining complexity**: Multiple `->then()` calls can become hard to follow vs. explicit job classes

## Performance Considerations

- Queue job serialization adds ~10-50ms depending on agent complexity
- Worker concurrency affects throughput — allocate sufficient queue workers for AI workload
- Long-running agents (>30s) should use dedicated queue with `--queue=ai` for worker isolation
- Callback jobs add additional queue entries — 2 queue jobs per agent execution (main + callback)

## Production Considerations

- Use dedicated queue connection for AI workloads — separate from email, notification queues
- Configure `queue.after_commit` on AI jobs — prevent job dispatch if transaction rolls back
- Monitor AI queue depth and worker saturation — long agent execution blocks other jobs
- Implement job middleware for AI queue: rate limiting, retry delay, failure handling
- Set `$tries` and `$timeout` on agent execution via attributes or config
- Log job UUID for tracing agent execution across queue and application logs

## Common Mistakes

- Using `queue()` for trivial agents (<2s) — synchronous `prompt()` is simpler for fast operations
- Not handling callback exceptions — `->catch()` is not set → failures silently swallowed
- Serializing non-serializable constructor parameters (Eloquent models with loaded relations)
- Overloading a single queue with AI + non-AI jobs — AI jobs block throughput for other operations
- Forgetting to start queue workers in production — jobs queue but never execute

## Failure Modes

- **Job timeout**: Agent execution exceeds `$timeout` — job fails, optionally retries
- **Serialization failure**: Constructor parameter fails to serialize — job fails immediately
- **Queue backpressure**: All workers busy with long AI jobs — other jobs starve
- **Callback failure**: `->then()` callback throws — agent result lost, callback gets retried separately
- **Memory exhaustion**: Agent consumes too much memory during execution — worker OOM

## Ecosystem Usage

- Background document analysis and summarization
- Batch email classification and response generation
- Scheduled AI reporting (via Laravel Scheduler + queue)
- Webhook-triggered AI processing pipelines
- Multi-agent workflows where each agent runs asynchronously

## Related Knowledge Units

- KU-011: Agent Architecture Fundamentals
- KU-012: Multi-Agent Patterns
- KU-014: Durable Agent Runtime

## Research Notes

- `->queue()` added in v0.1.0 — was originally `->dispatch()`, renamed in v0.2.0 for consistency
- Queue driver support: Redis (recommended for production), Database (for development), SQS
- Callbacks use Laravel's serializable closures (Laravel 13 feature)
- No built-in progress reporting for queued agents — implement custom progress via events
