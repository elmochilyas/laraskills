# Skill: Build Agents with the Laravel AI SDK

## Purpose
Create PHP agent classes that encapsulate AI instructions, tools, memory, and output schemas using the `laravel/ai` SDK's provider-agnostic architecture.

## When To Use
- Production applications requiring structured AI interactions
- Teams building AI-powered features within Laravel applications
- Scenarios where agent-based patterns benefit from SDK abstractions

## When NOT To Use
- Simple applications that can rely on direct provider calls without abstraction
- Prototypes or experiments where SDK overhead isn't justified

## Prerequisites
- `laravel/ai` package installed and configured
- Provider API keys set in environment variables
- PHP 8.1+ with attributes support

## Inputs
- Agent instructions/persona
- Tool definitions (HasTools)
- Output schema (HasStructuredOutput)
- Conversation memory requirements

## Workflow
1. Create one agent class per distinct capability (single responsibility)
2. Apply the `Promptable` trait to every agent class
3. Declare static configuration as PHP attributes: `#[Provider]`, `#[Model]`, `#[Temperature]`
4. Set `#[MaxSteps]` on agents with tool access to prevent runaway loops
5. Register stateless agents as singletons in the service container
6. Use `Ai::fake()` with `Ai::preventStrayPrompts()` in all tests
7. Use `->stream()` for interactive streaming, `->queue()` for long-running agents
8. Inject user context (userId, tenantId) via constructor, never via prompt
9. Use `Ai::call()` for stateless text generation
10. Use `->withConversationId()` for multi-turn conversations with memory

## Validation Checklist
- [ ] One agent class per capability (no monolithic agents)
- [ ] `Promptable` trait applied to every agent
- [ ] Static config declared as PHP attributes (not properties)
- [ ] `#[MaxSteps]` set on agents with tool access
- [ ] Stateless agents registered as singletons via container
- [ ] `Ai::fake()` used in all tests with `preventStrayPrompts()`
- [ ] Long-running agents use `->queue()` or `->stream()`
- [ ] User context injected via constructor, not prompt

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Poor output quality | Monolithic agent | One agent per capability |
| `prompt()` method not found | Missing `Promptable` trait | Always apply `Promptable` |
| Agent loops infinitely | No `#[MaxSteps]` | Set `#[MaxSteps]` on tool-using agents |
| Worker pool exhaustion | Long synchronous calls | Use `->queue()` for agents >5s |
| Real API calls in tests | Missing fake | Apply `Ai::fake()` with `preventStrayPrompts()` |
| Privilege escalation | LLM-provided user IDs | Inject user context via constructor |
| High latency per request | New agent instance | Register as singleton in container |

## Decision Points
- **Agent scope:** Fine-grained (one per capability) vs coarse (multi-purpose)
- **Configuration style:** PHP attributes (static) vs methods (dynamic)
- **Execution mode:** `prompt()` (sync) vs `stream()` (interactive) vs `queue()` (background)
- **Instance lifetime:** Singleton (stateless) vs factory (context-dependent)

## Performance/Security Considerations
- Inject user context (userId, tenantId) via constructor, never via LLM-provided arguments
- Set `#[MaxSteps]` to prevent unbounded token consumption
- Use read-only database connections in agent tools
- Register stateless agents as singletons to reduce resolution overhead
- Long-running agents (>5s) must use `->queue()` or `->stream()`

## Related Rules
- laravel-ai-sdk-architecture/05-rules.md (all rules)

## Related Skills
- Implement Tool Calling with Agents
- Design Structured Output with JSON Schema
- Manage Conversation Memory
- Test Agents with Fakes

## Success Criteria
- Agent classes are focused (one per capability)
- All tests use `Ai::fake()` without real API calls
- Configuration is inspectable via PHP attributes
- Long-running agents don't block PHP workers
- User authorization is enforced via constructor injection, not LLM arguments
