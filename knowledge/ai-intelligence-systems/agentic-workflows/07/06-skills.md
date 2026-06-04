# Skills

## Skill 1: Build agent orchestration frameworks with async queue execution

### Purpose
Create an agent orchestration runtime that manages agent lifecycle (instantiation, loop execution, tool dispatch, completion) asynchronously via queue jobs, with human-in-the-loop pause points, retry/error handling policies, and an agent registry for discoverable agent definitions.

### When To Use
- Use when building production agent systems that need reliable execution
- Use when agent execution takes >5s and must not block HTTP workers
- Use when you need human-in-the-loop approval for critical agent actions
- Use when multiple agent definitions need to be centrally managed and discovered
- Use when retry, error handling, and monitoring are required for agent workflows

### When NOT To Use
- Do NOT use for simple single-step agents that complete in <5s
- Do NOT use without a queue infrastructure (Redis, SQS, database)
- Do NOT use when agents must run synchronously in HTTP requests (simple chat)
- Do NOT use without defining retry and error handling policies

### Prerequisites
- Laravel queue system configured (Redis, SQS, or database)
- Agent classes defined with tool sets and system prompts
- Agent registry for storing and discovering agent definitions
- Monitoring infrastructure for agent execution metrics
- Understanding of human-in-the-loop patterns

### Inputs
- Agent definition (system prompt, tools, model, memory config)
- Task input (user message or structured task)
- Queue job configuration (retry limits, timeouts, priority)
- Approval policies for human-in-the-loop steps

### Workflow
1. Define agents as declarative configurations (code, YAML, or JSON) with system prompt, tools, model, and memory
2. Create an agent registry for central management and discovery of agent definitions
3. Implement an orchestrator that manages agent lifecycle: instantiation, loop, tool dispatch, completion
4. Dispatch all agent executions as queue jobs, never run synchronously in HTTP requests
5. Implement retry and error handling:
   - Tool failures: retry with backoff
   - LLM errors: retry or escalate
   - Timeouts: fail gracefully with partial results
6. Implement human-in-the-loop (HITL) pause points:
   - Orchestrator pauses execution and emits an approval request event
   - Waiting for human approval before proceeding
   - Resume or cancel based on approval response
7. Set up monitoring: agent execution duration, step count, tool call frequency, error rates
8. Implement agent metrics and logging for observability

### Validation Checklist
- [ ] Agent execution runs asynchronously via queue jobs (not in HTTP request)
- [ ] Orchestrator handles agent lifecycle: init → loop → dispatch → complete
- [ ] Agent registry stores definitions with discovery support
- [ ] Retry policy handles tool failures with backoff
- [ ] Error handling provides graceful degradation on failure
- [ ] Human-in-the-loop pauses and resumes correctly
- [ ] Timeout handling prevents infinite execution
- [ ] Agent metrics are logged for monitoring
- [ ] Queue worker has sufficient capacity for expected agent workload

### Common Failures
- **Synchronous execution**: Agent runs in HTTP request — PHP-FPM worker blocked for 60+ seconds
- **No retry policy**: Tool fails once, agent execution fails entirely — implement retry with backoff
- **No human-in-the-loop**: Agent performs destructive action without approval — safety risk
- **Infinite loop**: Agent has no max iterations — runs indefinitely, exhausting queue and budget
- **No monitoring**: Agent failures go undetected until user reports issues

### Decision Points
- **Agent definition format**: PHP classes (type-safe) vs. YAML/JSON (dynamic loading)
- **Queue priority**: High-priority for user-facing agents, low-priority for batch processing
- **Retry strategy**: Linear backoff (simple) vs. exponential backoff (effective for rate limits)
- **HITL granularity**: Per-tool (safe) vs. per-execution (efficient)

### Performance Considerations
- Queue-based execution scales horizontally by adding more workers
- Agent execution can take 10-300 seconds — queue processing handles this without blocking
- HITL pauses can last minutes to hours — queue jobs should handle long pauses
- Agent registry lookups should be cached for fast instantiation
- Monitor queue backlog to detect agent execution bottlenecks

### Security Considerations
- HITL approval requests must be authenticated — only authorized users can approve
- Agent definitions in registry should be immutable after deployment (no runtime modification)
- Queue job serialization should not include secrets or credentials
- Agent execution context (user ID, session) must be securely passed to queue
- Audit log all agent executions and HITL decisions

### Related Rules
- R1: Run Agents Asynchronously via Queue — never run agents synchronously in HTTP web requests

### Related Skills
- Design multi-agent systems with strict tool boundaries
- Implement agent communication protocols with standardized envelopes
- Implement agent planning and reasoning strategies
- Implement agent memory and state persistence

### Success Criteria
- All agent executions run asynchronously via queue, never blocking HTTP workers
- Orchestrator manages complete agent lifecycle reliably
- Retry/error policies prevent agent failures from escalating
- Human-in-the-loop correctly pauses, awaits approval, and resumes
- Agent registry enables central management of all agent definitions
- Monitoring provides visibility into agent execution performance and errors
