# Knowledge Unit: Agent Architecture Fundamentals

## Metadata

- **ID:** KU-011
- **Subdomain:** Agent Architecture & Orchestration
- **Slug:** agent-architecture-fundamentals
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Agents in the Laravel AI SDK are PHP classes that encapsulate instructions (system prompt), conversation history, tools, and output schema. The agent class implements contracts to declare capabilities, and the SDK runtime handles LLM interaction, tool dispatch, memory persistence, streaming, and queueing. This is the foundational building block for all AI features.

## Core Concepts

- `Agent` contract: Base interface — requires `instructions(): Stringable|string`
- `Promptable` trait: Adds `prompt()`, `stream()`, `queue()` — the execution methods
- `HasTools`: Agent declares tools via `tools(): array`
- `HasStructuredOutput`: Agent declares schema via `schema(): JsonSchema`
- `Conversational`: Agent accepts existing message history
- `RemembersConversations`: Adds DB-persisted multi-turn memory
- `#[Provider]` / `#[Model]`: Attribute-based provider/model binding
- `#[Temperature]` / `#[MaxTokens]` / `#[MaxSteps]`: Execution parameter attributes

## Mental Models

- **Agent as Service Class**: Like a Laravel service class that encapsulates business logic — the agent encapsulates AI interaction logic with a clean `prompt($input)` interface.
- **Agent as Controller**: Instructions = middleware, Tools = service calls, Output Schema = form request validation. The agent coordinates the AI equivalent of a request-response cycle.
- **Agent as Component**: Reusable, testable, single-responsibility class — assemble complex behavior by composing agents (multi-agent patterns).

## Internal Mechanics

Agent execution lifecycle:
1. Agent instantiation — container resolves dependencies
2. Build context — compile instructions, conversation history (if `RemembersConversations`), tools, schema
3. Send to provider — SDK builds provider-specific request from unified context
4. Receive response — parse provider response, validate (if schema)
5. Tool loop — if response includes tool call → execute tool → return result to LLM → repeat
6. Return final response — typed `AiResponse` or `StreamedAgentResponse`

The `prompt()` method is synchronous and blocking. `stream()` returns an event stream. `queue()` dispatches to Laravel queue for background execution with promise-style `->then()` / `->catch()` handling.

## Patterns

- **Single-responsibility agents**: One class = one capability (e.g., `SupportAgent`, `SearchAgent`, `WriterAgent`)
- **Agent composition**: Multi-agent patterns route between agents for complex workflows
- **Constructor injection for context**: Pass user context, tenant info, configuration via constructor
- **Attribute-driven configuration**: All provider/model/execution config on the class — no external config files per agent

## Architectural Decisions

- **Decision**: Class-per-agent vs. configuration-driven → Dedicated PHP class. Reason: DI support, testability, single responsibility, Artisan generator command.
- **Decision**: Attributes vs. methods for configuration → Attributes for static config (provider, model), methods for dynamic config (instructions, tools, schema). Reason: Static analysis support, readability, separation of concerns.
- **Decision**: Fluent prompt interface vs. constructor parameters → `prompt($input)` accepts string input; context via constructor. Reason: Clean API design — what changes per call vs. what's fixed per agent.

## Tradeoffs

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Class-based agents | DI, testability, tooling | More ceremony than closures |
| Attribute configuration | Declarative, inspectable | Cannot change at runtime without reflection |
| DB-backed memory | Durable, queryable | Schema changes require migrations |

## Performance Considerations

- Agent class resolution via container — cached in production
- Conversation history loading — for long histories, consider summarization or sliding window
- Tool execution — synchronous tools block agent loop; queue long-running tools
- `MaxSteps` attribute limits iterations — prevents runaway token consumption

## Production Considerations

- Register agents as singletons in container if stateless (no constructor parameters)
- Test with `Ai::fake()` and `preventStrayPrompts()` — catch unintended API calls in test suite
- Configure `AI_PROVIDER` per environment — Ollama in dev, Anthropic in production
- Monitor conversation table size — implement pruning jobs
- Log agent execution for observability and debugging

## Common Mistakes

- Creating monolithic agents handling multiple domains — violates single responsibility, degrades output quality
- Not using `MaxSteps` — agent loops indefinitely on complex tool chains
- Passing mutable state via constructor — agent lifetime may be longer than expected
- Forgetting `Promptable` trait — prompts, stream, queue methods won't be available
- Testing without fakes — real API calls in CI, accruing costs and flaky tests

## Failure Modes

- **Agent loop**: LLM calls tools repeatedly without producing final answer — `MaxSteps` prevents infinite loop
- **Context window overflow**: Instructions + history + tools exceed token limit — summarize or truncate history
- **Provider timeout**: LLM takes too long to respond — configure HTTP timeout, implement retry
- **Tool exception**: Tool throws — agent returns error to user; log for debugging

## Ecosystem Usage

- All Laravel AI SDK projects use agents as their primary abstraction
- Third-party frameworks (LLPhant, Prism PHP) use similar concepts but with different APIs
- Filament admin panels can display agent activity via observability packages

## Related Knowledge Units

- KU-001: Laravel AI SDK Architecture
- KU-005: Structured Output with JSON Schema
- KU-006: Tool Calling
- KU-007: Conversation Memory
- KU-012: Multi-Agent Patterns

## Research Notes

- Agents introduced February 2026 with Laravel AI SDK beta
- `prompt()` became the standard method name after community feedback — originally `run()`, `call()`, `send()`
- `MaxSteps` default was unlimited in early betas — changed to 10 after production incidents
- Laravel AI SDK blog series covers 5 agent patterns: chains, routing, parallelization, orchestrator-workers, sub-agents
