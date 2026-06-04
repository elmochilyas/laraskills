# Skill: Implement Queued Agent Execution
## Purpose
Offload long-running AI agent tasks to Laravel queues using `->queue()` for asynchronous execution with completion and error callbacks.
## When To Use
- Long-running AI tasks (>5s): document analysis, batch processing, multi-step workflows
- Webhook-triggered AI processing pipelines
- Scheduled AI reporting via Laravel Scheduler + queue
- Multi-agent workflows where each agent runs asynchronously
## When NOT To Use
- Simple, fast agents (<2s) — synchronous `prompt()` is simpler and faster
- Prototypes where queue infrastructure isn't set up
## Prerequisites
- Laravel AI SDK installed
- Queue connection configured (Redis, Database, or SQS)
- Queue worker running: `php artisan queue:work`
- Agent class with `Promptable` trait
## Inputs
- Agent instance with serializable constructor parameters
- Agent `queue()` call with input
- Optional `then()` and `catch()` callbacks
- Queue connection configuration
## Workflow (numbered)
1. Ensure agent constructor parameters are serializable (primitives, model IDs not models)
2. Configure dedicated queue connection for AI workloads in `config/queue.php`
3. Call `$agent->queue($input)->then($onSuccess)->catch($onError)`
4. Implement `then()` callback for notification, chained processing, or result storage
5. Implement `catch()` callback for error alerting, logging, or degraded-model retry
6. Set `$tries` and `$timeout` on agent execution via attributes or config
7. Monitor AI queue depth and worker saturation with alerting
8. Log job UUID for tracing agent execution across queue and application logs
## Validation Checklist
- [ ] Agent constructor parameters are serializable (no Eloquent models with relations, no closures)
- [ ] Dedicated queue connection configured for AI workloads
- [ ] `then()` callback handles successful completion
- [ ] `catch()` callback handles failures gracefully
- [ ] `$tries` and `$timeout` configured appropriately
- [ ] AI queue depth monitoring in place with alerting
- [ ] Job UUID logged for traceability
- [ ] Queue workers running with `--queue=ai` isolation
## Common Failures
- Using `queue()` for trivial agents (<2s) — unnecessary overhead
- Not handling callback exceptions — `catch()` not set, failures silently swallowed
- Serializing non-serializable constructor parameters (Eloquent models)
- Overloading single queue with AI + non-AI jobs
- Forgetting to start queue workers — jobs queue but never execute
## Decision Points
- **Dedicated vs shared queue**: Dedicated AI queue for long-running job isolation; shared only for low-traffic apps
- **Promise callbacks vs custom job classes**: SDK `->then()/->catch()` for simple flows; custom job class for complex orchestration
- **Synchronous vs queued**: Use `prompt()` for <2s, `queue()` for >5s agents
## Performance Considerations
- Queue job serialization adds ~10-50ms depending on agent complexity
- Worker concurrency affects throughput — allocate sufficient workers for AI workload
- Long-running agents (>30s) need dedicated queue with worker isolation
- Callback jobs add additional queue entries — 2 jobs per agent execution
- Queue overhead: ~50-200ms additional latency for dispatch + serialization
## Security Considerations
- Use dedicated queue connection for AI workloads — separate from email, notification queues
- Configure `queue.after_commit` on AI jobs — prevent dispatch if transaction rolls back
- Monitor AI queue depth and worker saturation — long agents block other jobs
- Implement job middleware for AI queue: rate limiting, retry delay, failure handling
- Log job UUID for tracing across queue and application logs
## Related Rules (from 05-rules.md)
- Use `->queue()` for Long-Running Agents Only
- Use Dedicated Queue Connection for AI Workloads
- Ensure Agent is Serializable
## Related Skills
- Create a Single-Responsibility Agent Class
- Implement Multi-Agent Patterns
- Implement Durable Agent Workflows with Checkpointing
## Success Criteria
- Long-running agents execute asynchronously without blocking HTTP workers
- Completion callbacks notify users or trigger next workflow step
- Error callbacks handle failures with retry or graceful degradation
- AI queue isolation prevents interference with other job types
- Queue depth monitoring provides early warning of backpressure
