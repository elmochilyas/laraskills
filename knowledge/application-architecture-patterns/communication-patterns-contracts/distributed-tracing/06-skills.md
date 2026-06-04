# Skill: Implement Distributed Tracing Across Bounded Contexts

## Purpose
Assign a correlation ID at every entry point. Propagate the correlation ID on every context boundary crossing. Automate propagation via middleware — never rely on manual passing. Use structured logging with `Log::withContext()`. Include causation ID for causal chain building. Apply sampling for high-traffic systems.

## When To Use
- Debugging cross-context issues
- Performance bottleneck detection across boundaries
- Understanding request flows in complex systems

## When NOT To Use
- Single-context applications with no cross-boundary communication

## Prerequisites
- Event design with correlation/causation IDs (CPC-04)
- Message bus understanding (CPC-05)

## Inputs
- Entry point definitions (HTTP, queue, CLI)
- Context boundary map

## Workflow
1. **Assign a correlation ID at every entry point.** Every external entry point (HTTP request, queue message, CLI command) gets a correlation ID. Use middleware for HTTP, job middleware for queues.

2. **Propagate correlation ID on every boundary crossing.** Every context boundary, message bus call, or queue push must propagate the correlation ID. Breaking the propagation chain loses the trace.

3. **Automate propagation — never rely on manual passing.** Use automatic mechanisms like job middleware, event subscribers, or bus middleware. Manual propagation depends on developer discipline and leads to gaps.

4. **Use structured logging with correlation ID.** Include the correlation ID in every log entry via `Log::withContext()`. Never use string interpolation — structured logging enables filtering and aggregation.

5. **Include causation ID for building causal chains.** Include both correlation ID (original operation) and causation ID (immediate parent event). Causation ID builds the causal chain showing which event triggered which.

6. **Apply sampling strategies for high-traffic systems.** Trace 1 in N requests (e.g., 1 in 100). Never store traces for every request in high-throughput systems without cost control.

## Validation Checklist
- [ ] Correlation ID assigned at all entry points
- [ ] Correlation ID propagated through events/jobs/boundaries
- [ ] Propagation is automated (middleware/subscribers, not manual)
- [ ] Structured logging includes correlation ID
- [ ] Causation ID included for causal chain building
- [ ] Sampling applied for high-traffic systems

## Common Failures
- **No propagation.** Correlation ID set at HTTP boundary but not passed to queued events — disconnected traces.
- **Manual propagation everywhere.** Developers must remember to pass the ID — gaps when they forget.
- **No structured logging.** Correlation IDs logged via string interpolation — cannot filter/search in log aggregation tools.

## Decision Points
- **Sampling rate?** 1 in 100 for high-traffic systems. Always-trace critical paths (payment, auth failures) irrespective of sampling rate.
- **Automatic vs manual propagation?** Always automatic via middleware. Manual is fragile.

## Performance Considerations
- Correlation ID propagation adds negligible overhead (passing a string).
- Trace storage costs for high-traffic systems — mitigated by sampling.
- Sampling strategies for production to control costs.

## Security Considerations
- Correlation IDs should not contain sensitive data. Use UUIDs.

## Related Rules
- Rule: Assign a correlation ID at every entry point (CPC-11/05-rules.md)
- Rule: Propagate correlation ID on every boundary crossing (CPC-11/05-rules.md)
- Rule: Automate propagation (CPC-11/05-rules.md)
- Rule: Use structured logging with correlation ID (CPC-11/05-rules.md)
- Rule: Include causation ID for building causal chains (CPC-11/05-rules.md)
- Rule: Apply sampling strategies for high-traffic systems (CPC-11/05-rules.md)

## Related Skills
- Design Event Payloads (CPC-04/06-skills.md)
- Implement Message Bus (CPC-05/06-skills.md)
- Implement Observability (AEG-06/06-skills.md)
- Implement Monitoring Dashboards (AEG-08/06-skills.md)

## Success Criteria
- Every entry point (HTTP, queue, CLI) automatically generates or receives a correlation ID.
- Correlation ID propagates across all event, job, and HTTP boundaries without manual developer intervention.
- All log entries include a structured `correlation_id` field via `Log::withContext()`.
- Event envelopes include both correlation ID (trace) and causation ID (causal chain).
- High-traffic systems use sampling to control trace storage costs.
