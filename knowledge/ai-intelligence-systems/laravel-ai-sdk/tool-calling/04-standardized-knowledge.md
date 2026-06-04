---
id: KU-006
title: "Tool Calling"
subdomain: "laravel-ai-sdk"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/02-laravel-ai-sdk/tool-calling/04-standardized-knowledge.md"
---

# Tool Calling

## Overview

Tool calling lets LLMs invoke PHP methods dynamically. The Laravel AI SDK supports this via the `HasTools` interface and `Tool` classes. Tools are PHP classes implementing a `handle()` method and a JSON schema describing their inputs. The LLM decides when to call a tool, the SDK executes it, and the result is returned to the LLM for continued reasoning. This is the foundation for agentic behavior.

## Core Concepts

- `Tool` class: PHP class with `handle($input)` method and `jsonSchema()` definition
- `HasTools` interface: Agent declares tools via `tools()` method returning array of Tool instances
- Tool schema: Describes tool name, description, input parameters as JSON Schema
- Automatic execution: SDK intercepts LLM tool-call requests, executes `handle()`, returns result
- `MaxSteps`: Attribute limiting tool-call iterations (prevents infinite loops)
- Scoped tools: Tools receive scoped context via constructor injection (e.g., `$userId`)
- Read-only database connections: Tools can use separate DB user with read-only privileges

## When To Use

- Production applications requiring Tool Calling functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **One Tool, One Query**: Each tool handles one specific database query â€” prevents the LLM from constructing arbitrary SQL
- **Scoped Tools via Constructor**: Pass `$userId` into tool constructor, not from session in `handle()` â€” injection-proof user scoping
- **Result Limiting**: `select()` only needed columns, `limit(10)` caps rows â€” prevents context window overflow
- **Read-Only Connections**: Tools query through read-only database connection â€” even prompt injection can't mutate data
- **SimilaritySearch Tool**: Built-in tool for pgvector RAG â€” `minSimilarity` threshold prevents irrelevant results

- **Function calling for LLMs**: Like RPC â€” the LLM acts as an intelligent router deciding which PHP function to invoke and with what arguments.
- **Middleware for AI**: Tools are middleware between the LLM and your application data â€” they control exactly what the LLM can access and modify.
- **Controlled delegation**: The LLM can ask for data, but only through explicitly defined, sandboxed entry points.

## Architecture Guidelines

- **Decision**: Tool as PHP class vs. invokable â†’ Dedicated class per tool. Reason: Schema definition, DI support, testability, documentation via method signatures.
- **Decision**: Automatic tool execution vs. manual approval â†’ Automatic with configurable `MaxSteps`. Reason: Most use cases don't need human-in-the-loop; manual approval can be added at application layer.
- **Decision**: Tool results as conversation messages vs. transient â†’ Results appended to conversation history. Reason: LLM needs tool output for subsequent reasoning; context-aware Tool can omit results if desired.

## Performance Considerations

- Each tool call adds full result to context â€” token consumption grows linearly with steps
- `MaxSteps` default 10 â€” adjust per agent based on expected tool chain length
- Slow tools (HTTP calls, large DB queries) block the agent loop â€” offload to queue, return pending status
- Schema validation overhead is negligible (<1ms) per tool call

- **Automatic execution vs. security**: Automatic tool calls are faster but risk injection. Mitigation: Scoped tools, read-only connections, input validation.
- **Tool results in context vs. truncated**: Full result preserves context for LLM but costs tokens. Mitigation: Limit result size in `handle()`, truncate long outputs.
- **Synchronous tools vs. queued**: Synchronous keeps agent loop simple but blocks. Mitigation: Queue slow tools internally within `handle()`.

## Security Considerations

- Always scope tools to the authenticated user via constructor â€” never trust LLM-provided user identifiers
- Set database-level read-only roles for query tools
- Implement rate limiting on tool execution per session
- Log all tool invocations with inputs and outputs â€” audit trail for security and debugging
- Test tools independently from the LLM â€” unit test `handle()` with fixture inputs
- Set `MaxSteps` appropriate to the workflow â€” too low interrupts valid multi-step reasoning

## Common Mistakes

- Passing `$userId` from prompt instead of constructor â€” vulnerable to prompt injection
- Returning entire Eloquent models as tool output â€” serializes all attributes, including sensitive ones
- Not limiting result set size â€” massive output blows context window and token budget
- Registering tools that the LLM can't correctly choose (overlapping descriptions) â€” causes hallucinated tool calls
- No `MaxSteps` limit â€” agent loops indefinitely on complex requests

## Anti-Patterns

- **Tool argument injection**: LLM generates malicious arguments â€” validate arguments against schema before execution
- **Runaway tool chain**: Agent calls tools recursively without producing final answer â€” `MaxSteps` terminates loop
- **Tool not found**: LLM hallucinates a tool name â€” SDK throws, agent returns error message
- **Tool timeout**: `handle()` hangs â€” implement timeout within tool or use queue
- **Schema mismatch**: LLM generates arguments that don't match schema â€” SDK validates before execution

## Examples

The following ecosystem packages provide reference implementations:

- Database query tools (order search, user lookup, product catalog)
- External API tools (weather, stock prices, shipping rates)
- Vector search tools (SimilaritySearch for RAG)
- Computation tools (calculations, data transformation, validation)

## Related Topics

- KU-001: Laravel AI SDK Architecture
- KU-005: Structured Output with JSON Schema
- KU-011: Agent Architecture Fundamentals
- KU-027: Tool Argument Validation

## AI Agent Notes

- When asked about Tool Calling, first determine the specific use case and requirements.
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

