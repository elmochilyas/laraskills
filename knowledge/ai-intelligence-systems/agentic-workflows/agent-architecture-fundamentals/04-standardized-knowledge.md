---
id: KU-011
title: "Agent Architecture Fundamentals"
subdomain: "agentic-workflows"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/03-agentic-workflows/agent-architecture-fundamentals/04-standardized-knowledge.md"
---

# Agent Architecture Fundamentals

## Overview

Agents in the Laravel AI SDK are PHP classes that encapsulate instructions (system prompt), conversation history, tools, and output schema. The agent class implements contracts to declare capabilities, and the SDK runtime handles LLM interaction, tool dispatch, memory persistence, streaming, and queueing. This is the foundational building block for all AI features.

## Core Concepts

- `Agent` contract: Base interface â€” requires `instructions(): Stringable|string`
- `Promptable` trait: Adds `prompt()`, `stream()`, `queue()` â€” the execution methods
- `HasTools`: Agent declares tools via `tools(): array`
- `HasStructuredOutput`: Agent declares schema via `schema(): JsonSchema`
- `Conversational`: Agent accepts existing message history
- `RemembersConversations`: Adds DB-persisted multi-turn memory
- `#[Provider]` / `#[Model]`: Attribute-based provider/model binding
- `#[Temperature]` / `#[MaxTokens]` / `#[MaxSteps]`: Execution parameter attributes

## When To Use

- Production applications requiring Agent Architecture Fundamentals functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Single-responsibility agents**: One class = one capability (e.g., `SupportAgent`, `SearchAgent`, `WriterAgent`)
- **Agent composition**: Multi-agent patterns route between agents for complex workflows
- **Constructor injection for context**: Pass user context, tenant info, configuration via constructor
- **Attribute-driven configuration**: All provider/model/execution config on the class â€” no external config files per agent

- **Agent as Service Class**: Like a Laravel service class that encapsulates business logic â€” the agent encapsulates AI interaction logic with a clean `prompt($input)` interface.
- **Agent as Controller**: Instructions = middleware, Tools = service calls, Output Schema = form request validation. The agent coordinates the AI equivalent of a request-response cycle.
- **Agent as Component**: Reusable, testable, single-responsibility class â€” assemble complex behavior by composing agents (multi-agent patterns).

## Architecture Guidelines

- **Decision**: Class-per-agent vs. configuration-driven â†’ Dedicated PHP class. Reason: DI support, testability, single responsibility, Artisan generator command.
- **Decision**: Attributes vs. methods for configuration â†’ Attributes for static config (provider, model), methods for dynamic config (instructions, tools, schema). Reason: Static analysis support, readability, separation of concerns.
- **Decision**: Fluent prompt interface vs. constructor parameters â†’ `prompt($input)` accepts string input; context via constructor. Reason: Clean API design â€” what changes per call vs. what's fixed per agent.

## Performance Considerations

- Agent class resolution via container â€” cached in production
- Conversation history loading â€” for long histories, consider summarization or sliding window
- Tool execution â€” synchronous tools block agent loop; queue long-running tools
- `MaxSteps` attribute limits iterations â€” prevents runaway token consumption

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Class-based agents | DI, testability, tooling | More ceremony than closures |
| Attribute configuration | Declarative, inspectable | Cannot change at runtime without reflection |
| DB-backed memory | Durable, queryable | Schema changes require migrations |

## Security Considerations

- Register agents as singletons in container if stateless (no constructor parameters)
- Test with `Ai::fake()` and `preventStrayPrompts()` â€” catch unintended API calls in test suite
- Configure `AI_PROVIDER` per environment â€” Ollama in dev, Anthropic in production
- Monitor conversation table size â€” implement pruning jobs
- Log agent execution for observability and debugging

## Common Mistakes

- Creating monolithic agents handling multiple domains â€” violates single responsibility, degrades output quality
- Not using `MaxSteps` â€” agent loops indefinitely on complex tool chains
- Passing mutable state via constructor â€” agent lifetime may be longer than expected
- Forgetting `Promptable` trait â€” prompts, stream, queue methods won't be available
- Testing without fakes â€” real API calls in CI, accruing costs and flaky tests

## Anti-Patterns

- **Agent loop**: LLM calls tools repeatedly without producing final answer â€” `MaxSteps` prevents infinite loop
- **Context window overflow**: Instructions + history + tools exceed token limit â€” summarize or truncate history
- **Provider timeout**: LLM takes too long to respond â€” configure HTTP timeout, implement retry
- **Tool exception**: Tool throws â€” agent returns error to user; log for debugging

## Examples

The following ecosystem packages provide reference implementations:

- All Laravel AI SDK projects use agents as their primary abstraction
- Third-party frameworks (LLPhant, Prism PHP) use similar concepts but with different APIs
- Filament admin panels can display agent activity via observability packages

## Related Topics

- KU-001: Laravel AI SDK Architecture
- KU-005: Structured Output with JSON Schema
- KU-006: Tool Calling
- KU-007: Conversation Memory
- KU-012: Multi-Agent Patterns

## AI Agent Notes

- When asked about Agent Architecture Fundamentals, first determine the specific use case and requirements.
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

